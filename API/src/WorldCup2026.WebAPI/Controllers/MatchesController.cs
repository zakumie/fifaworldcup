using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorldCup2026.Application.DTOs.Matches;
using WorldCup2026.Application.Interfaces;

namespace WorldCup2026.WebAPI.Controllers;

[Authorize]
public class MatchesController : BaseApiController
{
    private readonly IMatchService _matches;

    public MatchesController(IMatchService matches) => _matches = matches;

    [HttpGet]
    public async Task<ActionResult> GetList([FromQuery] MatchListRequest request)
        => HandleResult(await _matches.GetListAsync(request));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult> GetById(Guid id)
        => HandleResult(await _matches.GetByIdAsync(id));

    [HttpPost]
    public async Task<ActionResult> Create(CreateMatchRequest request)
        => HandleResult(await _matches.CreateAsync(request));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult> Update(Guid id, UpdateMatchRequest request)
        => HandleResult(await _matches.UpdateAsync(id, request));

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id)
        => HandleResult(await _matches.DeleteAsync(id));

    [HttpPut("{id:guid}/score")]
    public async Task<ActionResult> UpdateScore(Guid id, UpdateScoreRequest request)
        => HandleResult(await _matches.UpdateScoreAsync(id, request));

    [HttpPost("sync")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult> SyncFromExternal()
        => HandleResult(await _matches.SyncFromExternalAsync());

    [HttpGet("teams")]
    public async Task<ActionResult> GetTeams()
        => HandleResult(await _matches.GetTeamsAsync());
}
