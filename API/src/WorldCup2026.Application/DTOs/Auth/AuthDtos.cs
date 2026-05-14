namespace WorldCup2026.Application.DTOs.Auth;

public record RegisterRequest(string Email, string Password, string DisplayName, string? TimeZone = null);
public record LoginRequest(string Email, string Password);
public record OAuthLoginRequest(string Token, string Provider);
public record GoogleLoginRequest(string Credential);
public record RefreshTokenRequest(string RefreshToken);
public record AuthResponse(string AccessToken, string RefreshToken, UserInfo User);
public record UserInfo(Guid Id, string Email, string DisplayName, string? AvatarUrl, string Role, string TimeZone);
