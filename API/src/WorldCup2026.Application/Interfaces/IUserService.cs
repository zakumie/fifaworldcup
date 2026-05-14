using WorldCup2026.Application.Common;
using WorldCup2026.Application.DTOs.Users;

namespace WorldCup2026.Application.Interfaces;

public interface IUserService
{
    Task<Result<UserProfileDto>> GetProfileAsync(Guid userId);
    Task<Result<UserProfileDto>> UpdateProfileAsync(Guid userId, UpdateProfileRequest request);
    Task<Result<List<AdminUserDto>>> GetAllUsersAsync();
    Task<Result<AdminUserDto>> UpdateUserRoleAsync(Guid userId, UpdateUserRoleRequest request);
    Task<Result<AdminUserDto>> ToggleUserActiveAsync(Guid userId, ToggleUserActiveRequest request);
}
