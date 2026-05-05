using WorldCup2026.Domain.Enums;

namespace WorldCup2026.Application.DTOs.Groups;

public record CreateGroupRequest(string Name, string? Description, int MaxMembers = 50, decimal DefaultBalance = 1000m);
public record UpdateGroupRequest(string Name, string? Description, int MaxMembers, decimal DefaultBalance);
public record JoinGroupRequest(string InviteCode);
public record UpdateMemberRoleRequest(GroupRole Role);

public record GroupDto(
    Guid Id, string Name, string? Description, string InviteCode,
    int MaxMembers, decimal DefaultBalance, int MemberCount,
    bool IsActive, DateTime CreatedAt);

public record GroupDetailDto(
    Guid Id, string Name, string? Description, string InviteCode,
    int MaxMembers, decimal DefaultBalance, bool IsActive,
    DateTime CreatedAt, List<GroupMemberDto> Members);

public record GroupMemberDto(
    Guid Id, Guid UserId, string DisplayName, string Email,
    string? AvatarUrl, GroupRole Role, decimal Balance,
    DateTime JoinedAt, bool IsActive);
