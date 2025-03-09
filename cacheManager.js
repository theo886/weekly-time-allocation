// cacheManager.js
const timeEntriesCache = {};

function setEntriesForUser(userId, weekKey, entries) {
  if (!timeEntriesCache[userId]) {
    timeEntriesCache[userId] = {};
  }
  timeEntriesCache[userId][weekKey] = JSON.parse(JSON.stringify(entries));
}

function getEntriesForUser(userId, weekKey) {
  if (!timeEntriesCache[userId] || !timeEntriesCache[userId][weekKey]) return undefined;
  return JSON.parse(JSON.stringify(timeEntriesCache[userId][weekKey]));
}

function getAllKeysForUser(userId) {
  if (!timeEntriesCache[userId]) return [];
  return Object.keys(timeEntriesCache[userId]);
}

function clearCache(userId, weekKey) {
  if (userId && weekKey) {
    if (timeEntriesCache[userId]) {
      delete timeEntriesCache[userId][weekKey];
    }
  } else if (userId) {
    delete timeEntriesCache[userId];
  } else {
    for (const k in timeEntriesCache) {
      delete timeEntriesCache[k];
    }
  }
}

// For browser environment
if (typeof window !== 'undefined') {
  window.cacheManager = {
    setEntriesForUser,
    getEntriesForUser,
    getAllKeysForUser,
    clearCache
  };
}

// For Node.js environment (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    setEntriesForUser,
    getEntriesForUser,
    getAllKeysForUser,
    clearCache
  };
}