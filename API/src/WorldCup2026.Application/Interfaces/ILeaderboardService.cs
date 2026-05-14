using WorldCup2026.Application.Common;
using WorldCup2026.Application.DTOs.Leaderboard;

namespace WorldCup2026.Application.Interfaces;

public interface ILeaderboardService
{
    Task<Result<List<LeaderboardEntryDto>>> GetLeaderboardAsync(Guid groupId, CancellationToken ct = default);
    Task<Result<DashboardDto>> GetDashboardAsync(Guid groupId, CancellationToken ct = default);
    Task SnapshotLeaderboardAsync(Guid groupId);
}
