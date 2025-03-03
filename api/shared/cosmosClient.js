const { CosmosClient } = require('@azure/cosmos');

// Get configuration from environment variables
const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DATABASE || "TimeAllocation";
const containerId = process.env.COSMOS_CONTAINER || "Timesheets";

// Create a single client instance that will be reused
const client = endpoint && key ? new CosmosClient({ endpoint, key }) : null;

let database;
let container;

/**
 * Initialize the Cosmos DB connection, creating database and container if they don't exist
 */
async function init() {
  if (!client) {
    throw new Error('CosmosDB client could not be created. Check your environment variables.');
  }

  try {
    console.log(`Initializing Cosmos DB: database=${databaseId}, container=${containerId}`);

    // Create database if it doesn't exist
    const { database: db } = await client.databases.createIfNotExists({ id: databaseId });
    database = db;
    console.log(`Database initialized: ${database.id}`);
    
    // Create container if it doesn't exist with partition key on id
    const { container: cont } = await database.containers.createIfNotExists({ 
      id: containerId,
      partitionKey: { paths: ['/id'] }
    });
    container = cont;
    console.log(`Container initialized: ${container.id}`);
    
    return { database, container };
  } catch (error) {
    console.error(`Error initializing Cosmos DB: ${error.message}`);
    throw error;
  }
}

/**
 * Get the container for data operations
 * Will initialize the connection if needed
 */
async function getContainer() {
  if (!container) {
    await init();
  }
  return container;
}

/**
 * Validate that the Cosmos DB connection is properly configured
 */
function validateConfig() {
  const missingVars = [];
  
  if (!endpoint) missingVars.push('COSMOS_ENDPOINT');
  if (!key) missingVars.push('COSMOS_KEY');
  
  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  return true;
}

// Export the module
module.exports = {
  init,
  getContainer,
  validateConfig,
  databaseId,
  containerId
}; 