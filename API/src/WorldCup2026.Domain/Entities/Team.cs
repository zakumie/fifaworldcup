using WorldCup2026.Domain.Common;

namespace WorldCup2026.Domain.Entities;

public class Team : BaseEntity
{
    public string Name { get; set; } = null!;
    public string Code { get; set; } = null!;
    public string? FlagUrl { get; set; }
    public string? GroupName { get; set; }
}
