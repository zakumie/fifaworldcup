using WorldCup2026.Domain.Common;
using WorldCup2026.Domain.Enums;

namespace WorldCup2026.Domain.Entities;

public class Bet : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid MatchBettingConfigId { get; set; }
    public Guid GroupId { get; set; }
    public Guid MatchId { get; set; }
    public Guid? SelectedTeamId { get; set; }
    public decimal BetAmount { get; set; }
    public BetStatus Status { get; set; } = BetStatus.Pending;
    public decimal Profit { get; set; }
    public DateTime? SettledAt { get; set; }

    public User User { get; set; } = null!;
    public MatchBettingConfig BettingConfig { get; set; } = null!;
    public Group Group { get; set; } = null!;
    public Match Match { get; set; } = null!;
    public Team? SelectedTeam { get; set; }
}
