using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
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
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.EnableRetryOnFailure(3)));

        // Redis Cache
        services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = configuration.GetConnectionString("Redis") ?? "localhost:6379";
            options.InstanceName = "wc2026_";
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
