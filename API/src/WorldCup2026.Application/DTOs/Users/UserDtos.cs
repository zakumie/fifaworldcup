namespace WorldCup2026.Application.DTOs.Users;

public record UserProfileDto(
    Guid Id, string Email, string DisplayName,
    string? AvatarUrl, string AuthProvider,
    DateTime CreatedAt);

public record UpdateProfileRequest(string DisplayName, string? AvatarUrl);
