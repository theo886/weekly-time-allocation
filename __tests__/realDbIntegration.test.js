// __tests__/realDbIntegration.test.js
const { v4: uuidv4 } = require('uuid');

// Load environment variables from local.settings.json
require('dotenv').config({ path: './api/local.settings.json' });

// We need to extract and set the environment variables from the nested structure
const localSettings = require('../api/local.settings.json');
Object.entries(localSettings.Values).forEach(([key, value]) => {
  process.env[key] = value;
});

const cosmosClient = require('../api/shared/cosmosClient');

describe('Real Cosmos DB Integration Tests', () => {
  const testUserId = `test-user-${uuidv4().substring(0, 8)}`;
  const testItems = [];

  // Clear test data after all tests
  afterAll(async () => {
    // Delete all test items created during testing by querying for all test items
    try {
      const allTestItems = await cosmosClient.queryItems(
        "SELECT * FROM c WHERE c.userId = @userId",
        [{ name: "@userId", value: testUserId }]
      );
      
      console.log(`Found ${allTestItems.length} test items to clean up`);
      
      for (const item of allTestItems) {
        try {
          await cosmosClient.deleteItem(item.id, item.userId);
          console.log(`Deleted test item: ${item.id}`);
        } catch (error) {
          console.warn(`Failed to delete test item ${item.id}:`, error.message);
        }
      }
    } catch (error) {
      console.error("Error during cleanup:", error.message);
    }
  }, 30000);

  test('Container is accessible', async () => {
    const container = await cosmosClient.getContainer();
    expect(container).toBeDefined();
  }, 10000);

  test('Can create and retrieve a document', async () => {
    // Create a unique test item
    const newItem = {
      id: uuidv4(),
      userId: testUserId,
      weekKey: '2025-01-01 - 2025-01-07',
      entries: [
        { id: 1, project: 'Test Project A', percentage: 50 },
        { id: 2, project: 'Test Project B', percentage: 50 }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Create the item
    const createdItem = await cosmosClient.createItem(newItem);
    testItems.push(createdItem); // Add to list for cleanup
    
    expect(createdItem).toBeDefined();
    expect(createdItem.id).toBe(newItem.id);
    expect(createdItem.userId).toBe(testUserId);
    
    // Retrieve the item by querying
    const items = await cosmosClient.queryItems(
      "SELECT * FROM c WHERE c.userId = @userId AND c.weekKey = @weekKey",
      [
        { name: "@userId", value: testUserId },
        { name: "@weekKey", value: '2025-01-01 - 2025-01-07' }
      ]
    );
    
    expect(items.length).toBe(1);
    expect(items[0].id).toBe(newItem.id);
    expect(items[0].entries).toHaveLength(2);
  }, 20000);

  test('Can create a document with a specific weekKey and query for it', async () => {
    // Create a unique test item with a more identifiable ID
    const testWeekKey = `test-week-${new Date().toISOString()}`;
    const newItem = {
      id: uuidv4(),
      userId: testUserId,
      weekKey: testWeekKey,
      entries: [
        { id: 1, project: 'Test Project', percentage: 100 }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log(`Creating test item with id: ${newItem.id}, userId: ${testUserId}, weekKey: ${testWeekKey}`);
    
    // Create the item
    const createdItem = await cosmosClient.createItem(newItem);
    testItems.push(createdItem); // Add to list for cleanup
    
    console.log(`Successfully created item with id: ${createdItem.id}`);
    
    // Wait to ensure the item is fully committed
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Query for the item using week key which should be unique
    const existingItems = await cosmosClient.queryItems(
      "SELECT * FROM c WHERE c.userId = @userId AND c.weekKey = @weekKey",
      [
        { name: "@userId", value: testUserId },
        { name: "@weekKey", value: testWeekKey }
      ]
    );
    
    console.log(`Found ${existingItems.length} items matching the query`);
    expect(existingItems.length).toBe(1);
    
    // Verify the retrieved item matches what we created
    expect(existingItems[0].id).toBe(newItem.id);
    expect(existingItems[0].entries[0].project).toBe('Test Project');
    expect(existingItems[0].entries[0].percentage).toBe(100);
  }, 20000);

  test('Can query multiple documents', async () => {
    // Create multiple test documents
    for (let i = 0; i < 3; i++) {
      const newItem = {
        id: uuidv4(),
        userId: testUserId,
        weekKey: `2025-02-0${i + 1} - 2025-02-0${i + 7}`,
        entries: [
          { id: 1, project: `Project ${i + 1}`, percentage: 100 }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Create the item
      const createdItem = await cosmosClient.createItem(newItem);
      testItems.push(createdItem); // Add to list for cleanup
    }
    
    // Query for all items with this test user ID
    const items = await cosmosClient.queryItems(
      "SELECT * FROM c WHERE c.userId = @userId",
      [{ name: "@userId", value: testUserId }]
    );
    
    // Should have at least 5 items (2 from previous tests + 3 from this test)
    expect(items.length).toBeGreaterThanOrEqual(5);
    
    // Filter for just the February entries
    const febItems = items.filter(item => item.weekKey.startsWith('2025-02'));
    expect(febItems.length).toBe(3);
  }, 30000);
});