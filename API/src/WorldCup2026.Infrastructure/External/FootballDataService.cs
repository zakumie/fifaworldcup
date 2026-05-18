using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using WorldCup2026.Application.Interfaces;
using WorldCup2026.Domain.Entities;
using WorldCup2026.Domain.Enums;
using WorldCup2026.Infrastructure.Data;

namespace WorldCup2026.Infrastructure.External;

public class FootballDataService : IExternalMatchService
{
    private readonly HttpClient _http;
    private readonly AppDbContext _db;
    private readonly ILogger<FootballDataService> _logger;

    public FootballDataService(
        IHttpClientFactory httpFactory,
        AppDbContext db,
        IConfiguration config,
        ILogger<FootballDataService> logger)
    {
        _http = httpFactory.CreateClient("FootballData");
        _http.BaseAddress = new Uri("https://api.football-data.org/v4/");
        _http.DefaultRequestHeaders.Add("X-Auth-Token", config["FootballData:ApiKey"] ?? "");
        _db = db;
        _logger = logger;
    }

    public async Task<int> SyncTeamsAsync()
    {
        try
        {
            var response = await _http.GetStringAsync("competitions/WC/teams");
            using var doc = JsonDocument.Parse(response);
            var teams = doc.RootElement.GetProperty("teams");
            int count = 0;

            var existingCodes = (await _db.Teams.Select(x => x.Code).ToListAsync()).ToHashSet();

            foreach (var t in teams.EnumerateArray())
            {
                string code = t.GetProperty("tla").GetString() ?? "";
                if (existingCodes.Contains(code)) continue;

                _db.Teams.Add(new Team
                {
                    Name = t.GetProperty("name").GetString() ?? "",
                    Code = code,
                    FlagUrl = t.TryGetProperty("crest", out var crest) ? crest.GetString() : null
                });
                count++;
            }

            await _db.SaveChangesAsync();
            _logger.LogInformation("Synced {Count} teams from football-data.org", count);
            return count;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to sync teams");
            return 0;
        }
    }

    public async Task<int> SyncMatchesAsync()
    {
        try
        {
            var response = await _http.GetStringAsync("competitions/WC/matches");
            using var doc = JsonDocument.Parse(response);
            var matches = doc.RootElement.GetProperty("matches");
            int count = 0;

            // Preload lookups to avoid N+1 queries
            var existingMatches = await _db.Matches
                .Where(x => x.ExternalMatchId != null)
                .ToDictionaryAsync(x => x.ExternalMatchId!.Value);
            var teamsByCode = await _db.Teams
                .ToDictionaryAsync(t => t.Code);

            foreach (var m in matches.EnumerateArray())
            {
                int externalId = m.GetProperty("id").GetInt32();
                existingMatches.TryGetValue(externalId, out var existing);

                string homeCode = m.GetProperty("homeTeam").GetProperty("tla").GetString() ?? "";
                string awayCode = m.GetProperty("awayTeam").GetProperty("tla").GetString() ?? "";
                teamsByCode.TryGetValue(homeCode, out var homeTeam);
                teamsByCode.TryGetValue(awayCode, out var awayTeam);
                if (homeTeam == null || awayTeam == null)
                {
                    _logger.LogWarning("Skipping match {ExternalId}: team not found - Home={HomeCode}({Found1}) Away={AwayCode}({Found2})",
                        externalId, homeCode, homeTeam != null, awayCode, awayTeam != null);
                    continue;
                }

                string status = m.GetProperty("status").GetString() ?? "";
                string? group = m.TryGetProperty("group", out var grp) ? grp.GetString() : null;
                var matchStatus = status switch
                {
                    "SCHEDULED" or "TIMED" => MatchStatus.Open,
                    "IN_PLAY" or "PAUSED" => MatchStatus.Live,
                    "FINISHED" => MatchStatus.Finished,
                    "POSTPONED" => MatchStatus.Postponed,
                    "CANCELLED" => MatchStatus.Cancelled,
                    _ => MatchStatus.Open
                };

                int? homeScore = null, awayScore = null;
                if (m.TryGetProperty("score", out var score))
                {
                    var ft = score.GetProperty("fullTime");
                    if (ft.TryGetProperty("home", out var hs) && hs.ValueKind == JsonValueKind.Number)
                        homeScore = hs.GetInt32();
                    if (ft.TryGetProperty("away", out var aws) && aws.ValueKind == JsonValueKind.Number)
                        awayScore = aws.GetInt32();
                }

                if (existing != null)
                {
                    // Don't update matches that have already completed
                    if (existing.Status == MatchStatus.Finished)
                        continue;

                    // Don't overwrite Upcoming (admin-configured) back to Open (external initial)
                    if (!(existing.Status == MatchStatus.Upcoming && matchStatus == MatchStatus.Open))
                        existing.Status = matchStatus;
                    existing.HomeScore = homeScore;
                    existing.AwayScore = awayScore;
                    existing.Group = group;
                }
                else
                {
                    _db.Matches.Add(new Match
                    {
                        ExternalMatchId = externalId,
                        HomeTeamId = homeTeam.Id,
                        AwayTeamId = awayTeam.Id,
                        MatchDay = m.TryGetProperty("matchday", out var md) ? md.GetInt32() : 0,
                        Stage = m.GetProperty("stage").GetString() ?? "GROUP_STAGE",
                        Group = group,
                        StartTime = m.GetProperty("utcDate").GetDateTime(),
                        Status = matchStatus,
                        HomeScore = homeScore,
                        AwayScore = awayScore
                    });
                    count++;
                }
            }

            await _db.SaveChangesAsync();
            _logger.LogInformation("Synced {Count} new matches, updated existing", count);
            return count;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to sync matches");
            return 0;
        }
    }
}
