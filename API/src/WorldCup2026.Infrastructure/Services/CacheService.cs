using System.Collections.Concurrent;
using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using WorldCup2026.Application.Interfaces;

namespace WorldCup2026.Infrastructure.Services;

public class CacheService : ICacheService
{
    private readonly IDistributedCache _cache;
    private static readonly ConcurrentDictionary<string, byte> _keys = new();

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
        _keys.TryAdd(key, 0);
    }

    public async Task RemoveAsync(string key)
    {
        await _cache.RemoveAsync(key);
        _keys.TryRemove(key, out _);
    }

    public async Task RemoveByPrefixAsync(string prefix)
    {
        var matchingKeys = _keys.Keys.Where(k => k.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)).ToList();
        foreach (var key in matchingKeys)
        {
            await _cache.RemoveAsync(key);
            _keys.TryRemove(key, out _);
        }
    }
}
