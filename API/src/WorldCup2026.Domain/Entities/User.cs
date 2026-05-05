using WorldCup2026.Domain.Common;
using WorldCup2026.Domain.Enums;

namespace WorldCup2026.Domain.Entities;

public class User : BaseEntity
{
    public string Email { get; set; } = null!;
    public string? PasswordHash { get; set; }
    public string DisplayName { get; set; } = null!;
    public string? AvatarUrl { get; set; }
    public AuthProvider AuthProvider { get; set; } = AuthProvider.Local;
    public string? ExternalAuthId { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }
    public SystemRole Role { get; set; } = SystemRole.User;
    public bool IsActive { get; set; } = true;

    public ICollection<GroupMember> GroupMemberships { get; set; } = new List<GroupMember>();
    public ICollection<Group> CreatedGroups { get; set; } = new List<Group>();
    public ICollection<Bet> Bets { get; set; } = new List<Bet>();
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
