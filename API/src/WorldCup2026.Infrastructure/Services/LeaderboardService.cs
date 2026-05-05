using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WorldCup2026.Application.Common;
using WorldCup2026.Application.DTOs.Leaderboard;
using WorldCup2026.Application.Interfaces;
using WorldCup2026.Domain.Entities;
using WorldCup2026.Domain.Enums;
using WorldCup2026.Infrastructure.Data;

namespace WorldCup2026.Infrastructure.Services;

public class LeaderboardService : ILeaderboardService
{
    private readonly AppDbContext _db;
    private readonly ICacheService _cache;
    private readonly ILogger<LeaderboardService> _logger;

    public LeaderboardService(AppDbContext db, ICacheService cache, ILogger<LeaderboardService> logger)
    {
        _db = db;
        _cache = cache;
        _logger = logger;
    }

    public async Task<Result<List<LeaderboardEntryDto>>> GetLeaderboardAsync(Guid groupId)
    {
        string cacheKey = $"leaderboard:{groupId}";
        var cached = await _cache.GetAsync<List<LeaderboardEntryDto>>(cacheKey);
        if (cached != null) return Result<List<LeaderboardEntryDto>>.Success(cached);

        var entries = await _db.Bets
            .Where(b => b.GroupId == groupId && b.Status != BetStatus.Pending && b.Status != BetStatus.Cancelled)
            .GroupBy(b => new { b.UserId, b.User.DisplayName, b.User.AvatarUrl })
            .Select(g => new LeaderboardEntryDto(
                0,
                g.Key.UserId,
                g.Key.DisplayName,
                g.Key.AvatarUrl,
                g.Count(),
                g.Count(b => b.Status == BetStatus.Won || b.Status == BetStatus.HalfWon),
                g.Count(b => b.Status == BetStatus.Lost || b.Status == BetStatus.HalfLost),
                g.Where(b => b.Profit > 0).Sum(b => b.Profit),
                g.Where(b => b.Profit < 0).Sum(b => Math.Abs(b.Profit)),
                g.Sum(b => b.Profit)))
            .OrderByDescending(e => e.NetProfit)
            .ToListAsync();

        var ranked = entries.Select((e, i) => e with { Rank = i + 1 }).ToList();
        await _cache.SetAsync(cacheKey, ranked, TimeSpan.FromMinutes(5));

        return Result<List<LeaderboardEntryDto>>.Success(ranked);
    }

    public async Task<Result<DashboardDto>> GetDashboardAsync(Guid groupId)
    {
        var leaderboardResult = await GetLeaderboardAsync(groupId);
        if (!leaderboardResult.Succeeded)
            return Result<DashboardDto>.Failure(leaderboardResult.Error!);

        var leaderboard = leaderboardResult.Data!;

        var topWinners = leaderboard.OrderByDescending(e => e.NetProfit).Take(5).ToList();
        var topLosers = leaderboard.OrderBy(e => e.NetProfit).Take(5).ToList();

        var highestBets = await _db.Bets
            .Where(b => b.GroupId == groupId)
            .OrderByDescending(b => b.BetAmount)
            .Take(5)
            .Include(b => b.User)
            .Include(b => b.Match).ThenInclude(m => m.HomeTeam)
            .Include(b => b.Match).ThenInclude(m => m.AwayTeam)
            .AsNoTracking()
            .Select(b => new HighestBetDto(
                b.UserId, b.User.DisplayName, b.BetAmount,
                b.Match.HomeTeam.Name, b.Match.AwayTeam.Name))
            .ToListAsync();

        int totalMembers = await _db.GroupMembers.CountAsync(m => m.GroupId == groupId && m.IsActive);
        int totalBets = await _db.Bets.CountAsync(b => b.GroupId == groupId);
        int totalMatches = await _db.Bets.Where(b => b.GroupId == groupId)
            .Select(b => b.MatchId).Distinct().CountAsync();
        decimal totalWagered = await _db.Bets.Where(b => b.GroupId == groupId).SumAsync(b => b.BetAmount);

        var stats = new GroupStatsDto(totalMembers, totalBets, totalMatches, totalWagered);

        return Result<DashboardDto>.Success(new DashboardDto(topWinners, topLosers, highestBets, stats));
    }

    public async Task SnapshotLeaderboardAsync(Guid groupId)
    {
        var leaderboardResult = await GetLeaderboardAsync(groupId);
        if (!leaderboardResult.Succeeded) return;

        var snapshots = leaderboardResult.Data!.Select(e => new LeaderboardSnapshot
        {
            GroupId = groupId,
            UserId = e.UserId,
            TotalBets = e.TotalBets,
            TotalWins = e.TotalWins,
            TotalLosses = e.TotalLosses,
            TotalWinAmount = e.TotalWinAmount,
            TotalLossAmount = e.TotalLossAmount,
            NetProfit = e.NetProfit,
            Rank = e.Rank,
            SnapshotDate = DateTime.UtcNow.Date
        });

        _db.LeaderboardSnapshots.AddRange(snapshots);
        await _db.SaveChangesAsync();
    }
}
