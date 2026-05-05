using WorldCup2026.Domain.Common;

namespace WorldCup2026.Domain.Entities;

public class Group : BaseEntity
{
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string InviteCode { get; set; } = null!;
    public int MaxMembers { get; set; } = 50;
    public decimal DefaultBalance { get; set; } = 1000m;
    public Guid CreatedById { get; set; }
    public bool IsActive { get; set; } = true;

    public User CreatedBy { get; set; } = null!;
    public ICollection<GroupMember> Members { get; set; } = new List<GroupMember>();
    public ICollection<MatchBettingConfig> BettingConfigs { get; set; } = new List<MatchBettingConfig>();
}
