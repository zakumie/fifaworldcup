using FluentValidation;
using WorldCup2026.Application.DTOs.Matches;

namespace WorldCup2026.Application.Validators;

public class CreateMatchRequestValidator : AbstractValidator<CreateMatchRequest>
{
    public CreateMatchRequestValidator()
    {
        RuleFor(x => x.HomeTeamId).NotEmpty();
        RuleFor(x => x.AwayTeamId).NotEmpty()
            .NotEqual(x => x.HomeTeamId).WithMessage("Home and Away teams must be different.");
        RuleFor(x => x.MatchDay).GreaterThan(0);
        RuleFor(x => x.Stage).NotEmpty();
        RuleFor(x => x.StartTime).Must(BeUtc).WithMessage("StartTime must be in UTC.");
    }

    private static bool BeUtc(DateTime dt) => dt.Kind != DateTimeKind.Local;
}

public class UpdateMatchRequestValidator : AbstractValidator<UpdateMatchRequest>
{
    public UpdateMatchRequestValidator()
    {
        RuleFor(x => x.HomeTeamId).NotEmpty();
        RuleFor(x => x.AwayTeamId).NotEmpty()
            .NotEqual(x => x.HomeTeamId).WithMessage("Home and Away teams must be different.");
        RuleFor(x => x.MatchDay).GreaterThan(0);
        RuleFor(x => x.Stage).NotEmpty();
        RuleFor(x => x.StartTime).Must(BeUtc).WithMessage("StartTime must be in UTC.");
    }

    private static bool BeUtc(DateTime dt) => dt.Kind != DateTimeKind.Local;
}
