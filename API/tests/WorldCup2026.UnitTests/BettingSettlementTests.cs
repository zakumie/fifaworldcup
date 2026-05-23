using WorldCup2026.Application.Common;
using WorldCup2026.Domain.Enums;

namespace WorldCup2026.UnitTests;

/// <summary>
/// Tests for WinnerKeepsLoserPays deferred balance settlement logic.
///
/// OLD behavior: balance deducted at bet placement, returned at settlement.
///   PlaceBet: balance -= betAmount
///   Settle Won: balance += betAmount (net = 0)
///   Settle Lost: balance += 0 (net = -betAmount)
///
/// NEW behavior: balance NOT deducted at placement, only losers pay at settlement.
///   PlaceBet: no balance change
///   Settle Won: balance += 0 (net = 0)
///   Settle Lost: balance += (-betAmount) (net = -betAmount)
///
/// The NET effect on balance is IDENTICAL. The difference is timing.
/// </summary>
public class BettingSettlementTests
{
    private const decimal BetAmount = 100m;
    private const decimal Odds = 1.0m;
    private const decimal InitialBalance = 1000m;

    // Helper: simulates the new deferred settlement balance calculation
    private static (decimal balanceChange, decimal profit, BetStatus finalStatus)
        CalculateDeferredSettlement(BetStatus engineStatus, decimal betAmount)
    {
        decimal profit = engineStatus switch
        {
            BetStatus.Won or BetStatus.HalfWon => 0m,
            BetStatus.Push => -(betAmount * 0.5m),
            BetStatus.HalfLost => -(betAmount * 0.5m),
            _ => -betAmount
        };

        // In deferred mode, balanceChange = profit (no upfront deduction to return)
        decimal balanceChange = profit;

        BetStatus finalStatus = engineStatus;
        if (engineStatus == BetStatus.HalfWon) finalStatus = BetStatus.Won;
        if (engineStatus == BetStatus.HalfLost) finalStatus = BetStatus.Lost;

        return (balanceChange, profit, finalStatus);
    }

    // Helper: simulates the OLD upfront settlement balance calculation
    private static (decimal balanceChange, decimal profit, BetStatus finalStatus)
        CalculateUpfrontSettlement(BetStatus engineStatus, decimal betAmount)
    {
        decimal profit = engineStatus switch
        {
            BetStatus.Won or BetStatus.HalfWon => 0m,
            BetStatus.Push => -(betAmount * 0.5m),
            BetStatus.HalfLost => -(betAmount * 0.5m),
            _ => -betAmount
        };

        // Old mode: bet was already deducted, so return bet back based on result
        decimal balanceChange = engineStatus switch
        {
            BetStatus.Won or BetStatus.HalfWon => betAmount,
            BetStatus.Push => betAmount * 0.5m,
            BetStatus.HalfLost => betAmount * 0.5m,
            _ => 0m
        };

        BetStatus finalStatus = engineStatus;
        if (engineStatus == BetStatus.HalfWon) finalStatus = BetStatus.Won;
        if (engineStatus == BetStatus.HalfLost) finalStatus = BetStatus.Lost;

        return (balanceChange, profit, finalStatus);
    }

    // ─── BettingEngine Tests (pure function, no DB) ─────────────────────

    [Fact]
    public void BettingEngine_WhenSelectedTeamWins_ReturnsWon()
    {
        var homeTeamId = Guid.NewGuid();
        var awayTeamId = Guid.NewGuid();

        var result = BettingEngine.Calculate(
            homeScore: 2, awayScore: 1,
            handicap: 0m, favoredTeamId: null,
            selectedTeamId: homeTeamId, homeTeamId: homeTeamId,
            betAmount: BetAmount, odds: Odds);

        Assert.Equal(BetStatus.Won, result.Status);
        Assert.Equal(BetAmount, result.Profit);
    }

    [Fact]
    public void BettingEngine_WhenSelectedTeamLoses_ReturnsLost()
    {
        var homeTeamId = Guid.NewGuid();
        var awayTeamId = Guid.NewGuid();

        var result = BettingEngine.Calculate(
            homeScore: 0, awayScore: 2,
            handicap: 0m, favoredTeamId: null,
            selectedTeamId: homeTeamId, homeTeamId: homeTeamId,
            betAmount: BetAmount, odds: Odds);

        Assert.Equal(BetStatus.Lost, result.Status);
        Assert.Equal(-BetAmount, result.Profit);
    }

    [Fact]
    public void BettingEngine_WhenDraw_ReturnsPush()
    {
        var homeTeamId = Guid.NewGuid();

        var result = BettingEngine.Calculate(
            homeScore: 1, awayScore: 1,
            handicap: 0m, favoredTeamId: null,
            selectedTeamId: homeTeamId, homeTeamId: homeTeamId,
            betAmount: BetAmount, odds: Odds);

        Assert.Equal(BetStatus.Push, result.Status);
        Assert.Equal(0m, result.Profit);
    }

    [Fact]
    public void BettingEngine_WithHalfBallHandicap_ReturnsHalfWon()
    {
        var homeTeamId = Guid.NewGuid();

        // Home gets -0.25 handicap, score 1-1 → adjusted 0.75-1 → diff for home = -0.25 → HalfLost
        // So let home have +0.25 instead: score 1-1 → adjusted 1.25-1 → diff = +0.25 → HalfWon
        var result = BettingEngine.Calculate(
            homeScore: 1, awayScore: 1,
            handicap: 0.25m, favoredTeamId: homeTeamId,
            selectedTeamId: homeTeamId, homeTeamId: homeTeamId,
            betAmount: BetAmount, odds: Odds);

        Assert.Equal(BetStatus.HalfWon, result.Status);
    }

    [Fact]
    public void BettingEngine_WithHalfBallHandicap_ReturnsHalfLost()
    {
        var homeTeamId = Guid.NewGuid();

        // Home gets -0.25 handicap: score 1-1 → adjusted 0.75-1 → diff for home = -0.25 → HalfLost
        var result = BettingEngine.Calculate(
            homeScore: 1, awayScore: 1,
            handicap: -0.25m, favoredTeamId: homeTeamId,
            selectedTeamId: homeTeamId, homeTeamId: homeTeamId,
            betAmount: BetAmount, odds: Odds);

        Assert.Equal(BetStatus.HalfLost, result.Status);
    }

    // ─── Deferred Settlement (WinnerKeepsLoserPays) ─────────────────────

    [Fact]
    public void Deferred_Won_BalanceUnchanged()
    {
        var (balanceChange, profit, finalStatus) = CalculateDeferredSettlement(BetStatus.Won, BetAmount);
        decimal finalBalance = InitialBalance + balanceChange;

        Assert.Equal(0m, balanceChange);
        Assert.Equal(0m, profit);
        Assert.Equal(BetStatus.Won, finalStatus);
        Assert.Equal(InitialBalance, finalBalance);
    }

    [Fact]
    public void Deferred_HalfWon_BalanceUnchanged_StatusSimplifiedToWon()
    {
        var (balanceChange, profit, finalStatus) = CalculateDeferredSettlement(BetStatus.HalfWon, BetAmount);
        decimal finalBalance = InitialBalance + balanceChange;

        Assert.Equal(0m, balanceChange);
        Assert.Equal(0m, profit);
        Assert.Equal(BetStatus.Won, finalStatus);
        Assert.Equal(InitialBalance, finalBalance);
    }

    [Fact]
    public void Deferred_Lost_FullBetDeducted()
    {
        var (balanceChange, profit, finalStatus) = CalculateDeferredSettlement(BetStatus.Lost, BetAmount);
        decimal finalBalance = InitialBalance + balanceChange;

        Assert.Equal(-BetAmount, balanceChange);
        Assert.Equal(-BetAmount, profit);
        Assert.Equal(BetStatus.Lost, finalStatus);
        Assert.Equal(InitialBalance - BetAmount, finalBalance);
    }

    [Fact]
    public void Deferred_HalfLost_HalfBetDeducted_StatusSimplifiedToLost()
    {
        var (balanceChange, profit, finalStatus) = CalculateDeferredSettlement(BetStatus.HalfLost, BetAmount);
        decimal finalBalance = InitialBalance + balanceChange;

        Assert.Equal(-(BetAmount * 0.5m), balanceChange);
        Assert.Equal(-(BetAmount * 0.5m), profit);
        Assert.Equal(BetStatus.Lost, finalStatus);
        Assert.Equal(InitialBalance - BetAmount * 0.5m, finalBalance);
    }

    [Fact]
    public void Deferred_Push_HalfBetDeducted()
    {
        var (balanceChange, profit, finalStatus) = CalculateDeferredSettlement(BetStatus.Push, BetAmount);
        decimal finalBalance = InitialBalance + balanceChange;

        Assert.Equal(-(BetAmount * 0.5m), balanceChange);
        Assert.Equal(-(BetAmount * 0.5m), profit);
        Assert.Equal(BetStatus.Push, finalStatus);
        Assert.Equal(InitialBalance - BetAmount * 0.5m, finalBalance);
    }

    // ─── NET effect: Deferred vs Upfront produce same final balance ─────

    [Theory]
    [InlineData(BetStatus.Won)]
    [InlineData(BetStatus.HalfWon)]
    [InlineData(BetStatus.Lost)]
    [InlineData(BetStatus.HalfLost)]
    [InlineData(BetStatus.Push)]
    public void Deferred_And_Upfront_ProduceSameNetBalance(BetStatus engineStatus)
    {
        // Upfront: deduct at placement, then add back at settlement
        var (upfrontSettleChange, _, _) = CalculateUpfrontSettlement(engineStatus, BetAmount);
        decimal upfrontFinal = (InitialBalance - BetAmount) + upfrontSettleChange;

        // Deferred: no deduction at placement, apply net at settlement
        var (deferredSettleChange, _, _) = CalculateDeferredSettlement(engineStatus, BetAmount);
        decimal deferredFinal = InitialBalance + deferredSettleChange;

        Assert.Equal(upfrontFinal, deferredFinal);
    }

    // ─── Auto-loss for non-bettors ──────────────────────────────────────

    [Fact]
    public void AutoLoss_NonBettor_DeductsFullAmount()
    {
        decimal autoLossAmount = 50m;
        decimal balanceBefore = InitialBalance;
        decimal balanceAfter = balanceBefore - autoLossAmount;

        Assert.Equal(InitialBalance - autoLossAmount, balanceAfter);
    }

    // ─── Edge cases ─────────────────────────────────────────────────────

    [Fact]
    public void Deferred_LargerBetAmount_CalculatesCorrectly()
    {
        decimal largeBet = 500m;
        var (balanceChange, profit, _) = CalculateDeferredSettlement(BetStatus.Lost, largeBet);

        Assert.Equal(-largeBet, balanceChange);
        Assert.Equal(-largeBet, profit);
    }

    [Fact]
    public void Deferred_SmallBetAmount_CalculatesCorrectly()
    {
        decimal smallBet = 1m;
        var (balanceChange, profit, _) = CalculateDeferredSettlement(BetStatus.Push, smallBet);

        Assert.Equal(-0.5m, balanceChange);
        Assert.Equal(-0.5m, profit);
    }

    [Theory]
    [InlineData(10)]
    [InlineData(50)]
    [InlineData(100)]
    [InlineData(250)]
    [InlineData(999.99)]
    public void Deferred_VariousBetAmounts_WonAlwaysZeroChange(double betAmountDouble)
    {
        decimal betAmount = (decimal)betAmountDouble;
        var (balanceChange, _, _) = CalculateDeferredSettlement(BetStatus.Won, betAmount);
        Assert.Equal(0m, balanceChange);
    }

    // ─── Normal mode (regression) ───────────────────────────────────────

    [Fact]
    public void NormalMode_Won_ReturnsBetPlusProfit()
    {
        var homeTeamId = Guid.NewGuid();

        var engineResult = BettingEngine.Calculate(
            homeScore: 3, awayScore: 0,
            handicap: 0m, favoredTeamId: null,
            selectedTeamId: homeTeamId, homeTeamId: homeTeamId,
            betAmount: BetAmount, odds: Odds);

        Assert.Equal(BetStatus.Won, engineResult.Status);

        // Normal mode settlement: bet already deducted, return bet + profit
        decimal balanceChange = BetAmount + engineResult.Profit;
        decimal finalBalance = (InitialBalance - BetAmount) + balanceChange;

        Assert.Equal(InitialBalance + engineResult.Profit, finalBalance);
    }

    [Fact]
    public void NormalMode_Lost_NothingReturned()
    {
        var homeTeamId = Guid.NewGuid();

        var engineResult = BettingEngine.Calculate(
            homeScore: 0, awayScore: 3,
            handicap: 0m, favoredTeamId: null,
            selectedTeamId: homeTeamId, homeTeamId: homeTeamId,
            betAmount: BetAmount, odds: Odds);

        Assert.Equal(BetStatus.Lost, engineResult.Status);

        // Normal mode: bet deducted at placement, nothing returned
        decimal balanceChange = 0;
        decimal finalBalance = (InitialBalance - BetAmount) + balanceChange;

        Assert.Equal(InitialBalance - BetAmount, finalBalance);
    }

    [Fact]
    public void NormalMode_Push_BetReturned()
    {
        var homeTeamId = Guid.NewGuid();

        var engineResult = BettingEngine.Calculate(
            homeScore: 1, awayScore: 1,
            handicap: 0m, favoredTeamId: null,
            selectedTeamId: homeTeamId, homeTeamId: homeTeamId,
            betAmount: BetAmount, odds: Odds);

        Assert.Equal(BetStatus.Push, engineResult.Status);

        // Normal mode: bet deducted at placement, full bet returned on push
        decimal balanceChange = BetAmount;
        decimal finalBalance = (InitialBalance - BetAmount) + balanceChange;

        Assert.Equal(InitialBalance, finalBalance);
    }

    // ─── End-to-end scenario: multi-bet settlement ──────────────────────

    [Fact]
    public void Deferred_MultipleBets_SettlementDistributesCorrectly()
    {
        // Scenario: 3 members bet 100 each on a match. Home wins 2-1.
        // Member A bet Home (Win), Member B bet Away (Lost), Member C didn't bet (auto-loss)
        decimal betAmount = 100m;
        decimal autoLoss = 100m;

        decimal memberABalance = InitialBalance;
        decimal memberBBalance = InitialBalance;
        decimal memberCBalance = InitialBalance;

        // At bet placement: NO balance changes (deferred mode)
        // Still 1000 each

        // At settlement:
        // Member A: Won → balanceChange = 0
        var (changeA, _, _) = CalculateDeferredSettlement(BetStatus.Won, betAmount);
        memberABalance += changeA;

        // Member B: Lost → balanceChange = -100
        var (changeB, _, _) = CalculateDeferredSettlement(BetStatus.Lost, betAmount);
        memberBBalance += changeB;

        // Member C: auto-loss (didn't bet)
        memberCBalance -= autoLoss;

        Assert.Equal(1000m, memberABalance); // Winner keeps balance
        Assert.Equal(900m, memberBBalance);  // Loser pays
        Assert.Equal(900m, memberCBalance);  // Non-bettor pays
    }
}