using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WorldCup2026.Application.Common;
using WorldCup2026.Application.DTOs.Betting;
using WorldCup2026.Application.Interfaces;
using WorldCup2026.Domain.Entities;
using WorldCup2026.Domain.Enums;
using WorldCup2026.Infrastructure.Data;

namespace WorldCup2026.Infrastructure.Services;

public class BettingService : IBettingService
{
    private readonly AppDbContext _db;
    private readonly ICacheService _cache;
    private readonly ILogger<BettingService> _logger;

    public BettingService(AppDbContext db, ICacheService cache, ILogger<BettingService> logger)
    {
        _db = db;
        _cache = cache;
        _logger = logger;
    }

    public async Task<Result<BettingConfigDto>> CreateConfigAsync(CreateBettingConfigRequest request, Guid userId)
    {
        bool exists = await _db.MatchBettingConfigs.AnyAsync(
            c => c.MatchId == request.MatchId && c.GroupId == request.GroupId);
        if (exists)
            return Result<BettingConfigDto>.Failure("Betting config already exists for this match and group.");

        var config = new MatchBettingConfig
        {
            MatchId = request.MatchId,
            GroupId = request.GroupId,
            Handicap = request.Handicap,
            FavoredTeamId = request.FavoredTeamId,
            Odds = request.Odds,
            MinBetAmount = request.MinBetAmount,
            MaxBetAmount = request.MaxBetAmount,
            DefaultBetAmount = request.DefaultBetAmount,
            IsFixedBet = request.IsFixedBet,
            BettingOpenTime = request.BettingOpenTime,
            BettingCloseTime = request.BettingCloseTime,
            CreatedById = userId
        };

        _db.MatchBettingConfigs.Add(config);

        var match = await _db.Matches.FindAsync(request.MatchId);
        if (match != null && match.Status == MatchStatus.Open)
            match.Status = MatchStatus.Upcoming;

        await _db.SaveChangesAsync();

        return Result<BettingConfigDto>.Success(await GetConfigDtoAsync(config.Id));
    }

    public async Task<Result<BettingConfigDto>> UpdateConfigAsync(Guid configId, UpdateBettingConfigRequest request, Guid userId)
    {
        var config = await _db.MatchBettingConfigs.FindAsync(configId);
        if (config == null) return Result<BettingConfigDto>.Failure("Config not found.");
        if (config.IsSettled) return Result<BettingConfigDto>.Failure("Cannot update settled config.");

        config.Handicap = request.Handicap;
        config.FavoredTeamId = request.FavoredTeamId;
        config.Odds = request.Odds;
        config.MinBetAmount = request.MinBetAmount;
        config.MaxBetAmount = request.MaxBetAmount;
        config.DefaultBetAmount = request.DefaultBetAmount;
        config.IsFixedBet = request.IsFixedBet;
        config.BettingOpenTime = request.BettingOpenTime;
        config.BettingCloseTime = request.BettingCloseTime;

        await _db.SaveChangesAsync();
        return Result<BettingConfigDto>.Success(await GetConfigDtoAsync(config.Id));
    }

    public async Task<Result<BettingConfigDto>> GetConfigAsync(Guid matchId, Guid groupId)
    {
        var config = await _db.MatchBettingConfigs
            .Include(c => c.FavoredTeam)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.MatchId == matchId && c.GroupId == groupId);

        if (config == null) return Result<BettingConfigDto>.Failure("Config not found.");

        return Result<BettingConfigDto>.Success(MapToDto(config));
    }

    public async Task<Result<BetDto>> PlaceBetAsync(PlaceBetRequest request, Guid userId)
    {
        var config = await _db.MatchBettingConfigs
            .Include(c => c.Match)
            .FirstOrDefaultAsync(c => c.Id == request.MatchBettingConfigId);

        if (config == null) return Result<BetDto>.Failure("Betting config not found.");

        // Validate betting window
        var now = DateTime.UtcNow;
        if (now < config.BettingOpenTime)
            return Result<BetDto>.Failure("Betting has not opened yet.");
        if (now > config.BettingCloseTime)
            return Result<BetDto>.Failure("Betting is closed.");
        if (config.Match.Status != MatchStatus.Upcoming && config.Match.Status != MatchStatus.Open)
            return Result<BetDto>.Failure("Cannot bet on a match that has started or finished.");
        if (config.IsSettled)
            return Result<BetDto>.Failure("This match has already been settled.");

        // Validate team selection
        if (request.SelectedTeamId != config.Match.HomeTeamId && request.SelectedTeamId != config.Match.AwayTeamId)
            return Result<BetDto>.Failure("Selected team is not part of this match.");

        // Validate bet amount
        decimal betAmount = config.IsFixedBet && config.DefaultBetAmount.HasValue
            ? config.DefaultBetAmount.Value
            : request.BetAmount;

        if (betAmount < config.MinBetAmount || betAmount > config.MaxBetAmount)
            return Result<BetDto>.Failure($"Bet amount must be between {config.MinBetAmount} and {config.MaxBetAmount}.");

        // Check duplicate bet
        bool alreadyBet = await _db.Bets.AnyAsync(
            b => b.UserId == userId && b.MatchBettingConfigId == config.Id);
        if (alreadyBet)
            return Result<BetDto>.Failure("You have already placed a bet on this match.");

        // Check balance
        var member = await _db.GroupMembers.FirstOrDefaultAsync(
            m => m.GroupId == config.GroupId && m.UserId == userId && m.IsActive);
        if (member == null)
            return Result<BetDto>.Failure("You are not a member of this group.");
        if (member.Balance < betAmount)
            return Result<BetDto>.Failure("Insufficient balance.");

        // Place bet in transaction
        var strategy = _db.Database.CreateExecutionStrategy();
        try
        {
            Guid betId = Guid.Empty;
            await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _db.Database.BeginTransactionAsync();

                decimal balanceBefore = member.Balance;
                member.Balance -= betAmount;

                var bet = new Bet
                {
                    UserId = userId,
                    MatchBettingConfigId = config.Id,
                    GroupId = config.GroupId,
                    MatchId = config.MatchId,
                    SelectedTeamId = request.SelectedTeamId,
                    BetAmount = betAmount
                };
                _db.Bets.Add(bet);

                _db.Transactions.Add(new Transaction
                {
                    UserId = userId,
                    GroupId = config.GroupId,
                    Type = TransactionType.BetPlaced,
                    Amount = -betAmount,
                    BalanceBefore = balanceBefore,
                    BalanceAfter = member.Balance,
                    ReferenceId = bet.Id,
                    Description = $"Bet placed on match {config.MatchId}"
                });

                await _db.SaveChangesAsync();
                await transaction.CommitAsync();
                betId = bet.Id;
            });

            return Result<BetDto>.Success(await GetBetDtoAsync(betId));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to place bet for user {UserId}", userId);
            return Result<BetDto>.Failure("Failed to place bet. Please try again.");
        }
    }

    public async Task<Result<BetDto>> UpdateBetAsync(Guid betId, UpdateBetRequest request, Guid userId)
    {
        var bet = await _db.Bets
            .Include(b => b.BettingConfig)
                .ThenInclude(c => c.Match)
            .FirstOrDefaultAsync(b => b.Id == betId);

        if (bet == null) return Result<BetDto>.Failure("Bet not found.");
        if (bet.UserId != userId) return Result<BetDto>.Failure("You can only edit your own bet.");
        if (bet.Status != BetStatus.Pending) return Result<BetDto>.Failure("Only pending bets can be edited.");

        var config = bet.BettingConfig;
        var now = DateTime.UtcNow;
        if (now > config.BettingCloseTime)
            return Result<BetDto>.Failure("Betting is closed.");
        if (config.Match.Status != MatchStatus.Upcoming && config.Match.Status != MatchStatus.Open)
            return Result<BetDto>.Failure("Cannot edit bet on a match that has started or finished.");
        if (config.IsSettled)
            return Result<BetDto>.Failure("This match has already been settled.");

        if (request.SelectedTeamId != config.Match.HomeTeamId && request.SelectedTeamId != config.Match.AwayTeamId)
            return Result<BetDto>.Failure("Selected team is not part of this match.");

        decimal newBetAmount = config.IsFixedBet && config.DefaultBetAmount.HasValue
            ? config.DefaultBetAmount.Value
            : request.BetAmount;

        if (newBetAmount < config.MinBetAmount || newBetAmount > config.MaxBetAmount)
            return Result<BetDto>.Failure($"Bet amount must be between {config.MinBetAmount} and {config.MaxBetAmount}.");

        var member = await _db.GroupMembers.FirstOrDefaultAsync(
            m => m.GroupId == config.GroupId && m.UserId == userId && m.IsActive);
        if (member == null)
            return Result<BetDto>.Failure("You are not a member of this group.");

        decimal difference = newBetAmount - bet.BetAmount;
        if (difference > 0 && member.Balance < difference)
            return Result<BetDto>.Failure("Insufficient balance.");

        var strategy = _db.Database.CreateExecutionStrategy();
        try
        {
            await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _db.Database.BeginTransactionAsync();

                // Re-read entities inside retry scope to avoid stale tracker state
                var freshMember = await _db.GroupMembers
                    .FirstAsync(m => m.GroupId == config.GroupId && m.UserId == userId && m.IsActive);
                var freshBet = await _db.Bets.FirstAsync(b => b.Id == betId);

                decimal freshDifference = newBetAmount - freshBet.BetAmount;
                if (freshDifference > 0 && freshMember.Balance < freshDifference)
                    throw new InvalidOperationException("Insufficient balance.");

                decimal balanceBefore = freshMember.Balance;
                freshMember.Balance -= freshDifference;

                freshBet.SelectedTeamId = request.SelectedTeamId;
                freshBet.BetAmount = newBetAmount;

                _db.Transactions.Add(new Transaction
                {
                    UserId = userId,
                    GroupId = config.GroupId,
                    Type = TransactionType.BetUpdated,
                    Amount = -freshDifference,
                    BalanceBefore = balanceBefore,
                    BalanceAfter = freshMember.Balance,
                    ReferenceId = freshBet.Id,
                    Description = $"Bet updated on match {config.MatchId}"
                });

                await _db.SaveChangesAsync();
                await transaction.CommitAsync();
            });

            return Result<BetDto>.Success(await GetBetDtoAsync(betId));
        }
        catch (InvalidOperationException ex) when (ex.Message == "Insufficient balance.")
        {
            return Result<BetDto>.Failure("Insufficient balance.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update bet {BetId} for user {UserId}", betId, userId);
            return Result<BetDto>.Failure("Failed to update bet. Please try again.");
        }
    }

    public async Task<Result<List<BetDto>>> GetUserBetsAsync(Guid groupId, Guid userId)
    {
        var bets = await _db.Bets
            .Include(b => b.Match).ThenInclude(m => m.HomeTeam)
            .Include(b => b.Match).ThenInclude(m => m.AwayTeam)
            .Include(b => b.SelectedTeam)
            .Include(b => b.User)
            .Include(b => b.BettingConfig).ThenInclude(c => c.FavoredTeam)
            .AsNoTracking()
            .Where(b => b.GroupId == groupId && b.UserId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => MapBetToDto(b))
            .ToListAsync();

        return Result<List<BetDto>>.Success(bets);
    }

    public async Task<Result<List<BetDto>>> GetMatchBetsAsync(Guid groupId, Guid matchId)
    {
        var bets = await _db.Bets
            .Include(b => b.Match).ThenInclude(m => m.HomeTeam)
            .Include(b => b.Match).ThenInclude(m => m.AwayTeam)
            .Include(b => b.SelectedTeam)
            .Include(b => b.User)
            .Include(b => b.BettingConfig).ThenInclude(c => c.FavoredTeam)
            .AsNoTracking()
            .Where(b => b.GroupId == groupId && b.MatchId == matchId)
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => MapBetToDto(b))
            .ToListAsync();

        return Result<List<BetDto>>.Success(bets);
    }

    public async Task<Result<int>> SettleMatchBetsAsync(Guid matchId, Guid groupId)
    {
        var config = await _db.MatchBettingConfigs
            .Include(c => c.Match)
            .Include(c => c.Group)
            .FirstOrDefaultAsync(c => c.MatchId == matchId && c.GroupId == groupId);

        if (config == null) return Result<int>.Failure("Config not found.");
        if (config.IsSettled) return Result<int>.Failure("Already settled.");
        if (config.Match.Status != MatchStatus.Finished)
            return Result<int>.Failure("Match is not finished yet.");
        if (!config.Match.HomeScore.HasValue || !config.Match.AwayScore.HasValue)
            return Result<int>.Failure("Match scores are not set.");

        var bets = await _db.Bets
            .Where(b => b.MatchBettingConfigId == config.Id && b.Status == BetStatus.Pending)
            .ToListAsync();

        if (bets.Count == 0) return Result<int>.Success(0);

        var strategy = _db.Database.CreateExecutionStrategy();
        try
        {
            await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _db.Database.BeginTransactionAsync();

                // Preload all group members to avoid N+1 queries
                var membersByUserId = await _db.GroupMembers
                    .Where(m => m.GroupId == groupId && m.IsActive)
                    .ToDictionaryAsync(m => m.UserId);

                foreach (var bet in bets)
                {
                    var result = BettingEngine.Calculate(
                        config.Match.HomeScore.Value,
                        config.Match.AwayScore.Value,
                        config.Handicap,
                        config.FavoredTeamId,
                        bet.SelectedTeamId!.Value,
                        config.Match.HomeTeamId,
                        bet.BetAmount,
                        config.Odds);

                    bet.Status = result.Status;
                    bet.SettledAt = DateTime.UtcNow;

                    var member = membersByUserId[bet.UserId];

                    decimal balanceBefore = member.Balance;
                    decimal balanceChange;

                    if (config.Group.SettlementMode == SettlementMode.WinnerKeepsLoserPays)
                    {
                        // Custom mode: Won/HalfWon → get bet back (no profit), Push (draw) → lose 50%, Lost → nothing back
                        bet.Profit = result.Status switch
                        {
                            BetStatus.Won or BetStatus.HalfWon => 0m,
                            BetStatus.Push => -(bet.BetAmount * 0.5m),
                            _ => -bet.BetAmount
                        };
                        balanceChange = result.Status switch
                        {
                            BetStatus.Won or BetStatus.HalfWon => bet.BetAmount,
                            BetStatus.Push => bet.BetAmount * 0.5m,
                            _ => 0m
                        };
                        // Simplify status: no half states in this mode
                        if (result.Status == BetStatus.HalfWon) bet.Status = BetStatus.Won;
                        if (result.Status == BetStatus.HalfLost) bet.Status = BetStatus.Lost;
                    }
                    else
                    {
                        // Normal mode
                        bet.Profit = result.Profit;
                        balanceChange = result.Status switch
                        {
                            BetStatus.Won => bet.BetAmount + result.Profit,
                            BetStatus.HalfWon => bet.BetAmount + result.Profit,
                            BetStatus.Push => bet.BetAmount,
                            BetStatus.HalfLost => bet.BetAmount + result.Profit,
                            BetStatus.Lost => 0,
                            _ => 0
                        };
                    }

                    member.Balance += balanceChange;

                    var txType = bet.Profit >= 0 ? TransactionType.BetWon : TransactionType.BetLost;
                    if (bet.Status == BetStatus.Push) txType = TransactionType.BetRefund;

                    _db.Transactions.Add(new Transaction
                    {
                        UserId = bet.UserId,
                        GroupId = groupId,
                        Type = txType,
                        Amount = balanceChange,
                        BalanceBefore = balanceBefore,
                        BalanceAfter = member.Balance,
                        ReferenceId = bet.Id,
                        Description = $"Bet settlement: {bet.Status}"
                    });
                }

                // Auto-loss for non-bettors in WinnerKeepsLoserPays mode
                int autoLossCount = 0;
                if (config.Group.SettlementMode == SettlementMode.WinnerKeepsLoserPays)
                {
                    var bettorUserIds = bets.Select(b => b.UserId).ToHashSet();
                    var nonBettors = membersByUserId.Values
                        .Where(m => !bettorUserIds.Contains(m.UserId))
                        .ToList();

                    decimal autoLossAmount = config.DefaultBetAmount ?? config.MinBetAmount;

                    foreach (var nonBettor in nonBettors)
                    {
                        decimal balanceBefore = nonBettor.Balance;
                        nonBettor.Balance -= autoLossAmount;

                        var autoBet = new Bet
                        {
                            UserId = nonBettor.UserId,
                            MatchBettingConfigId = config.Id,
                            GroupId = groupId,
                            MatchId = matchId,
                            SelectedTeamId = null,
                            BetAmount = autoLossAmount,
                            Status = BetStatus.Lost,
                            Profit = -autoLossAmount,
                            SettledAt = DateTime.UtcNow
                        };
                        _db.Bets.Add(autoBet);

                        _db.Transactions.Add(new Transaction
                        {
                            UserId = nonBettor.UserId,
                            GroupId = groupId,
                            Type = TransactionType.BetLost,
                            Amount = -autoLossAmount,
                            BalanceBefore = balanceBefore,
                            BalanceAfter = nonBettor.Balance,
                            ReferenceId = autoBet.Id,
                            Description = "Auto-loss: did not place bet"
                        });

                        autoLossCount++;
                    }
                }

                config.IsSettled = true;
                await _db.SaveChangesAsync();
                await transaction.CommitAsync();
            });

            await _cache.RemoveByPrefixAsync($"leaderboard:{groupId}");

            _logger.LogInformation("Settled {Count} bets for match {MatchId} in group {GroupId}",
                bets.Count, matchId, groupId);

            return Result<int>.Success(bets.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to settle bets for match {MatchId}", matchId);
            return Result<int>.Failure("Settlement failed. Please try again.");
        }
    }

    private async Task<BettingConfigDto> GetConfigDtoAsync(Guid configId)
    {
        var c = await _db.MatchBettingConfigs
            .Include(x => x.FavoredTeam)
            .AsNoTracking()
            .FirstAsync(x => x.Id == configId);
        return MapToDto(c);
    }

    public async Task<Result<List<BettingConfigDto>>> GetGroupConfigsAsync(Guid groupId)
    {
        var configs = await _db.MatchBettingConfigs
            .Include(x => x.FavoredTeam)
            .AsNoTracking()
            .Where(x => x.GroupId == groupId)
            .ToListAsync();

        return Result<List<BettingConfigDto>>.Success(configs.Select(MapToDto).ToList());
    }

    private static BettingConfigDto MapToDto(MatchBettingConfig c) =>
        new(c.Id, c.MatchId, c.GroupId, c.Handicap, c.FavoredTeamId,
            c.FavoredTeam?.Name, c.Odds, c.MinBetAmount, c.MaxBetAmount,
            c.DefaultBetAmount, c.IsFixedBet, c.BettingOpenTime,
            c.BettingCloseTime, c.IsSettled, c.CreatedAt);

    private async Task<BetDto> GetBetDtoAsync(Guid betId)
    {
        return await _db.Bets
            .Include(b => b.User)
            .Include(b => b.Match).ThenInclude(m => m.HomeTeam)
            .Include(b => b.Match).ThenInclude(m => m.AwayTeam)
            .Include(b => b.SelectedTeam)
            .Include(b => b.BettingConfig).ThenInclude(c => c.FavoredTeam)
            .AsNoTracking()
            .Where(b => b.Id == betId)
            .Select(b => MapBetToDto(b))
            .FirstAsync();
    }

    private static BetDto MapBetToDto(Bet b) =>
        new(b.Id, b.UserId, b.User.DisplayName, b.MatchId,
            b.Match.HomeTeam.Name, b.Match.AwayTeam.Name,
            b.SelectedTeamId, b.SelectedTeam?.Name,
            b.BetAmount, b.Status, b.Profit,
            b.CreatedAt, b.SettledAt,
            b.BettingConfig.Handicap, b.BettingConfig.FavoredTeam?.Name);
}
