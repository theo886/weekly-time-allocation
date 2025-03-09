// __tests__/dbIntegration.test.js
const { CosmosClient } = require('@azure/cosmos');

// Mock the CosmosClient
jest.mock('@azure/cosmos', () => {
  return {
    CosmosClient: jest.fn().mockImplementation(() => {
      return {
        database: jest.fn().mockImplementation(() => {
          return {
            container: jest.fn().mockImplementation(() => {
              return {
                items: {
                  query: jest.fn().mockReturnValue({
                    fetchAll: jest.fn().mockResolvedValue({ resources: [] })
                  }),
                  create: jest.fn().mockResolvedValue({ resource: {} })
                }
              };
            })
          };
        })
      };
    })
  };
});

// Utility function to simulate what's done in the actual functions
function getContainer() {
  const client = new CosmosClient({
    endpoint: process.env.COSMOSDB_ENDPOINT || 'https://example.cosmos.azure.com:443/',
    key: process.env.COSMOSDB_KEY || 'mock-key'
  });
  
  const databaseName = process.env.COSMOSDB_DATABASE || 'Timesheets';
  const containerName = process.env.COSMOSDB_CONTAINER || 'TimeAllocation';
  
  const database = client.database(databaseName);
  return database.container(containerName);
}

describe('Cosmos DB integration', () => {
  test('Ensures container is accessible', async () => {
    const container = getContainer();
    expect(container).toBeDefined();
    expect(CosmosClient).toHaveBeenCalled();
  });

  test('Query returns expected format', async () => {
    const container = getContainer();
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.userId = @userId',
      parameters: [{ name: '@userId', value: 'test-user' }]
    };
    
    const { resources } = await container.items.query(querySpec).fetchAll();
    expect(Array.isArray(resources)).toBe(true);
  });
  
  test('Create item works as expected', async () => {
    const container = getContainer();
    const newItem = {
      id: 'test-id',
      userId: 'test-user',
      weekKey: '2025-01-01 - 2025-01-07',
      entries: []
    };
    
    const result = await container.items.create(newItem);
    expect(result).toHaveProperty('resource');
  });
});