using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorldCup2026.Application.DTOs.Betting;
using WorldCup2026.Application.Interfaces;

namespace WorldCup2026.WebAPI.Controllers;

[Authorize]
public class BettingController : BaseApiController
{
    private readonly IBettingService _betting;
    private readonly ICurrentUser _currentUser;

    public BettingController(IBettingService betting, ICurrentUser currentUser)
    {
        _betting = betting;
        _currentUser = currentUser;
    }

    [HttpPost("configs")]
    public async Task<ActionResult> CreateConfig([FromBody] CreateBettingConfigRequest request)
        => HandleResult(await _betting.CreateConfigAsync(request, _currentUser.UserId));

    [HttpPut("configs/{configId:guid}")]
    public async Task<ActionResult> UpdateConfig(Guid configId, [FromBody] UpdateBettingConfigRequest request)
        => HandleResult(await _betting.UpdateConfigAsync(configId, request, _currentUser.UserId));

    [HttpGet("configs")]
    public async Task<ActionResult> GetConfig([FromQuery] Guid matchId, [FromQuery] Guid groupId)
        => HandleResult(await _betting.GetConfigAsync(matchId, groupId));

    [HttpGet("groups/{groupId:guid}/configs")]
    public async Task<ActionResult> GetGroupConfigs(Guid groupId)
        => HandleResult(await _betting.GetGroupConfigsAsync(groupId));

    [HttpPost("bets")]
    public async Task<ActionResult> PlaceBet(PlaceBetRequest request)
        => HandleResult(await _betting.PlaceBetAsync(request, _currentUser.UserId));

    [HttpGet("groups/{groupId:guid}/bets")]
    public async Task<ActionResult> GetMyBets(Guid groupId)
        => HandleResult(await _betting.GetUserBetsAsync(groupId, _currentUser.UserId));

    [HttpGet("groups/{groupId:guid}/matches/{matchId:guid}/bets")]
    public async Task<ActionResult> GetMatchBets(Guid groupId, Guid matchId)
        => HandleResult(await _betting.GetMatchBetsAsync(groupId, matchId));

    [HttpPost("groups/{groupId:guid}/matches/{matchId:guid}/settle")]
    public async Task<ActionResult> SettleBets(Guid groupId, Guid matchId)
        => HandleResult(await _betting.SettleMatchBetsAsync(matchId, groupId));
}
