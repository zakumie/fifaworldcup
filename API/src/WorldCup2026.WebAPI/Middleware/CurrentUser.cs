using System.Security.Claims;
using WorldCup2026.Application.Interfaces;

namespace WorldCup2026.WebAPI.Middleware;

public class CurrentUser : ICurrentUser
{
    private readonly IHttpContextAccessor _accessor;

    public CurrentUser(IHttpContextAccessor accessor) => _accessor = accessor;

    public Guid UserId =>
        Guid.TryParse(_accessor.HttpContext?.User.FindFirstValue("sub")
            ?? _accessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id : Guid.Empty;

    public string Email =>
        _accessor.HttpContext?.User.FindFirstValue("email")
        ?? _accessor.HttpContext?.User.FindFirstValue(ClaimTypes.Email)
        ?? string.Empty;

    public bool IsAuthenticated =>
        _accessor.HttpContext?.User.Identity?.IsAuthenticated ?? false;
}
