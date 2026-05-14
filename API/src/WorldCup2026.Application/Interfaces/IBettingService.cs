using WorldCup2026.Application.Common;
using WorldCup2026.Application.DTOs.Betting;

namespace WorldCup2026.Application.Interfaces;

public interface IBettingService
{
    Task<Result<BettingConfigDto>> CreateConfigAsync(CreateBettingConfigRequest request, Guid userId);
    Task<Result<BettingConfigDto>> UpdateConfigAsync(Guid configId, UpdateBettingConfigRequest request, Guid userId);
    Task<Result<BettingConfigDto>> GetConfigAsync(Guid matchId, Guid groupId);
    Task<Result<List<BettingConfigDto>>> GetGroupConfigsAsync(Guid groupId);
    Task<Result<BetDto>> PlaceBetAsync(PlaceBetRequest request, Guid userId);
    Task<Result<BetDto>> UpdateBetAsync(Guid betId, UpdateBetRequest request, Guid userId);
    Task<Result<List<BetDto>>> GetUserBetsAsync(Guid groupId, Guid userId);
    Task<Result<List<BetDto>>> GetMatchBetsAsync(Guid groupId, Guid matchId);
    Task<Result<int>> SettleMatchBetsAsync(Guid matchId, Guid groupId);
}
