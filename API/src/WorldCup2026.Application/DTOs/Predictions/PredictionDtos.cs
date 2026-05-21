namespace WorldCup2026.Application.DTOs.Predictions;

public record CreateChampionConfigRequest(
    Guid GroupId,
    bool IsEnabled,
    DateTime PredictionOpenTime,
    DateTime PredictionCloseTime);

public record UpdateChampionConfigRequest(
    bool IsEnabled,
    DateTime PredictionOpenTime,
    DateTime PredictionCloseTime);

public record ChampionConfigDto(
    Guid Id,
    Guid GroupId,
    bool IsEnabled,
    DateTime PredictionOpenTime,
    DateTime PredictionCloseTime,
    Guid? WinnerTeamId,
    string? WinnerTeamName,
    bool IsSettled,
    DateTime CreatedAt);

public record PlaceChampionPredictionRequest(
    Guid GroupId,
    Guid SelectedTeamId);

public record ChampionPredictionDto(
    Guid Id,
    Guid UserId,
    string UserDisplayName,
    Guid GroupId,
    Guid ConfigId,
    Guid SelectedTeamId,
    string SelectedTeamName,
    bool? IsCorrect,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public record SettleChampionPredictionRequest(
    Guid GroupId,
    Guid WinnerTeamId);
