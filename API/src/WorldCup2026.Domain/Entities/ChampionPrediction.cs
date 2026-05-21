using WorldCup2026.Domain.Common;

namespace WorldCup2026.Domain.Entities;

public class ChampionPrediction : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid GroupId { get; set; }
    public Guid ConfigId { get; set; }
    public Guid SelectedTeamId { get; set; }
    public bool? IsCorrect { get; set; }

    public User User { get; set; } = null!;
    public Group Group { get; set; } = null!;
    public ChampionPredictionConfig Config { get; set; } = null!;
    public Team SelectedTeam { get; set; } = null!;
}
