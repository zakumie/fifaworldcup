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

    public async Task<Result<List<LeaderboardEntryDto>>> GetLeaderboardAsync(Guid groupId, CancellationToken ct = default)
    {
        //string cacheKey = $"leaderboard:{groupId}";
        //var cached = await _cache.GetAsync<List<LeaderboardEntryDto>>(cacheKey);
        //if (cached != null) return Result<List<LeaderboardEntryDto>>.Success(cached);

        var members = await _db.GroupMembers
            .AsNoTracking()
            .Include(m => m.User)
            .Where(m => m.GroupId == groupId && m.IsActive)
            .ToListAsync(ct);

        var betStats = await _db.Bets
            .AsNoTracking()
            .Where(b => b.GroupId == groupId && b.Status != BetStatus.Cancelled)
            .GroupBy(b => b.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                TotalBets = g.Count(),
                Wins = g.Count(b => b.Status == BetStatus.Won || b.Status == BetStatus.HalfWon),
                Losses = g.Count(b => b.Status == BetStatus.Lost || b.Status == BetStatus.HalfLost),
                Draws = g.Count(b => b.Status == BetStatus.Push),
                TotalWagered = g.Sum(b => b.Status != BetStatus.Pending ? b.BetAmount : 0),
                TotalPayout = g.Sum(b => b.Status != BetStatus.Pending ? b.BetAmount + b.Profit : 0),
                Profit = g.Sum(b => b.Status != BetStatus.Pending ? b.Profit : 0),
            })
            .ToDictionaryAsync(e => e.UserId, ct);

        var entries = members
            .Select(m =>
            {
                betStats.TryGetValue(m.UserId, out var s);
                int totalBets = s?.TotalBets ?? 0;
                int wins = s?.Wins ?? 0;
                int losses = s?.Losses ?? 0;
                int draws = s?.Draws ?? 0;
                decimal profit = s?.Profit ?? 0;
                int settledBets = wins + losses + draws;
                decimal winRate = settledBets > 0 ? (decimal)wins / settledBets : 0;
                return new
                {
                    m.UserId,
                    m.User.DisplayName,
                    m.User.AvatarUrl,
                    TotalBets = totalBets,
                    Wins = wins,
                    Losses = losses,
                    Draws = draws,
                    TotalWagered = s?.TotalWagered ?? 0,
                    TotalPayout = s?.TotalPayout ?? 0,
                    Profit = profit,
                    Balance = m.Balance + m.RewardAmount,
                    WinRate = Math.Round(winRate, 4),
                    PenaltyAmount = m.PenaltyAmount,
                    RewardAmount = m.RewardAmount
                };
            })
            .OrderByDescending(e => e.Balance)
            .ThenByDescending(e => e.Wins)
            .ThenByDescending(e => e.WinRate)
            .ToList();

        // Get previous snapshot for rank change calculation
        var previousSnapshot = await _db.LeaderboardSnapshots
            .AsNoTracking()
            .Where(s => s.GroupId == groupId)
            .GroupBy(s => s.UserId)
            .Select(g => g.OrderByDescending(s => s.SnapshotDate).First())
            .ToDictionaryAsync(s => s.UserId, ct);

        // Calculate streak per user (consecutive wins/losses from most recent settled bets)
        var userStreaks = await _db.Bets
            .AsNoTracking()
            .Where(b => b.GroupId == groupId && b.Status != BetStatus.Cancelled && b.Status != BetStatus.Pending)
            .GroupBy(b => b.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                RecentBets = g.OrderByDescending(b => b.SettledAt).Take(20)
                    .Select(b => b.Status).ToList()
            })
            .ToDictionaryAsync(x => x.UserId, x => x.RecentBets, ct);

        // Assign ranks with ties: same Balance + Wins + WinRate = same rank, next rank skips
        var ranks = new int[entries.Count];
        for (int i = 0; i < entries.Count; i++)
        {
            if (i == 0)
            {
                ranks[i] = 1;
            }
            else if (entries[i].Balance == entries[i - 1].Balance
                  && entries[i].Wins == entries[i - 1].Wins
                  && entries[i].WinRate == entries[i - 1].WinRate)
            {
                ranks[i] = ranks[i - 1]; // tied rank
            }
            else
            {
                ranks[i] = i + 1; // standard competition ranking (skip)
            }
        }

        var ranked = entries.Select((e, i) =>
        {
            int rank = ranks[i];
            int rankChange = 0;
            if (previousSnapshot.TryGetValue(e.UserId, out var prev))
                rankChange = prev.Rank - rank; // positive = moved up

            int streak = 0;
            if (userStreaks.TryGetValue(e.UserId, out var recentBets))
            {
                foreach (var status in recentBets)
                {
                    if (status == BetStatus.Won || status == BetStatus.HalfWon)
                    {
                        if (streak >= 0) streak++;
                        else break;
                    }
                    else if (status == BetStatus.Lost || status == BetStatus.HalfLost)
                    {
                        if (streak <= 0) streak--;
                        else break;
                    }
                    else // Push
                    {
                        break;
                    }
                }
            }

            return new LeaderboardEntryDto(
                rank, e.UserId, e.DisplayName, e.AvatarUrl,
                e.TotalBets, e.Wins, e.Losses, e.Draws,
                e.TotalWagered, e.TotalPayout, e.Profit,
                e.Balance, e.WinRate, e.PenaltyAmount,
                rankChange, streak, e.RewardAmount);
        }).ToList();

      //  await _cache.SetAsync(cacheKey, ranked, TimeSpan.FromMinutes(5));
        return Result<List<LeaderboardEntryDto>>.Success(ranked);
    }

    public async Task<Result<DashboardDto>> GetDashboardAsync(Guid groupId, CancellationToken ct = default)
    {
        var leaderboardResult = await GetLeaderboardAsync(groupId, ct);
        if (!leaderboardResult.Succeeded)
            return Result<DashboardDto>.Failure(leaderboardResult.Error!);

        var leaderboard = leaderboardResult.Data!;

        var topWinners = leaderboard.OrderByDescending(e => e.Profit).Take(5).ToList();
        var topLosers = leaderboard.OrderBy(e => e.Profit).Take(5).ToList();

        var highestBets = await _db.Bets
            .AsNoTracking()
            .Where(b => b.GroupId == groupId)
            .OrderByDescending(b => b.BetAmount)
            .Take(5)
            .Select(b => new HighestBetDto(
                b.UserId, b.User.DisplayName, b.BetAmount,
                b.Match.HomeTeam.Name, b.Match.AwayTeam.Name))
            .ToListAsync(ct);

        var stats = await _db.Bets
            .AsNoTracking()
            .Where(b => b.GroupId == groupId)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                TotalBets = g.Count(),
                TotalMatches = g.Select(b => b.MatchId).Distinct().Count(),
                TotalWagered = g.Sum(b => b.BetAmount),
            })
            .FirstOrDefaultAsync(ct);

        int totalMembers = await _db.GroupMembers.CountAsync(m => m.GroupId == groupId && m.IsActive, ct);

        var groupStats = new GroupStatsDto(
            totalMembers,
            stats?.TotalBets ?? 0,
            stats?.TotalMatches ?? 0,
            stats?.TotalWagered ?? 0);

        return Result<DashboardDto>.Success(new DashboardDto(topWinners, topLosers, highestBets, groupStats));
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
            TotalWins = e.Wins,
            TotalLosses = e.Losses,
            TotalWinAmount = e.TotalWagered,
            TotalLossAmount = e.TotalPayout,
            NetProfit = e.Profit,
            Rank = e.Rank,
            SnapshotDate = DateTime.UtcNow.Date
        });

        _db.LeaderboardSnapshots.AddRange(snapshots);
        await _db.SaveChangesAsync();
    }
}
