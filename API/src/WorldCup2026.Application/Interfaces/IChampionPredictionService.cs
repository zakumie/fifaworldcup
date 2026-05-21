using WorldCup2026.Application.Common;
using WorldCup2026.Application.DTOs.Predictions;

namespace WorldCup2026.Application.Interfaces;

public interface IChampionPredictionService
{
    Task<Result<ChampionConfigDto>> CreateConfigAsync(CreateChampionConfigRequest request, Guid userId);
    Task<Result<ChampionConfigDto>> UpdateConfigAsync(Guid groupId, UpdateChampionConfigRequest request, Guid userId);
    Task<Result<ChampionConfigDto>> GetConfigAsync(Guid groupId);
    Task<Result<ChampionPredictionDto>> PlacePredictionAsync(PlaceChampionPredictionRequest request, Guid userId);
    Task<Result<ChampionPredictionDto?>> GetUserPredictionAsync(Guid groupId, Guid userId);
    Task<Result<List<ChampionPredictionDto>>> GetGroupPredictionsAsync(Guid groupId);
    Task<Result<int>> SettlePredictionsAsync(Guid groupId, Guid winnerTeamId, Guid userId);
}
