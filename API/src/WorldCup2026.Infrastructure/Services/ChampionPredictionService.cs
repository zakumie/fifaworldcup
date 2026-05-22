using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WorldCup2026.Application.Common;
using WorldCup2026.Application.DTOs.Predictions;
using WorldCup2026.Application.Interfaces;
using WorldCup2026.Domain.Entities;
using WorldCup2026.Infrastructure.Data;

namespace WorldCup2026.Infrastructure.Services;

public class ChampionPredictionService : IChampionPredictionService
{
    private readonly AppDbContext _db;
    private readonly ILogger<ChampionPredictionService> _logger;

    public ChampionPredictionService(AppDbContext db, ILogger<ChampionPredictionService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<Result<ChampionConfigDto>> CreateConfigAsync(CreateChampionConfigRequest request, Guid userId)
    {
        bool exists = await _db.ChampionPredictionConfigs.AnyAsync(c => c.GroupId == request.GroupId);
        if (exists)
            return Result<ChampionConfigDto>.Failure("Champion prediction config already exists for this group.");

        var group = await _db.Groups.FindAsync(request.GroupId);
        if (group == null)
            return Result<ChampionConfigDto>.Failure("Group not found.");

        var config = new ChampionPredictionConfig
        {
            GroupId = request.GroupId,
            IsEnabled = request.IsEnabled,
            PredictionOpenTime = request.PredictionOpenTime,
            PredictionCloseTime = request.PredictionCloseTime,
            CreatedById = userId
        };

        _db.ChampionPredictionConfigs.Add(config);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Created champion prediction config for group {GroupId} by user {UserId}",
            request.GroupId, userId);

        return Result<ChampionConfigDto>.Success(await GetConfigDtoAsync(config.Id));
    }

    public async Task<Result<ChampionConfigDto>> UpdateConfigAsync(Guid groupId, UpdateChampionConfigRequest request, Guid userId)
    {
        var config = await _db.ChampionPredictionConfigs
            .FirstOrDefaultAsync(c => c.GroupId == groupId);

        if (config == null)
            return Result<ChampionConfigDto>.Failure("Config not found for this group.");

        if (config.IsSettled)
            return Result<ChampionConfigDto>.Failure("Cannot update settled config.");

        config.IsEnabled = request.IsEnabled;
        config.PredictionOpenTime = request.PredictionOpenTime;
        config.PredictionCloseTime = request.PredictionCloseTime;

        await _db.SaveChangesAsync();

        _logger.LogInformation("Updated champion prediction config for group {GroupId} by user {UserId}",
            groupId, userId);

        return Result<ChampionConfigDto>.Success(await GetConfigDtoAsync(config.Id));
    }

    public async Task<Result<ChampionConfigDto>> GetConfigAsync(Guid groupId)
    {
        var config = await _db.ChampionPredictionConfigs
            .Include(c => c.WinnerTeam)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.GroupId == groupId);

        if (config == null)
            return Result<ChampionConfigDto>.Failure("Config not found for this group.");

        return Result<ChampionConfigDto>.Success(MapToDto(config));
    }

    public async Task<Result<ChampionPredictionDto>> PlacePredictionAsync(PlaceChampionPredictionRequest request, Guid userId)
    {
        var config = await _db.ChampionPredictionConfigs
            .FirstOrDefaultAsync(c => c.GroupId == request.GroupId);

        if (config == null)
            return Result<ChampionPredictionDto>.Failure("Config not found for this group.");

        if (!config.IsEnabled)
            return Result<ChampionPredictionDto>.Failure("Champion predictions are not enabled for this group.");

        // Check if prediction window is open
        var now = DateTime.UtcNow;
        if (now < config.PredictionOpenTime)
            return Result<ChampionPredictionDto>.Failure("Predictions have not opened yet.");
        if (now > config.PredictionCloseTime)
            return Result<ChampionPredictionDto>.Failure("Prediction window has closed.");

        // Verify team exists
        var team = await _db.Teams.FindAsync(request.SelectedTeamId);
        if (team == null)
            return Result<ChampionPredictionDto>.Failure("Selected team not found.");

        // Check group membership
        var member = await _db.GroupMembers
            .FirstOrDefaultAsync(m => m.GroupId == request.GroupId && m.UserId == userId && m.IsActive);
        if (member == null)
            return Result<ChampionPredictionDto>.Failure("You are not a member of this group.");

        // Upsert: find existing prediction and update, or create new
        var existingPrediction = await _db.ChampionPredictions
            .FirstOrDefaultAsync(p => p.UserId == userId && p.GroupId == request.GroupId && p.ConfigId == config.Id);

        if (existingPrediction != null)
        {
            existingPrediction.SelectedTeamId = request.SelectedTeamId;
            existingPrediction.UpdatedAt = DateTime.UtcNow;
            _logger.LogInformation("Updated champion prediction for user {UserId} in group {GroupId}",
                userId, request.GroupId);
        }
        else
        {
            var prediction = new ChampionPrediction
            {
                UserId = userId,
                GroupId = request.GroupId,
                ConfigId = config.Id,
                SelectedTeamId = request.SelectedTeamId
            };
            _db.ChampionPredictions.Add(prediction);
            _logger.LogInformation("Created new champion prediction for user {UserId} in group {GroupId}",
                userId, request.GroupId);
        }

        await _db.SaveChangesAsync();

        return Result<ChampionPredictionDto>.Success(await GetPredictionDtoAsync(userId, request.GroupId));
    }

    public async Task<Result<ChampionPredictionDto?>> GetUserPredictionAsync(Guid groupId, Guid userId)
    {
        var config = await _db.ChampionPredictionConfigs
            .FirstOrDefaultAsync(c => c.GroupId == groupId);

        if (config == null)
            return Result<ChampionPredictionDto?>.Failure("Config not found for this group.");

        var prediction = await _db.ChampionPredictions
            .Include(p => p.User)
            .Include(p => p.SelectedTeam)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId && p.GroupId == groupId && p.ConfigId == config.Id);

        if (prediction == null)
            return Result<ChampionPredictionDto?>.Success(null);

        return Result<ChampionPredictionDto?>.Success(MapPredictionToDto(prediction));
    }

    public async Task<Result<List<ChampionPredictionDto>>> GetGroupPredictionsAsync(Guid groupId)
    {
        var predictions = await _db.ChampionPredictions
            .Include(p => p.User)
            .Include(p => p.SelectedTeam)
            .Include(p => p.Config)
            .AsNoTracking()
            .Where(p => p.GroupId == groupId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => MapPredictionToDto(p))
            .ToListAsync();

        return Result<List<ChampionPredictionDto>>.Success(predictions);
    }

    public async Task<Result<int>> SettlePredictionsAsync(Guid groupId, Guid winnerTeamId, Guid userId)
    {
        var config = await _db.ChampionPredictionConfigs
            .FirstOrDefaultAsync(c => c.GroupId == groupId);

        if (config == null)
            return Result<int>.Failure("Config not found for this group.");

        if (config.IsSettled)
            return Result<int>.Failure("Predictions already settled.");

        // Verify winner team exists
        var winnerTeam = await _db.Teams.FindAsync(winnerTeamId);
        if (winnerTeam == null)
            return Result<int>.Failure("Winner team not found.");

        var predictions = await _db.ChampionPredictions
            .Where(p => p.ConfigId == config.Id)
            .ToListAsync();

        var strategy = _db.Database.CreateExecutionStrategy();
        try
        {
            await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _db.Database.BeginTransactionAsync();

                // Mark each prediction as correct or incorrect
                int settledCount = 0;
                foreach (var prediction in predictions)
                {
                    prediction.IsCorrect = prediction.SelectedTeamId == winnerTeamId;
                    settledCount++;
                }

                // Set winner and mark config as settled
                config.WinnerTeamId = winnerTeamId;
                config.IsSettled = true;

                await _db.SaveChangesAsync();
                await transaction.CommitAsync();
            });

            _logger.LogInformation("Settled {Count} predictions for group {GroupId} with winner team {WinnerTeamId} by user {UserId}",
                predictions.Count, groupId, winnerTeamId, userId);

            return Result<int>.Success(predictions.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to settle predictions for group {GroupId}", groupId);
            return Result<int>.Failure("Settlement failed. Please try again.");
        }
    }

    private async Task<ChampionConfigDto> GetConfigDtoAsync(Guid configId)
    {
        var config = await _db.ChampionPredictionConfigs
            .Include(c => c.WinnerTeam)
            .AsNoTracking()
            .FirstAsync(c => c.Id == configId);

        return MapToDto(config);
    }

    private async Task<ChampionPredictionDto> GetPredictionDtoAsync(Guid userId, Guid groupId)
    {
        var config = await _db.ChampionPredictionConfigs
            .FirstAsync(c => c.GroupId == groupId);

        var prediction = await _db.ChampionPredictions
            .Include(p => p.User)
            .Include(p => p.SelectedTeam)
            .AsNoTracking()
            .FirstAsync(p => p.UserId == userId && p.ConfigId == config.Id);

        return MapPredictionToDto(prediction);
    }

    private static ChampionConfigDto MapToDto(ChampionPredictionConfig config) =>
        new(
            config.Id,
            config.GroupId,
            config.IsEnabled,
            config.PredictionOpenTime,
            config.PredictionCloseTime,
            config.WinnerTeamId,
            config.WinnerTeam?.Name,
            config.IsSettled,
            config.CreatedAt);

    private static ChampionPredictionDto MapPredictionToDto(ChampionPrediction prediction) =>
        new(
            prediction.Id,
            prediction.UserId,
            prediction.User.DisplayName,
            prediction.User.AvatarUrl,
            prediction.GroupId,
            prediction.ConfigId,
            prediction.SelectedTeamId,
            prediction.SelectedTeam.Name,
            prediction.IsCorrect,
            prediction.CreatedAt,
            prediction.UpdatedAt);
}
