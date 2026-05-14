namespace WorldCup2026.Application.DTOs.Users;

public record UserProfileDto(
    Guid Id, string Email, string DisplayName,
    string? AvatarUrl, string AuthProvider,
    DateTime CreatedAt, string TimeZone);

public record UpdateProfileRequest(string DisplayName, string? AvatarUrl, string? TimeZone);

public record AdminUserDto(
    Guid Id, string Email, string DisplayName,
    string? AvatarUrl, string AuthProvider,
    string Role, bool IsActive,
    DateTime CreatedAt);

public record UpdateUserRoleRequest(string Role);

public record ToggleUserActiveRequest(bool IsActive);
