using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorldCup2026.Application.DTOs.Users;
using WorldCup2026.Application.Interfaces;

namespace WorldCup2026.WebAPI.Controllers;

[Authorize]
public class UsersController : BaseApiController
{
    private readonly IUserService _users;
    private readonly ICurrentUser _currentUser;

    public UsersController(IUserService users, ICurrentUser currentUser)
    {
        _users = users;
        _currentUser = currentUser;
    }

    [HttpGet("me")]
    public async Task<ActionResult> GetProfile()
        => HandleResult(await _users.GetProfileAsync(_currentUser.UserId));

    [HttpPut("me")]
    public async Task<ActionResult> UpdateProfile(UpdateProfileRequest request)
        => HandleResult(await _users.UpdateProfileAsync(_currentUser.UserId, request));
}
