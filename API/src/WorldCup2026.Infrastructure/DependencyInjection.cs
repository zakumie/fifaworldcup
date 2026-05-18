using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;
using WorldCup2026.Application.Interfaces;
using WorldCup2026.Infrastructure.BackgroundJobs;
using WorldCup2026.Infrastructure.Data;
using WorldCup2026.Infrastructure.External;
using WorldCup2026.Infrastructure.Services;

namespace WorldCup2026.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Database
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.EnableRetryOnFailure(3)));

        // Redis Cache with connection pooling and validation
        var redisConnectionString = configuration.GetConnectionString("Redis") 
            ?? Environment.GetEnvironmentVariable("REDIS_CONNECTION_STRING")
            ?? "localhost:6379";
            
        var configOptions = ConfigurationOptions.Parse(redisConnectionString);
        configOptions.ConnectRetry = 3;
        configOptions.ConnectTimeout = 5000;
        configOptions.SyncTimeout = 5000;
        configOptions.AbortOnConnectFail = false;
        
        var multiplexer = ConnectionMultiplexer.Connect(configOptions);
        services.AddSingleton<IConnectionMultiplexer>(multiplexer);
        
        services.AddStackExchangeRedisCache(options =>
        {
            options.InstanceName = "WORLDCUP_2026_REDIS";
            options.ConfigurationOptions = configOptions;
        });

        // HTTP Client for football-data.org
        services.AddHttpClient("FootballData");

        // Services
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IGoogleTokenValidator, GoogleTokenValidator>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IGroupService, GroupService>();
        services.AddScoped<IMatchService, MatchService>();
        services.AddScoped<IBettingService, BettingService>();
        services.AddScoped<ILeaderboardService, LeaderboardService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ICacheService, CacheService>();
        services.AddScoped<IExternalMatchService, FootballDataService>();

        // Background Jobs
        services.AddHostedService<MatchFetchJob>();
        services.AddHostedService<BetSettlementJob>();
        services.AddHostedService<LeaderboardSnapshotJob>();

        return services;
    }
}
