using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorldCup2026.Application.Interfaces;

namespace WorldCup2026.WebAPI.Controllers;

[Authorize]
public class LeaderboardController : BaseApiController
{
    private readonly ILeaderboardService _leaderboard;

    public LeaderboardController(ILeaderboardService leaderboard) => _leaderboard = leaderboard;

    [HttpGet("groups/{groupId:guid}")]
    public async Task<ActionResult> GetLeaderboard(Guid groupId)
        => HandleResult(await _leaderboard.GetLeaderboardAsync(groupId));

    [HttpGet("groups/{groupId:guid}/dashboard")]
    public async Task<ActionResult> GetDashboard(Guid groupId)
        => HandleResult(await _leaderboard.GetDashboardAsync(groupId));
}
