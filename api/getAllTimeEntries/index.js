const { CosmosClient } = require("@azure/cosmos");

// Initialize Cosmos client
const endpoint = process.env.COSMOSDB_ENDPOINT;
const key = process.env.COSMOSDB_KEY;
const databaseName = process.env.COSMOSDB_DATABASE;
const containerName = process.env.COSMOSDB_CONTAINER;
const client = new CosmosClient({ endpoint, key });

module.exports = async function (context, req) {
  try {
    const userId = req.query.userId || "defaultUser";
    
    // Query Cosmos DB for all entries matching the userId
    const database = client.database(databaseName);
    const container = database.container(containerName);
    
    const { resources: items } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.userId = @userId",
        parameters: [{ name: "@userId", value: userId }]
      })
      .fetchAll();
    
    context.res = {
      status: 200,
      body: items
    };
  } catch (error) {
    context.log.error("Error fetching time entries:", error);
    context.res = {
      status: 500,
      body: { error: error.message }
    };
  }
};