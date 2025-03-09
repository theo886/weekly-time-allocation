// __tests__/cacheManager.test.js
const {
  setEntriesForUser,
  getEntriesForUser,
  getAllKeysForUser,
  clearCache
} = require('../cacheManager');

describe('cacheManager tests', () => {
  beforeEach(() => {
    // Clear all data before each test
    clearCache();
  });

  test('setEntriesForUser and getEntriesForUser store and retrieve data', () => {
    const userId = 'user1';
    const sampleEntries = [
      { id: 1, project: 'Project A', percentage: 50 },
      { id: 2, project: 'Project B', percentage: 50 }
    ];
    setEntriesForUser(userId, '2025-01-01 - 2025-01-07', sampleEntries);

    const retrieved = getEntriesForUser(userId, '2025-01-01 - 2025-01-07');
    expect(retrieved).toEqual(sampleEntries);

    // Ensure no mutation
    retrieved[0].percentage = 99;
    const again = getEntriesForUser(userId, '2025-01-01 - 2025-01-07');
    expect(again[0].percentage).toBe(50);
  });

  test('getAllKeysForUser returns the correct list of cached week keys', () => {
    const userId = 'user1';
    setEntriesForUser(userId, 'week1', [{ id: 1 }]);
    setEntriesForUser(userId, 'week2', [{ id: 2 }]);
    const keys = getAllKeysForUser(userId);
    expect(keys).toContain('week1');
    expect(keys).toContain('week2');
    expect(keys.length).toBe(2);
  });

  test('clearCache removes data for specific or all weeks', () => {
    const userId1 = 'user1';
    const userId2 = 'user2';
    setEntriesForUser(userId1, 'week1', [{ id: 1 }]);
    setEntriesForUser(userId1, 'week2', [{ id: 2 }]);
    setEntriesForUser(userId2, 'week1', [{ id: 3 }]);

    // Clear specific week for specific user
    clearCache(userId1, 'week1');
    expect(getEntriesForUser(userId1, 'week1')).toBeUndefined();
    expect(getEntriesForUser(userId1, 'week2')).toBeDefined();
    expect(getEntriesForUser(userId2, 'week1')).toBeDefined();

    // Clear all weeks for specific user
    clearCache(userId1);
    expect(getEntriesForUser(userId1, 'week2')).toBeUndefined();
    expect(getEntriesForUser(userId2, 'week1')).toBeDefined();

    // Clear all data
    clearCache();
    expect(getEntriesForUser(userId2, 'week1')).toBeUndefined();
  });

  test('getEntriesForUser returns undefined for non-existent data', () => {
    expect(getEntriesForUser('nonexistent', 'week1')).toBeUndefined();
    
    const userId = 'user1';
    setEntriesForUser(userId, 'week1', [{ id: 1 }]);
    expect(getEntriesForUser(userId, 'week2')).toBeUndefined();
  });

  test('getAllKeysForUser returns empty array for non-existent user', () => {
    expect(getAllKeysForUser('nonexistent')).toEqual([]);
  });

  test('multiple users are isolated from each other', () => {
    const userId1 = 'user1';
    const userId2 = 'user2';
    const entries1 = [{ id: 1, project: 'Project A', percentage: 100 }];
    const entries2 = [{ id: 2, project: 'Project B', percentage: 100 }];
    
    setEntriesForUser(userId1, 'week1', entries1);
    setEntriesForUser(userId2, 'week1', entries2);
    
    expect(getEntriesForUser(userId1, 'week1')).toEqual(entries1);
    expect(getEntriesForUser(userId2, 'week1')).toEqual(entries2);
  });
});