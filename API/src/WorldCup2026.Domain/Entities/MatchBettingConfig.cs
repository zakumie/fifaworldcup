using WorldCup2026.Domain.Common;

namespace WorldCup2026.Domain.Entities;

public class MatchBettingConfig : BaseEntity
{
    public Guid MatchId { get; set; }
    public Guid GroupId { get; set; }
    public decimal Handicap { get; set; }
    public Guid? FavoredTeamId { get; set; }
    public decimal Odds { get; set; } = 1.0m;
    public decimal MinBetAmount { get; set; } = 10m;
    public decimal MaxBetAmount { get; set; } = 500m;
    public decimal? DefaultBetAmount { get; set; }
    public bool IsFixedBet { get; set; }
    public DateTime BettingOpenTime { get; set; }
    public DateTime BettingCloseTime { get; set; }
    public bool IsSettled { get; set; }
    public Guid CreatedById { get; set; }

    public Match Match { get; set; } = null!;
    public Group Group { get; set; } = null!;
    public Team? FavoredTeam { get; set; }
    public User CreatedBy { get; set; } = null!;
    public ICollection<Bet> Bets { get; set; } = new List<Bet>();
}
