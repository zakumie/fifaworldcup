using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using StackExchange.Redis;
using WorldCup2026.Application.Interfaces;

namespace WorldCup2026.Infrastructure.Services;

public class CacheService : ICacheService
{
    private readonly IDistributedCache _cache;
    private readonly IConnectionMultiplexer _redis;

    public CacheService(IDistributedCache cache, IConnectionMultiplexer redis)
    {
        _cache = cache;
        _redis = redis;
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        var data = await _cache.GetStringAsync(key);
        return data == null ? default : JsonSerializer.Deserialize<T>(data);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null)
    {
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expiry ?? TimeSpan.FromMinutes(5)
        };
        var json = JsonSerializer.Serialize(value);
        await _cache.SetStringAsync(key, json, options);
    }

    public async Task RemoveAsync(string key) => await _cache.RemoveAsync(key);

    public async Task RemoveByPrefixAsync(string prefix)
    {
        var db = _redis.GetDatabase();
        var endpoints = _redis.GetEndPoints();
        
        if (endpoints.Length == 0)
            return;
            
        var server = _redis.GetServer(endpoints[0]);
        var pattern = $"WORLDCUP_2026_REDIS:{prefix}*";
        
        var keys = new List<RedisKey>();
        await foreach (var key in server.KeysAsync(pattern: pattern, pageSize: 10000))
        {
            keys.Add(key);
        }
        
        if (keys.Count > 0)
        {
            await db.KeyDeleteAsync(keys.ToArray());
        }
    }
}
