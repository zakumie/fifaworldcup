using WorldCup2026.Domain.Enums;

namespace WorldCup2026.Application.DTOs.Groups;

public record CreateGroupRequest(string Name, string? Description, int MaxMembers = 50, decimal DefaultBalance = 1000m, SettlementMode SettlementMode = SettlementMode.Normal);
public record UpdateGroupRequest(string Name, string? Description, int MaxMembers, decimal DefaultBalance, SettlementMode SettlementMode, bool IsActive = true);
public record JoinGroupRequest(string InviteCode);
public record JoinGroupResponse(GroupDto Group, int MissedMatches, decimal PenaltyAmount, decimal FinalBalance);
public record UpdateMemberRoleRequest(GroupRole Role);

public record GroupDto(
    Guid Id, string Name, string? Description, string InviteCode,
    int MaxMembers, decimal DefaultBalance, int MemberCount,
    bool IsActive, DateTime CreatedAt, SettlementMode SettlementMode);

public record GroupDetailDto(
    Guid Id, string Name, string? Description, string InviteCode,
    int MaxMembers, decimal DefaultBalance, bool IsActive,
    DateTime CreatedAt, SettlementMode SettlementMode, List<GroupMemberDto> Members);

public record GroupMemberDto(
    Guid Id, Guid UserId, string DisplayName, string Email,
    string? AvatarUrl, GroupRole Role, decimal Balance,
    DateTime JoinedAt, bool IsActive, decimal PenaltyAmount);
