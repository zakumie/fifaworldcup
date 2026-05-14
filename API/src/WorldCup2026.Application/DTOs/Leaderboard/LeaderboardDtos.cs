namespace WorldCup2026.Application.DTOs.Leaderboard;

public record LeaderboardEntryDto(
    int Rank, Guid UserId, string DisplayName, string? AvatarUrl,
    int TotalBets, int Wins, int Losses, int Draws,
    decimal TotalWagered, decimal TotalPayout, decimal Profit,
    decimal Balance, decimal WinRate, decimal PenaltyAmount);

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
