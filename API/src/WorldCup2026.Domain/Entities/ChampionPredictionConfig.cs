using WorldCup2026.Domain.Common;

namespace WorldCup2026.Domain.Entities;

public class ChampionPredictionConfig : BaseEntity
{
    public Guid GroupId { get; set; }
    public bool IsEnabled { get; set; } = false;
    public DateTime PredictionOpenTime { get; set; }
    public DateTime PredictionCloseTime { get; set; }
    public Guid? WinnerTeamId { get; set; }
    public bool IsSettled { get; set; } = false;
    public Guid CreatedById { get; set; }

    public Group Group { get; set; } = null!;
    public Team? WinnerTeam { get; set; }
    public User CreatedBy { get; set; } = null!;
    public ICollection<ChampionPrediction> Predictions { get; set; } = new List<ChampionPrediction>();
}
