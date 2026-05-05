using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using WorldCup2026.Application.Interfaces;
using WorldCup2026.Domain.Enums;
using WorldCup2026.Infrastructure.Data;

namespace WorldCup2026.Infrastructure.BackgroundJobs;

public class MatchFetchJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<MatchFetchJob> _logger;

    public MatchFetchJob(IServiceScopeFactory scopeFactory, ILogger<MatchFetchJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var externalService = scope.ServiceProvider.GetRequiredService<IExternalMatchService>();
                await externalService.SyncMatchesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in MatchFetchJob");
            }

            // Check if any match is live or starting soon — poll faster
            bool hasLiveMatches = false;
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                hasLiveMatches = await db.Matches.AnyAsync(
                    m => m.Status == MatchStatus.Live ||
                         (m.Status == MatchStatus.Scheduled && m.StartTime <= DateTime.UtcNow.AddHours(1)),
                    stoppingToken);
            }
            catch { /* ignore */ }

            var delay = hasLiveMatches ? TimeSpan.FromMinutes(5) : TimeSpan.FromHours(6);
            await Task.Delay(delay, stoppingToken);
        }
    }
}

public class BetSettlementJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<BetSettlementJob> _logger;

    public BetSettlementJob(IServiceScopeFactory scopeFactory, ILogger<BetSettlementJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var bettingService = scope.ServiceProvider.GetRequiredService<IBettingService>();

                var unsettledConfigs = await db.MatchBettingConfigs
                    .Include(c => c.Match)
                    .Where(c => !c.IsSettled && c.Match.Status == MatchStatus.Finished
                                && c.Match.HomeScore.HasValue && c.Match.AwayScore.HasValue)
                    .ToListAsync(stoppingToken);

                foreach (var config in unsettledConfigs)
                {
                    var result = await bettingService.SettleMatchBetsAsync(config.MatchId, config.GroupId);
                    if (result.Succeeded)
                        _logger.LogInformation("Auto-settled match {MatchId} group {GroupId}: {Count} bets",
                            config.MatchId, config.GroupId, result.Data);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in BetSettlementJob");
            }

            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }
    }
}

public class LeaderboardSnapshotJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<LeaderboardSnapshotJob> _logger;

    public LeaderboardSnapshotJob(IServiceScopeFactory scopeFactory, ILogger<LeaderboardSnapshotJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            // Wait until midnight UTC
            var now = DateTime.UtcNow;
            var nextMidnight = now.Date.AddDays(1);
            var delay = nextMidnight - now;
            await Task.Delay(delay, stoppingToken);

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var leaderboardService = scope.ServiceProvider.GetRequiredService<ILeaderboardService>();

                var groupIds = await db.Groups
                    .Where(g => g.IsActive)
                    .Select(g => g.Id)
                    .ToListAsync(stoppingToken);

                foreach (var groupId in groupIds)
                {
                    await leaderboardService.SnapshotLeaderboardAsync(groupId);
                }

                _logger.LogInformation("Leaderboard snapshots created for {Count} groups", groupIds.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in LeaderboardSnapshotJob");
            }
        }
    }
}
