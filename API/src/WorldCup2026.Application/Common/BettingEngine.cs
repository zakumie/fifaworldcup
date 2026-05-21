using WorldCup2026.Application.DTOs.Betting;
using WorldCup2026.Domain.Enums;

namespace WorldCup2026.Application.Common;

public static class BettingEngine
{
    public static BetResultDto Calculate(
        int homeScore, int awayScore,
        decimal handicap, Guid? favoredTeamId,
        Guid selectedTeamId, Guid homeTeamId,
        decimal betAmount, decimal odds)
    {
        decimal adjustedHomeScore = homeScore;
        decimal adjustedAwayScore = awayScore;

        // Apply handicap to the favored team
        if (favoredTeamId == homeTeamId)
        {
            adjustedHomeScore = homeScore + handicap;
        }
        else if (favoredTeamId.HasValue)  // Away team (not home)
        {
            adjustedAwayScore = awayScore + handicap;
        }
        // If favoredTeamId is null, no handicap applied (neutral bet)

        decimal betDiff;
        if (selectedTeamId == homeTeamId)
        {
            betDiff = adjustedHomeScore - adjustedAwayScore;
        }
        else
        {
            betDiff = adjustedAwayScore - adjustedHomeScore;
        }

        return betDiff switch
        {
            > 0.25m => new BetResultDto(BetStatus.Won, Math.Round(betAmount * odds, 2)),
            0.25m => new BetResultDto(BetStatus.HalfWon, Math.Round(betAmount * odds * 0.5m, 2)),
            0m => new BetResultDto(BetStatus.Push, 0m),
            -0.25m => new BetResultDto(BetStatus.HalfLost, Math.Round(-betAmount * 0.5m, 2)),
            < -0.25m => new BetResultDto(BetStatus.Lost, -betAmount),
            _ => new BetResultDto(BetStatus.Push, 0m)
        };
    }
}
