using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WorldCup2026.Application.Common;
using WorldCup2026.Application.DTOs.Auth;
using WorldCup2026.Application.Interfaces;
using WorldCup2026.Domain.Entities;
using WorldCup2026.Domain.Enums;
using WorldCup2026.Infrastructure.Data;

namespace WorldCup2026.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IJwtService _jwt;
    private readonly IGoogleTokenValidator _googleValidator;
    private readonly ILogger<AuthService> _logger;

    public AuthService(AppDbContext db, IJwtService jwt, IGoogleTokenValidator googleValidator, ILogger<AuthService> logger)
    {
        _db = db;
        _jwt = jwt;
        _googleValidator = googleValidator;
        _logger = logger;
    }

    public async Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request)
    {
        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
            return Result<AuthResponse>.Failure("Email already registered.");

        var user = new User
        {
            Email = request.Email,
            DisplayName = request.DisplayName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            AuthProvider = AuthProvider.Local,
            TimeZone = NormalizeTimeZone(request.TimeZone)
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return await GenerateAuthResponseAsync(user);
    }

    public async Task<Result<AuthResponse>> LoginAsync(LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive);
        if (user == null || user.PasswordHash == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Result<AuthResponse>.Failure("Invalid email or password.");

        return await GenerateAuthResponseAsync(user);
    }

    public Task<Result<AuthResponse>> OAuthLoginAsync(OAuthLoginRequest request)
    {
        // Generic OAuth is disabled. Use provider-specific endpoints (e.g., /google-login).
        return Task.FromResult(Result<AuthResponse>.Failure("OAuth login via this endpoint is not supported. Use /google-login instead."));
    }

    public async Task<Result<AuthResponse>> GoogleLoginAsync(GoogleLoginRequest request)
    {
        var payload = await _googleValidator.ValidateAsync(request.Credential);
        if (payload == null)
            return Result<AuthResponse>.Failure("Invalid Google credential.");

        var user = await _db.Users.FirstOrDefaultAsync(
            u => u.AuthProvider == AuthProvider.Google && u.ExternalAuthId == payload.Sub);

        if (user == null)
        {
            user = await _db.Users.FirstOrDefaultAsync(u => u.Email == payload.Email && u.IsActive);
            if (user != null)
            {
                user.AuthProvider = AuthProvider.Google;
                user.ExternalAuthId = payload.Sub;
                user.AvatarUrl ??= payload.Picture;
            }
            else
            {
                user = new User
                {
                    Email = payload.Email,
                    DisplayName = payload.Name,
                    AvatarUrl = payload.Picture,
                    AuthProvider = AuthProvider.Google,
                    ExternalAuthId = payload.Sub
                };
                _db.Users.Add(user);
            }

            await _db.SaveChangesAsync();
        }

        if (!user.IsActive)
            return Result<AuthResponse>.Failure("Account is disabled.");

        return await GenerateAuthResponseAsync(user);
    }

    public async Task<Result<AuthResponse>> RefreshTokenAsync(RefreshTokenRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(
            u => u.RefreshToken == request.RefreshToken
                 && u.RefreshTokenExpiryTime > DateTime.UtcNow
                 && u.IsActive);

        if (user == null)
            return Result<AuthResponse>.Failure("Invalid or expired refresh token.");

        return await GenerateAuthResponseAsync(user);
    }

    public async Task<Result> LogoutAsync(Guid userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return Result.Failure("User not found.");

        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;
        await _db.SaveChangesAsync();

        return Result.Success();
    }

    private async Task<Result<AuthResponse>> GenerateAuthResponseAsync(User user)
    {
        var accessToken = _jwt.GenerateAccessToken(user.Id, user.Email, user.DisplayName, user.Role.ToString());
        var refreshToken = _jwt.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _db.SaveChangesAsync();

        var userInfo = new UserInfo(user.Id, user.Email, user.DisplayName, user.AvatarUrl, user.Role.ToString(), user.TimeZone);
        return Result<AuthResponse>.Success(new AuthResponse(accessToken, refreshToken, userInfo));
    }

    private static readonly string[] AllowedTimeZones = { "Pacific/Easter", "UTC", "Asia/Ho_Chi_Minh" };

    private static string NormalizeTimeZone(string? timeZone)
    {
        if (string.IsNullOrEmpty(timeZone))
            return "Asia/Ho_Chi_Minh";
        return AllowedTimeZones.Contains(timeZone, StringComparer.OrdinalIgnoreCase)
            ? timeZone
            : "Asia/Ho_Chi_Minh";
    }
}
