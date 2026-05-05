using FluentValidation;
using WorldCup2026.Application.DTOs.Betting;

namespace WorldCup2026.Application.Validators;

public class PlaceBetRequestValidator : AbstractValidator<PlaceBetRequest>
{
    public PlaceBetRequestValidator()
    {
        RuleFor(x => x.MatchBettingConfigId).NotEmpty();
        RuleFor(x => x.SelectedTeamId).NotEmpty();
        RuleFor(x => x.BetAmount).GreaterThan(0);
    }
}

public class CreateBettingConfigRequestValidator : AbstractValidator<CreateBettingConfigRequest>
{
    public CreateBettingConfigRequestValidator()
    {
        RuleFor(x => x.MatchId).NotEmpty();
        RuleFor(x => x.GroupId).NotEmpty();
        RuleFor(x => x.Odds).GreaterThan(0);
        RuleFor(x => x.MinBetAmount).GreaterThan(0);
        RuleFor(x => x.MaxBetAmount).GreaterThan(0)
            .GreaterThanOrEqualTo(x => x.MinBetAmount);
        RuleFor(x => x.BettingCloseTime).GreaterThan(x => x.BettingOpenTime);
    }
}
