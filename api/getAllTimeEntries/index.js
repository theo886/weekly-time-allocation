const cosmosClient = require('../shared/cosmosClient');

module.exports = async function (context, req) {
  try {
    const userId = req.query.userId || "defaultUser";
    
    // Query Cosmos DB for all entries matching the userId
    const items = await cosmosClient.queryItems(
      "SELECT * FROM c WHERE c.userId = @userId",
      [{ name: "@userId", value: userId }]
    );
    
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