using WorldCup2026.Application.Common;
using WorldCup2026.Application.DTOs.Matches;

namespace WorldCup2026.Application.Interfaces;

public interface IMatchService
{
    Task<Result<MatchDto>> CreateAsync(CreateMatchRequest request);
    Task<Result<MatchDto>> UpdateAsync(Guid matchId, UpdateMatchRequest request);
    Task<Result> DeleteAsync(Guid matchId);
    Task<Result<MatchDto>> GetByIdAsync(Guid matchId);
    Task<Result<PagedResult<MatchDto>>> GetListAsync(MatchListRequest request);
    Task<Result<MatchDto>> UpdateScoreAsync(Guid matchId, UpdateScoreRequest request);
    Task<Result<int>> SyncFromExternalAsync();
    Task<Result<int>> SyncTeamsAsync();
    Task<Result<List<TeamDto>>> GetTeamsAsync();
}
