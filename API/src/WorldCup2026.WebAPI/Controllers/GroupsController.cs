using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorldCup2026.Application.DTOs.Groups;
using WorldCup2026.Application.Interfaces;

namespace WorldCup2026.WebAPI.Controllers;

[Authorize]
public class GroupsController : BaseApiController
{
    private readonly IGroupService _groups;
    private readonly ICurrentUser _currentUser;

    public GroupsController(IGroupService groups, ICurrentUser currentUser)
    {
        _groups = groups;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult> GetMyGroups()
        => HandleResult(await _groups.GetUserGroupsAsync(_currentUser.UserId));

    [HttpGet("all")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult> GetAllGroups()
        => HandleResult(await _groups.GetAllGroupsAsync());

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult> Create(CreateGroupRequest request)
        => HandleResult(await _groups.CreateAsync(request, _currentUser.UserId));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult> GetById(Guid id)
        => HandleResult(await _groups.GetByIdAsync(id, _currentUser.UserId));

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult> Update(Guid id, UpdateGroupRequest request)
        => HandleResult(await _groups.UpdateAsync(id, request, _currentUser.UserId));

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult> Delete(Guid id)
        => HandleResult(await _groups.DeleteAsync(id, _currentUser.UserId));

    [HttpPost("join")]
    public async Task<ActionResult> Join(JoinGroupRequest request)
        => HandleResult(await _groups.JoinByCodeAsync(request, _currentUser.UserId));

    [HttpPost("{id:guid}/regenerate-invite")]
    public async Task<ActionResult> RegenerateInvite(Guid id)
        => HandleResult(await _groups.RegenerateInviteCodeAsync(id, _currentUser.UserId));

    [HttpPut("{groupId:guid}/members/{memberId:guid}/role")]
    public async Task<ActionResult> UpdateMemberRole(Guid groupId, Guid memberId, UpdateMemberRoleRequest request)
        => HandleResult(await _groups.UpdateMemberRoleAsync(groupId, memberId, request.Role, _currentUser.UserId));

    [HttpDelete("{groupId:guid}/members/{memberId:guid}")]
    public async Task<ActionResult> RemoveMember(Guid groupId, Guid memberId)
        => HandleResult(await _groups.RemoveMemberAsync(groupId, memberId, _currentUser.UserId));
}
