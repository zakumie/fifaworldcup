using WorldCup2026.Domain.Enums;

namespace WorldCup2026.Application.DTOs.Betting;

public record CreateBettingConfigRequest(
    Guid MatchId, Guid GroupId, decimal Handicap,
    Guid? FavoredTeamId, decimal Odds,
    decimal MinBetAmount, decimal MaxBetAmount,
    decimal? DefaultBetAmount, bool IsFixedBet,
    DateTime BettingOpenTime, DateTime BettingCloseTime);

public record UpdateBettingConfigRequest(
    decimal Handicap, Guid? FavoredTeamId, decimal Odds,
    decimal MinBetAmount, decimal MaxBetAmount,
    decimal? DefaultBetAmount, bool IsFixedBet,
    DateTime BettingOpenTime, DateTime BettingCloseTime);

public record PlaceBetRequest(Guid MatchBettingConfigId, Guid SelectedTeamId, decimal BetAmount);

public record BettingConfigDto(
    Guid Id, Guid MatchId, Guid GroupId,
    decimal Handicap, Guid? FavoredTeamId, string? FavoredTeamName,
    decimal Odds, decimal MinBetAmount, decimal MaxBetAmount,
    decimal? DefaultBetAmount, bool IsFixedBet,
    DateTime BettingOpenTime, DateTime BettingCloseTime,
    bool IsSettled, DateTime CreatedAt);

public record BetDto(
    Guid Id, Guid UserId, string UserDisplayName,
    Guid MatchId, string HomeTeamName, string AwayTeamName,
    Guid SelectedTeamId, string SelectedTeamName,
    decimal BetAmount, BetStatus Status, decimal Profit,
    DateTime CreatedAt, DateTime? SettledAt);

public record BetResultDto(BetStatus Status, decimal Profit);
