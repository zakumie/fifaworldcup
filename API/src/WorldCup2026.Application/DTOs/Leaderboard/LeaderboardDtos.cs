namespace WorldCup2026.Application.DTOs.Leaderboard;

public record LeaderboardEntryDto(
    int Rank, Guid UserId, string DisplayName, string? AvatarUrl,
    int TotalBets, int TotalWins, int TotalLosses,
    decimal TotalWinAmount, decimal TotalLossAmount, decimal NetProfit);

public record DashboardDto(
    List<LeaderboardEntryDto> TopWinners,
    List<LeaderboardEntryDto> TopLosers,
    List<HighestBetDto> HighestBets,
    GroupStatsDto GroupStats);

public record HighestBetDto(
    Guid UserId, string DisplayName, decimal BetAmount,
    string HomeTeamName, string AwayTeamName);

public record GroupStatsDto(
    int TotalMembers, int TotalBetsPlaced,
    int TotalMatchesBet, decimal TotalAmountWagered);
