using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WorldCup2026.Application.Common;
using WorldCup2026.Application.DTOs.Matches;
using WorldCup2026.Application.Interfaces;
using WorldCup2026.Domain.Entities;
using WorldCup2026.Infrastructure.Data;

namespace WorldCup2026.Infrastructure.Services;

public class MatchService : IMatchService
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;
    private readonly IExternalMatchService _externalService;
    private readonly ICacheService _cache;
    private readonly ILogger<MatchService> _logger;

    public MatchService(
        AppDbContext db, IMapper mapper,
        IExternalMatchService externalService,
        ICacheService cache,
        ILogger<MatchService> logger)
    {
        _db = db;
        _mapper = mapper;
        _externalService = externalService;
        _cache = cache;
        _logger = logger;
    }

    public async Task<Result<MatchDto>> CreateAsync(CreateMatchRequest request)
    {
        var match = new Match
        {
            HomeTeamId = request.HomeTeamId,
            AwayTeamId = request.AwayTeamId,
            MatchDay = request.MatchDay,
            Stage = request.Stage,
            StartTime = request.StartTime
        };

        _db.Matches.Add(match);
        await _db.SaveChangesAsync();
        await _cache.RemoveByPrefixAsync("matches:");

        return Result<MatchDto>.Success(await GetMatchDtoAsync(match.Id));
    }

    public async Task<Result<MatchDto>> UpdateAsync(Guid matchId, UpdateMatchRequest request)
    {
        var match = await _db.Matches.FindAsync(matchId);
        if (match == null) return Result<MatchDto>.Failure("Match not found.");

        match.HomeTeamId = request.HomeTeamId;
        match.AwayTeamId = request.AwayTeamId;
        match.MatchDay = request.MatchDay;
        match.Stage = request.Stage;
        match.StartTime = request.StartTime;
        match.Status = request.Status;

        await _db.SaveChangesAsync();
        await _cache.RemoveByPrefixAsync("matches:");

        return Result<MatchDto>.Success(await GetMatchDtoAsync(match.Id));
    }

    public async Task<Result> DeleteAsync(Guid matchId)
    {
        var match = await _db.Matches.FindAsync(matchId);
        if (match == null) return Result.Failure("Match not found.");

        match.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _cache.RemoveByPrefixAsync("matches:");

        return Result.Success();
    }

    public async Task<Result<MatchDto>> GetByIdAsync(Guid matchId)
    {
        var dto = await GetMatchDtoAsync(matchId);
        return dto != null
            ? Result<MatchDto>.Success(dto)
            : Result<MatchDto>.Failure("Match not found.");
    }

    public async Task<Result<PagedResult<MatchDto>>> GetListAsync(MatchListRequest request)
    {
        var query = _db.Matches
            .Include(m => m.HomeTeam)
            .Include(m => m.AwayTeam)
            .AsNoTracking()
            .AsQueryable();

        if (request.Status.HasValue)
            query = query.Where(m => m.Status == request.Status.Value);
        if (!string.IsNullOrEmpty(request.Stage))
            query = query.Where(m => m.Stage == request.Stage);
        if (request.FromDate.HasValue)
            query = query.Where(m => m.StartTime >= request.FromDate.Value);
        if (request.ToDate.HasValue)
            query = query.Where(m => m.StartTime <= request.ToDate.Value);

        int total = await query.CountAsync();
        var items = await query
            .OrderBy(m => m.StartTime)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(m => new MatchDto(
                m.Id, m.ExternalMatchId,
                new TeamDto(m.HomeTeam.Id, m.HomeTeam.Name, m.HomeTeam.Code, m.HomeTeam.FlagUrl, m.HomeTeam.GroupName),
                new TeamDto(m.AwayTeam.Id, m.AwayTeam.Name, m.AwayTeam.Code, m.AwayTeam.FlagUrl, m.AwayTeam.GroupName),
                m.HomeScore, m.AwayScore, m.MatchDay, m.Stage, m.StartTime, m.Status))
            .ToListAsync();

        return Result<PagedResult<MatchDto>>.Success(new PagedResult<MatchDto>
        {
            Items = items,
            TotalCount = total,
            Page = request.Page,
            PageSize = request.PageSize
        });
    }

    public async Task<Result<MatchDto>> UpdateScoreAsync(Guid matchId, UpdateScoreRequest request)
    {
        var match = await _db.Matches.FindAsync(matchId);
        if (match == null) return Result<MatchDto>.Failure("Match not found.");

        match.HomeScore = request.HomeScore;
        match.AwayScore = request.AwayScore;
        match.Status = request.Status;

        await _db.SaveChangesAsync();
        await _cache.RemoveByPrefixAsync("matches:");

        return Result<MatchDto>.Success(await GetMatchDtoAsync(match.Id));
    }

    public async Task<Result<int>> SyncFromExternalAsync()
    {
        int synced = await _externalService.SyncMatchesAsync();
        await _cache.RemoveByPrefixAsync("matches:");
        return Result<int>.Success(synced);
    }

    public async Task<Result<List<TeamDto>>> GetTeamsAsync()
    {
        const string cacheKey = "teams:all";
        var cached = await _cache.GetAsync<List<TeamDto>>(cacheKey);
        if (cached != null) return Result<List<TeamDto>>.Success(cached);

        var teams = await _db.Teams
            .AsNoTracking()
            .OrderBy(t => t.GroupName).ThenBy(t => t.Name)
            .Select(t => new TeamDto(t.Id, t.Name, t.Code, t.FlagUrl, t.GroupName))
            .ToListAsync();

        await _cache.SetAsync(cacheKey, teams, TimeSpan.FromHours(24));
        return Result<List<TeamDto>>.Success(teams);
    }

    private async Task<MatchDto> GetMatchDtoAsync(Guid matchId)
    {
        return await _db.Matches
            .Include(m => m.HomeTeam)
            .Include(m => m.AwayTeam)
            .AsNoTracking()
            .Where(m => m.Id == matchId)
            .Select(m => new MatchDto(
                m.Id, m.ExternalMatchId,
                new TeamDto(m.HomeTeam.Id, m.HomeTeam.Name, m.HomeTeam.Code, m.HomeTeam.FlagUrl, m.HomeTeam.GroupName),
                new TeamDto(m.AwayTeam.Id, m.AwayTeam.Name, m.AwayTeam.Code, m.AwayTeam.FlagUrl, m.AwayTeam.GroupName),
                m.HomeScore, m.AwayScore, m.MatchDay, m.Stage, m.StartTime, m.Status))
            .FirstOrDefaultAsync();
    }
}
