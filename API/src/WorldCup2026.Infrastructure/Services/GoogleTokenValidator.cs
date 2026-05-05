using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using WorldCup2026.Application.Interfaces;

namespace WorldCup2026.Infrastructure.Services;

public class GoogleTokenValidator : IGoogleTokenValidator
{
    private readonly string _clientId;
    private readonly ILogger<GoogleTokenValidator> _logger;

    public GoogleTokenValidator(IConfiguration configuration, ILogger<GoogleTokenValidator> logger)
    {
        _clientId = configuration["Google:ClientId"]
            ?? throw new InvalidOperationException("Google:ClientId is not configured.");
        _logger = logger;
    }

    public async Task<GoogleUserPayload?> ValidateAsync(string credential)
    {
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { _clientId }
            };

            var payload = await GoogleJsonWebSignature.ValidateAsync(credential, settings);

            return new GoogleUserPayload(
                Sub: payload.Subject,
                Email: payload.Email,
                Name: payload.Name,
                Picture: payload.Picture
            );
        }
        catch (InvalidJwtException ex)
        {
            _logger.LogWarning(ex, "Invalid Google ID token");
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to validate Google ID token");
            return null;
        }
    }
}