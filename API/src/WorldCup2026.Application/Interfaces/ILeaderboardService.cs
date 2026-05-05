using WorldCup2026.Application.Common;
using WorldCup2026.Application.DTOs.Leaderboard;

namespace WorldCup2026.Application.Interfaces;

public interface ILeaderboardService
{
    Task<Result<List<LeaderboardEntryDto>>> GetLeaderboardAsync(Guid groupId);
    Task<Result<DashboardDto>> GetDashboardAsync(Guid groupId);
    Task SnapshotLeaderboardAsync(Guid groupId);
}
