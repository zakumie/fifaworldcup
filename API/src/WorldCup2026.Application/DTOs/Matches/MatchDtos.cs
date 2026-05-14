using WorldCup2026.Domain.Enums;

namespace WorldCup2026.Application.DTOs.Matches;

public record CreateMatchRequest(
    Guid HomeTeamId, Guid AwayTeamId, int MatchDay,
    string Stage, DateTime StartTime);

public record UpdateMatchRequest(
    Guid HomeTeamId, Guid AwayTeamId, int MatchDay,
    string Stage, DateTime StartTime, MatchStatus Status);

public record UpdateScoreRequest(int HomeScore, int AwayScore, MatchStatus Status);

public record MatchDto(
    Guid Id, int? ExternalMatchId,
    TeamDto HomeTeam, TeamDto AwayTeam,
    int? HomeScore, int? AwayScore,
    int MatchDay, string Stage, string? Group,
    DateTime StartTime, MatchStatus Status);

public record TeamDto(Guid Id, string Name, string Code, string? FlagUrl, string? GroupName);

public record MatchListRequest
{
    public MatchStatus? Status { get; init; }
    public string? Stage { get; init; }
    public DateTime? FromDate { get; init; }
    public DateTime? ToDate { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}
