using WorldCup2026.Domain.Common;
using WorldCup2026.Domain.Enums;

namespace WorldCup2026.Domain.Entities;

public class Transaction : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid GroupId { get; set; }
    public TransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public decimal BalanceBefore { get; set; }
    public decimal BalanceAfter { get; set; }
    public Guid? ReferenceId { get; set; }
    public string? Description { get; set; }

    public User User { get; set; } = null!;
    public Group Group { get; set; } = null!;
}
