using WorldCup2026.Application.Common;
using WorldCup2026.Application.DTOs.Groups;
using WorldCup2026.Domain.Enums;

namespace WorldCup2026.Application.Interfaces;

public interface IGroupService
{
    Task<Result<GroupDto>> CreateAsync(CreateGroupRequest request, Guid userId);
    Task<Result<GroupDto>> UpdateAsync(Guid groupId, UpdateGroupRequest request, Guid userId);
    Task<Result> DeleteAsync(Guid groupId, Guid userId);
    Task<Result<GroupDetailDto>> GetByIdAsync(Guid groupId, Guid userId);
    Task<Result<List<GroupDto>>> GetUserGroupsAsync(Guid userId);
    Task<Result<List<GroupDto>>> GetAllGroupsAsync();
    Task<Result<GroupDto>> JoinByCodeAsync(JoinGroupRequest request, Guid userId);
    Task<Result<string>> RegenerateInviteCodeAsync(Guid groupId, Guid userId);
    Task<Result> UpdateMemberRoleAsync(Guid groupId, Guid memberId, GroupRole role, Guid currentUserId);
    Task<Result> RemoveMemberAsync(Guid groupId, Guid memberId, Guid currentUserId);
}
