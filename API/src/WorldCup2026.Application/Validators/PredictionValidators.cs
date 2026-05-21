using FluentValidation;
using WorldCup2026.Application.DTOs.Predictions;

namespace WorldCup2026.Application.Validators;

public class CreateChampionConfigRequestValidator : AbstractValidator<CreateChampionConfigRequest>
{
    public CreateChampionConfigRequestValidator()
    {
        RuleFor(x => x.GroupId).NotEmpty();
        RuleFor(x => x.PredictionOpenTime).Must(BeUtc).WithMessage("PredictionOpenTime must be in UTC.");
        RuleFor(x => x.PredictionCloseTime)
            .GreaterThan(x => x.PredictionOpenTime)
            .Must(BeUtc).WithMessage("PredictionCloseTime must be in UTC and after PredictionOpenTime.");
    }

    private static bool BeUtc(DateTime dt) => dt.Kind != DateTimeKind.Local;
}

public class UpdateChampionConfigRequestValidator : AbstractValidator<UpdateChampionConfigRequest>
{
    public UpdateChampionConfigRequestValidator()
    {
        RuleFor(x => x.PredictionOpenTime).Must(BeUtc).WithMessage("PredictionOpenTime must be in UTC.");
        RuleFor(x => x.PredictionCloseTime)
            .GreaterThan(x => x.PredictionOpenTime)
            .Must(BeUtc).WithMessage("PredictionCloseTime must be in UTC and after PredictionOpenTime.");
    }

    private static bool BeUtc(DateTime dt) => dt.Kind != DateTimeKind.Local;
}

public class PlaceChampionPredictionRequestValidator : AbstractValidator<PlaceChampionPredictionRequest>
{
    public PlaceChampionPredictionRequestValidator()
    {
        RuleFor(x => x.GroupId).NotEmpty();
        RuleFor(x => x.SelectedTeamId).NotEmpty();
    }
}

public class SettleChampionPredictionRequestValidator : AbstractValidator<SettleChampionPredictionRequest>
{
    public SettleChampionPredictionRequestValidator()
    {
        RuleFor(x => x.GroupId).NotEmpty();
        RuleFor(x => x.WinnerTeamId).NotEmpty();
    }
}
