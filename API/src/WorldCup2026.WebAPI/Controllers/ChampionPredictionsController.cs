using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorldCup2026.Application.DTOs.Predictions;
using WorldCup2026.Application.Interfaces;

namespace WorldCup2026.WebAPI.Controllers;

[Authorize]
public class ChampionPredictionsController : BaseApiController
{
    private readonly IChampionPredictionService _predictions;
    private readonly ICurrentUser _currentUser;

    public ChampionPredictionsController(IChampionPredictionService predictions, ICurrentUser currentUser)
    {
        _predictions = predictions;
        _currentUser = currentUser;
    }

    [HttpPost("configs")]
    public async Task<ActionResult> CreateConfig([FromBody] CreateChampionConfigRequest request)
        => HandleResult(await _predictions.CreateConfigAsync(request, _currentUser.UserId));

    [HttpPut("groups/{groupId:guid}/config")]
    public async Task<ActionResult> UpdateConfig(Guid groupId, [FromBody] UpdateChampionConfigRequest request)
        => HandleResult(await _predictions.UpdateConfigAsync(groupId, request, _currentUser.UserId));

    [HttpGet("groups/{groupId:guid}/config")]
    public async Task<ActionResult> GetConfig(Guid groupId)
        => HandleResult(await _predictions.GetConfigAsync(groupId));

    [HttpPost("predictions")]
    public async Task<ActionResult> PlacePrediction([FromBody] PlaceChampionPredictionRequest request)
        => HandleResult(await _predictions.PlacePredictionAsync(request, _currentUser.UserId));

    [HttpGet("groups/{groupId:guid}/predictions/mine")]
    public async Task<ActionResult> GetMyPrediction(Guid groupId)
        => HandleResult(await _predictions.GetUserPredictionAsync(groupId, _currentUser.UserId));

    [HttpGet("groups/{groupId:guid}/predictions")]
    public async Task<ActionResult> GetGroupPredictions(Guid groupId)
        => HandleResult(await _predictions.GetGroupPredictionsAsync(groupId));

    [HttpPost("groups/{groupId:guid}/settle")]
    public async Task<ActionResult> SettlePredictions(Guid groupId, [FromBody] SettleChampionPredictionRequest request)
        => HandleResult(await _predictions.SettlePredictionsAsync(groupId, request.WinnerTeamId, _currentUser.UserId));
}
