using WorldCup2026.Application.Common;
using WorldCup2026.Application.DTOs.Auth;

namespace WorldCup2026.Application.Interfaces;

public interface IAuthService
{
    Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request);
    Task<Result<AuthResponse>> LoginAsync(LoginRequest request);
    Task<Result<AuthResponse>> OAuthLoginAsync(OAuthLoginRequest request);
    Task<Result<AuthResponse>> GoogleLoginAsync(GoogleLoginRequest request);
    Task<Result<AuthResponse>> RefreshTokenAsync(RefreshTokenRequest request);
    Task<Result> LogoutAsync(Guid userId);
}

public interface IGoogleTokenValidator
{
    Task<GoogleUserPayload?> ValidateAsync(string credential);
}

public record GoogleUserPayload(string Sub, string Email, string Name, string? Picture);
