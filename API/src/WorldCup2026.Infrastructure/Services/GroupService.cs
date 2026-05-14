using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WorldCup2026.Application.Common;
using WorldCup2026.Application.DTOs.Groups;
using WorldCup2026.Application.Interfaces;
using WorldCup2026.Domain.Entities;
using WorldCup2026.Domain.Enums;
using WorldCup2026.Infrastructure.Data;

namespace WorldCup2026.Infrastructure.Services;

public class GroupService : IGroupService
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;
    private readonly ILogger<GroupService> _logger;

    // Thread-safe random: reuse a single instance
    private static readonly Random _random = Random.Shared;

    public GroupService(AppDbContext db, IMapper mapper, ILogger<GroupService> logger)
    {
        _db = db;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<Result<GroupDto>> CreateAsync(CreateGroupRequest request, Guid userId)
    {
        var group = new Group
        {
            Name = request.Name,
            Description = request.Description,
            InviteCode = GenerateInviteCode(),
            MaxMembers = request.MaxMembers,
            DefaultBalance = request.DefaultBalance,
            SettlementMode = request.SettlementMode,
            CreatedById = userId
        };

        _db.Groups.Add(group);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Group {GroupId} created by user {UserId}", group.Id, userId);
        return Result<GroupDto>.Success(MapToGroupDto(group, 0));
    }

    public async Task<Result<GroupDto>> UpdateAsync(Guid groupId, UpdateGroupRequest request, Guid userId)
    {
        var group = await _db.Groups.FindAsync(groupId);
        if (group == null) return Result<GroupDto>.Failure("Group not found.");

        var isSystemAdmin = await IsSystemAdmin(userId);
        if (!isSystemAdmin && !await IsManagerOrAdmin(groupId, userId))
            return Result<GroupDto>.Failure("Insufficient permissions.");

        group.Name = request.Name;
        group.Description = request.Description;
        group.MaxMembers = request.MaxMembers;
        group.DefaultBalance = request.DefaultBalance;
        group.SettlementMode = request.SettlementMode;
        group.IsActive = request.IsActive;

        await _db.SaveChangesAsync();
        int memberCount = await _db.GroupMembers.CountAsync(m => m.GroupId == groupId && m.IsActive);
        return Result<GroupDto>.Success(MapToGroupDto(group, memberCount));
    }

    public async Task<Result> DeleteAsync(Guid groupId, Guid userId)
    {
        var group = await _db.Groups.FindAsync(groupId);
        if (group == null) return Result.Failure("Group not found.");

        var isSystemAdmin = await IsSystemAdmin(userId);
        if (!isSystemAdmin && !await IsAdmin(groupId, userId))
            return Result.Failure("Only admins can delete groups.");

        group.DeletedAt = DateTime.UtcNow;
        group.IsActive = false;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Group {GroupId} deleted by user {UserId}", groupId, userId);
        return Result.Success();
    }

    public async Task<Result<GroupDetailDto>> GetByIdAsync(Guid groupId, Guid userId)
    {
        // Single query: check membership AND system role together
        var isSystemAdmin = await IsSystemAdmin(userId);

        if (!isSystemAdmin && !await IsMember(groupId, userId))
            return Result<GroupDetailDto>.Failure("You are not a member of this group.");

        var group = await _db.Groups
            .Include(g => g.Members.Where(m => m.IsActive))
                .ThenInclude(m => m.User)
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.Id == groupId);

        if (group == null) return Result<GroupDetailDto>.Failure("Group not found.");

        var members = group.Members.Select(m => new GroupMemberDto(
            m.Id, m.UserId, m.User.DisplayName, m.User.Email,
            m.User.AvatarUrl, m.Role, m.Balance, m.JoinedAt, m.IsActive, m.PenaltyAmount)).ToList();

        return Result<GroupDetailDto>.Success(new GroupDetailDto(
            group.Id, group.Name, group.Description, group.InviteCode,
            group.MaxMembers, group.DefaultBalance, group.IsActive,
            group.CreatedAt, group.SettlementMode, members));
    }

    public async Task<Result<List<GroupDto>>> GetUserGroupsAsync(Guid userId)
    {
        if (await IsSystemAdmin(userId))
        {
            return await GetAllGroupsAsync();
        }

        var groups = await _db.GroupMembers
            .Where(m => m.UserId == userId && m.IsActive)
            .AsNoTracking()
            .Select(m => new GroupDto(
                m.Group.Id, m.Group.Name, m.Group.Description, m.Group.InviteCode,
                m.Group.MaxMembers, m.Group.DefaultBalance,
                m.Group.Members.Count(x => x.IsActive),
                m.Group.IsActive, m.Group.CreatedAt, m.Group.SettlementMode))
            .ToListAsync();

        return Result<List<GroupDto>>.Success(groups);
    }

    public async Task<Result<List<GroupDto>>> GetAllGroupsAsync()
    {
        var groups = await _db.Groups
            .Where(g => g.IsActive)
            .AsNoTracking()
            .Select(g => new GroupDto(
                g.Id, g.Name, g.Description, g.InviteCode,
                g.MaxMembers, g.DefaultBalance,
                g.Members.Count(x => x.IsActive),
                g.IsActive, g.CreatedAt, g.SettlementMode))
            .ToListAsync();

        return Result<List<GroupDto>>.Success(groups);
    }

    public async Task<Result<JoinGroupResponse>> JoinByCodeAsync(JoinGroupRequest request, Guid userId)
    {
        var group = await _db.Groups
            .FirstOrDefaultAsync(g => g.InviteCode == request.InviteCode && g.IsActive);

        if (group == null) return Result<JoinGroupResponse>.Failure("Invalid invite code.");

        if (await _db.GroupMembers.AnyAsync(m => m.GroupId == group.Id && m.UserId == userId && m.IsActive))
            return Result<JoinGroupResponse>.Failure("You are already a member of this group.");

        int activeMembers = await _db.GroupMembers.CountAsync(m => m.GroupId == group.Id && m.IsActive);
        if (activeMembers >= group.MaxMembers)
            return Result<JoinGroupResponse>.Failure("Group is full.");

        // Calculate penalty for missed settled matches in WinnerKeepsLoserPays mode
        int missedMatches = 0;
        decimal penaltyAmount = 0m;
        decimal balance = group.DefaultBalance;

        if (group.SettlementMode == SettlementMode.WinnerKeepsLoserPays)
        {
            var settledConfigs = await _db.MatchBettingConfigs
                .Where(c => c.GroupId == group.Id && c.IsSettled && c.DeletedAt == null)
                .Select(c => c.DefaultBetAmount)
                .ToListAsync();

            missedMatches = settledConfigs.Count;
            penaltyAmount = settledConfigs.Sum(amt => amt ?? 0m);
            balance = group.DefaultBalance - penaltyAmount;
        }

        var member = new GroupMember
        {
            GroupId = group.Id,
            UserId = userId,
            Role = GroupRole.User,
            Balance = balance,
            PenaltyAmount = penaltyAmount,
            JoinedAt = DateTime.UtcNow
        };
        _db.GroupMembers.Add(member);

        _db.Transactions.Add(new Transaction
        {
            UserId = userId,
            GroupId = group.Id,
            Type = TransactionType.InitialBalance,
            Amount = group.DefaultBalance,
            BalanceBefore = 0,
            BalanceAfter = group.DefaultBalance,
            Description = "Initial balance on joining group"
        });

        if (penaltyAmount > 0)
        {
            _db.Transactions.Add(new Transaction
            {
                UserId = userId,
                GroupId = group.Id,
                Type = TransactionType.BetLost,
                Amount = -penaltyAmount,
                BalanceBefore = group.DefaultBalance,
                BalanceAfter = balance,
                Description = $"Penalty for {missedMatches} missed settled match(es)"
            });
        }

        await _db.SaveChangesAsync();

        _logger.LogInformation("User {UserId} joined group {GroupId} (missed={Missed}, penalty={Penalty})",
            userId, group.Id, missedMatches, penaltyAmount);

        var groupDto = MapToGroupDto(group, activeMembers + 1);
        return Result<JoinGroupResponse>.Success(new JoinGroupResponse(groupDto, missedMatches, penaltyAmount, balance));
    }

    public async Task<Result<string>> RegenerateInviteCodeAsync(Guid groupId, Guid userId)
    {
        // Check existence before authorization to give accurate error
        var group = await _db.Groups.FindAsync(groupId);
        if (group == null) return Result<string>.Failure("Group not found.");

        var isSystemAdmin = await IsSystemAdmin(userId);
        if (!isSystemAdmin && !await IsManagerOrAdmin(groupId, userId))
            return Result<string>.Failure("Insufficient permissions.");

        group.InviteCode = GenerateInviteCode();
        await _db.SaveChangesAsync();

        return Result<string>.Success(group.InviteCode);
    }

    public async Task<Result> UpdateMemberRoleAsync(Guid groupId, Guid memberId, GroupRole role, Guid currentUserId)
    {
        if (!await IsAdmin(groupId, currentUserId))
            return Result.Failure("Only admins can change roles.");

        // Prevent last admin from being demoted
        if (role < GroupRole.Admin)
        {
            int adminCount = await _db.GroupMembers.CountAsync(m =>
                m.GroupId == groupId && m.Role == GroupRole.Admin && m.IsActive);
            if (adminCount <= 1 && await IsAdmin(groupId, memberId))
                return Result.Failure("Cannot demote the last admin.");
        }

        var member = await _db.GroupMembers.FirstOrDefaultAsync(
            m => m.GroupId == groupId && m.UserId == memberId && m.IsActive);
        if (member == null) return Result.Failure("Member not found.");

        member.Role = role;
        await _db.SaveChangesAsync();

        return Result.Success();
    }

    public async Task<Result> RemoveMemberAsync(Guid groupId, Guid memberId, Guid currentUserId)
    {
        if (!await IsManagerOrAdmin(groupId, currentUserId))
            return Result.Failure("Insufficient permissions.");

        if (memberId == currentUserId)
            return Result.Failure("Cannot remove yourself.");

        var member = await _db.GroupMembers.FirstOrDefaultAsync(
            m => m.GroupId == groupId && m.UserId == memberId && m.IsActive);
        if (member == null) return Result.Failure("Member not found.");

        member.IsActive = false;
        member.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Result.Success();
    }

    private Task<bool> IsSystemAdmin(Guid userId) =>
        _db.Users.AnyAsync(u => u.Id == userId && u.Role == SystemRole.Admin);

    private Task<bool> IsAdmin(Guid groupId, Guid userId) =>
        _db.GroupMembers.AnyAsync(m =>
            m.GroupId == groupId && m.UserId == userId && m.Role == GroupRole.Admin && m.IsActive);

    private Task<bool> IsManagerOrAdmin(Guid groupId, Guid userId) =>
        _db.GroupMembers.AnyAsync(m =>
            m.GroupId == groupId && m.UserId == userId && m.Role >= GroupRole.Manager && m.IsActive);

    private Task<bool> IsMember(Guid groupId, Guid userId) =>
        _db.GroupMembers.AnyAsync(m =>
            m.GroupId == groupId && m.UserId == userId && m.IsActive);

    private static string GenerateInviteCode()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        return new string(Enumerable.Range(0, 8).Select(_ => chars[_random.Next(chars.Length)]).ToArray());
    }

    private static GroupDto MapToGroupDto(Group g, int memberCount) =>
        new(g.Id, g.Name, g.Description, g.InviteCode,
            g.MaxMembers, g.DefaultBalance, memberCount, g.IsActive, g.CreatedAt, g.SettlementMode);
}
