using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using WorldCup2026.Application.Interfaces;

namespace WorldCup2026.Infrastructure.Services;

public class CacheService : ICacheService
{
    private readonly IDistributedCache _cache;

    public CacheService(IDistributedCache cache) => _cache = cache;

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
        // IDistributedCache doesn't support prefix removal.
        // Remove exact key when prefix matches a single known key pattern.
        await _cache.RemoveAsync(prefix);
    }
}
