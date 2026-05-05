namespace WorldCup2026.Application.Interfaces;

public interface IExternalMatchService
{
    Task<int> SyncMatchesAsync();
    Task<int> SyncTeamsAsync();
}
