using Microsoft.EntityFrameworkCore;
using WorldCup2026.Application.Common;
using WorldCup2026.Application.DTOs.Users;
using WorldCup2026.Application.Interfaces;
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
            user.AvatarUrl, user.AuthProvider.ToString(), user.CreatedAt));
    }

    public async Task<Result<UserProfileDto>> UpdateProfileAsync(Guid userId, UpdateProfileRequest request)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return Result<UserProfileDto>.Failure("User not found.");

        user.DisplayName = request.DisplayName;
        user.AvatarUrl = request.AvatarUrl;
        await _db.SaveChangesAsync();

        return Result<UserProfileDto>.Success(new UserProfileDto(
            user.Id, user.Email, user.DisplayName,
            user.AvatarUrl, user.AuthProvider.ToString(), user.CreatedAt));
    }
}
