const cache = new Map();

export const getCachedData = (key) => {
    return cache.get(key);
};

export const setCachedData = (key, data, ttl = 300000) => { // Default TTL is 5 minutes
    cache.set(key, data);
    setTimeout(() => cache.delete(key), ttl);
}; 