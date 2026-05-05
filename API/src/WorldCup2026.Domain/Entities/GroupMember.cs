using System.ComponentModel.DataAnnotations;
using WorldCup2026.Domain.Common;
using WorldCup2026.Domain.Enums;

namespace WorldCup2026.Domain.Entities;

public class GroupMember : BaseEntity
{
    public Guid GroupId { get; set; }
    public Guid UserId { get; set; }
    public GroupRole Role { get; set; } = GroupRole.User;
    public decimal Balance { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
    [Timestamp]
    public byte[]? RowVersion { get; set; }

    public Group Group { get; set; } = null!;
    public User User { get; set; } = null!;
}
