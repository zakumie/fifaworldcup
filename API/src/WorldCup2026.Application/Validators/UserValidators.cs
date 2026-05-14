using FluentValidation;
using WorldCup2026.Application.DTOs.Users;

namespace WorldCup2026.Application.Validators;

public class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    private static readonly string[] AllowedTimeZones = { "Pacific/Easter", "UTC", "Asia/Ho_Chi_Minh" };

    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.DisplayName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.TimeZone)
            .Must(tz => string.IsNullOrEmpty(tz) || AllowedTimeZones.Contains(tz, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Timezone must be one of: Pacific/Easter, UTC, Asia/Ho_Chi_Minh.")
            .When(x => !string.IsNullOrEmpty(x.TimeZone));
    }
}
