using Microsoft.AspNetCore.Mvc;
using WorldCup2026.Application.DTOs.Auth;
using WorldCup2026.Application.Interfaces;

namespace WorldCup2026.WebAPI.Controllers;

public class AuthController : BaseApiController
{
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth) => _auth = auth;

    [HttpPost("register")]
    public async Task<ActionResult> Register(RegisterRequest request)
        => HandleResult(await _auth.RegisterAsync(request));

    [HttpPost("login")]
    public async Task<ActionResult> Login(LoginRequest request)
        => HandleResult(await _auth.LoginAsync(request));

    [HttpPost("oauth/{provider}")]
    public async Task<ActionResult> OAuthLogin(string provider, [FromBody] OAuthLoginRequest request)
        => HandleResult(await _auth.OAuthLoginAsync(request with { Provider = provider }));

    [HttpPost("google-login")]
    public async Task<ActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
        => HandleResult(await _auth.GoogleLoginAsync(request));

    [HttpPost("refresh-token")]
    public async Task<ActionResult> RefreshToken(RefreshTokenRequest request)
        => HandleResult(await _auth.RefreshTokenAsync(request));

    [HttpPost("logout")]
    public async Task<ActionResult> Logout()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        return HandleResult(await _auth.LogoutAsync(userId.Value));
    }

    private Guid? GetUserId()
    {
        var claim = User.FindFirst("sub") ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        return claim != null && Guid.TryParse(claim.Value, out var id) ? id : null;
    }
}
