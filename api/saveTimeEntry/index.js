const { CosmosClient } = require("@azure/cosmos");
const { v4: uuidv4 } = require('uuid');

// Initialize Cosmos client
const endpoint = process.env.COSMOSDB_ENDPOINT;
const key = process.env.COSMOSDB_KEY;
const databaseName = process.env.COSMOSDB_DATABASE;
const containerName = process.env.COSMOSDB_CONTAINER;
const client = new CosmosClient({ endpoint, key });

module.exports = async function (context, req) {
  try {
    const { userId, weekKey, entries } = req.body;
    
    if (!userId || !weekKey || !entries) {
      throw new Error("Missing required fields: userId, weekKey, and entries are required");
    }
    
    // Check if entry exists for this user and week
    const database = client.database(databaseName);
    const container = database.container(containerName);
    
    const { resources: existingItems } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.userId = @userId AND c.weekKey = @weekKey",
        parameters: [
          { name: "@userId", value: userId },
          { name: "@weekKey", value: weekKey }
        ]
      })
      .fetchAll();
    
    if (existingItems.length > 0) {
      // Update existing entry
      const item = existingItems[0];
      item.entries = entries;
      item.updatedAt = new Date().toISOString();
      
      await container.item(item.id).replace(item);
      context.res = { 
        status: 200, 
        body: item 
      };
    } else {
      // Create new entry
      const newItem = {
        id: uuidv4(),
        userId,
        weekKey,
        entries,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const { resource: createdItem } = await container.items.create(newItem);
      context.res = { 
        status: 201, 
        body: createdItem 
      };
    }
  } catch (error) {
    context.log.error("Error saving time entry:", error);
    context.res = {
      status: 500,
      body: { error: error.message }
    };
  }
};