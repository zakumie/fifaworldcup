using WorldCup2026.Domain.Common;
using WorldCup2026.Domain.Enums;

namespace WorldCup2026.Domain.Entities;

public class Match : BaseEntity
{
    public int? ExternalMatchId { get; set; }
    public Guid HomeTeamId { get; set; }
    public Guid AwayTeamId { get; set; }
    public int? HomeScore { get; set; }
    public int? AwayScore { get; set; }
    public int MatchDay { get; set; }
    public string Stage { get; set; } = null!;
    public string? Group { get; set; }
    public DateTime StartTime { get; set; }
    public MatchStatus Status { get; set; } = MatchStatus.Open;

    public Team HomeTeam { get; set; } = null!;
    public Team AwayTeam { get; set; } = null!;
    public ICollection<MatchBettingConfig> BettingConfigs { get; set; } = new List<MatchBettingConfig>();
    public ICollection<Bet> Bets { get; set; } = new List<Bet>();
}
