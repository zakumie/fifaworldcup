using WorldCup2026.Domain.Common;

namespace WorldCup2026.Domain.Entities;

public class LeaderboardSnapshot : BaseEntity
{
    public Guid GroupId { get; set; }
    public Guid UserId { get; set; }
    public int TotalBets { get; set; }
    public int TotalWins { get; set; }
    public int TotalLosses { get; set; }
    public decimal TotalWinAmount { get; set; }
    public decimal TotalLossAmount { get; set; }
    public decimal NetProfit { get; set; }
    public int Rank { get; set; }
    public DateTime SnapshotDate { get; set; }

    public Group Group { get; set; } = null!;
    public User User { get; set; } = null!;
}
