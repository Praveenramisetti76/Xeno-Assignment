const cacheStore = new Map();

function getCache(key) {
  return cacheStore.get(key) || null;
}

function setCache(key, value, ttlMs = 60000) {
  cacheStore.set(key, value);
  setTimeout(() => cacheStore.delete(key), ttlMs);
}

module.exports = { getCache, setCache };
