using Microsoft.EntityFrameworkCore;
using WorldCup2026.Application.Common;
using WorldCup2026.Application.DTOs.Users;
using WorldCup2026.Application.Interfaces;
using WorldCup2026.Domain.Enums;
using WorldCup2026.Infrastructure.Data;

namespace WorldCup2026.Infrastructure.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _db;

    public UserService(AppDbContext db) => _db = db;

    public async Task<Result<UserProfileDto>> GetProfileAsync(Guid userId)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return Result<UserProfileDto>.Failure("User not found.");

        return Result<UserProfileDto>.Success(new UserProfileDto(
            user.Id, user.Email, user.DisplayName,
            user.AvatarUrl, user.AuthProvider.ToString(), user.CreatedAt, user.TimeZone));
    }

    public async Task<Result<UserProfileDto>> UpdateProfileAsync(Guid userId, UpdateProfileRequest request)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return Result<UserProfileDto>.Failure("User not found.");

        user.DisplayName = request.DisplayName;
        user.AvatarUrl = request.AvatarUrl;
        if (!string.IsNullOrEmpty(request.TimeZone))
        {
            var allowed = new[] { "Pacific/Easter", "UTC", "Asia/Ho_Chi_Minh" };
            if (!allowed.Contains(request.TimeZone, StringComparer.OrdinalIgnoreCase))
                return Result<UserProfileDto>.Failure($"Invalid timezone: '{request.TimeZone}'. Allowed: {string.Join(", ", allowed)}");
            user.TimeZone = request.TimeZone;
        }
        await _db.SaveChangesAsync();

        return Result<UserProfileDto>.Success(new UserProfileDto(
            user.Id, user.Email, user.DisplayName,
            user.AvatarUrl, user.AuthProvider.ToString(), user.CreatedAt, user.TimeZone));
    }

    public async Task<Result<List<AdminUserDto>>> GetAllUsersAsync()
    {
        var users = await _db.Users
            .AsNoTracking()
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new AdminUserDto(
                u.Id, u.Email, u.DisplayName,
                u.AvatarUrl, u.AuthProvider.ToString(),
                u.Role.ToString(), u.IsActive, u.CreatedAt))
            .ToListAsync();

        return Result<List<AdminUserDto>>.Success(users);
    }

    public async Task<Result<AdminUserDto>> UpdateUserRoleAsync(Guid userId, UpdateUserRoleRequest request)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return Result<AdminUserDto>.Failure("User not found.");

        if (!Enum.TryParse<SystemRole>(request.Role, ignoreCase: true, out var role))
            return Result<AdminUserDto>.Failure("Invalid role. Must be 'Admin' or 'User'.");

        user.Role = role;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Result<AdminUserDto>.Success(new AdminUserDto(
            user.Id, user.Email, user.DisplayName,
            user.AvatarUrl, user.AuthProvider.ToString(),
            user.Role.ToString(), user.IsActive, user.CreatedAt));
    }

    public async Task<Result<AdminUserDto>> ToggleUserActiveAsync(Guid userId, ToggleUserActiveRequest request)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return Result<AdminUserDto>.Failure("User not found.");

        user.IsActive = request.IsActive;
        user.UpdatedAt = DateTime.UtcNow;

        // Deactivate/reactivate all pending bets for this user
        if (!request.IsActive)
        {
            var pendingBets = await _db.Bets
                .Where(b => b.UserId == userId && b.Status == BetStatus.Pending)
                .ToListAsync();

            foreach (var bet in pendingBets)
            {
                bet.Status = BetStatus.Cancelled;
            }
        }

        await _db.SaveChangesAsync();

        return Result<AdminUserDto>.Success(new AdminUserDto(
            user.Id, user.Email, user.DisplayName,
            user.AvatarUrl, user.AuthProvider.ToString(),
            user.Role.ToString(), user.IsActive, user.CreatedAt));
    }
}
