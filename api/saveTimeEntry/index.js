const { v4: uuidv4 } = require('uuid');
const cosmosClient = require('../shared/cosmosClient');

module.exports = async function (context, req) {
  try {
    const { userId, weekKey, entries } = req.body;
    
    if (!userId || !weekKey || !entries) {
      throw new Error("Missing required fields: userId, weekKey, and entries are required");
    }
    
    // Check if entry exists for this user and week
    const existingItems = await cosmosClient.queryItems(
      "SELECT * FROM c WHERE c.userId = @userId AND c.weekKey = @weekKey",
      [
        { name: "@userId", value: userId },
        { name: "@weekKey", value: weekKey }
      ]
    );
    
    if (existingItems.length > 0) {
      // Update existing entry
      const item = existingItems[0];
      item.entries = entries;
      item.updatedAt = new Date().toISOString();
      
      const updatedItem = await cosmosClient.replaceItem(item.id, item.userId, item);
      context.res = { 
        status: 200, 
        body: updatedItem 
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
      
      const createdItem = await cosmosClient.createItem(newItem);
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