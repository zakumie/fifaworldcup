using FluentValidation;
using WorldCup2026.Application.DTOs.Groups;

namespace WorldCup2026.Application.Validators;

public class CreateGroupRequestValidator : AbstractValidator<CreateGroupRequest>
{
    public CreateGroupRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(500);
        RuleFor(x => x.MaxMembers).InclusiveBetween(2, 500);
        RuleFor(x => x.DefaultBalance).GreaterThan(0).LessThanOrEqualTo(1_000_000);
    }
}
