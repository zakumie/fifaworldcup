namespace WorldCup2026.Application.Interfaces;

public interface IJwtService
{
    string GenerateAccessToken(Guid userId, string email, string displayName, string role);
    string GenerateRefreshToken();
    Guid? ValidateToken(string token);
}
