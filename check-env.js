const { CosmosClient } = require("@azure/cosmos");

// Gather environment variables
console.log("testing Environment Variable Check:");
console.log("testing ==========================");
console.log(`testing NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`testing COSMOS_ENDPOINT configured: ${!!process.env.COSMOS_ENDPOINT}`);
console.log(`testing COSMOS_KEY configured: ${!!process.env.COSMOS_KEY}`);
console.log(`testing COSMOS_DATABASE: ${process.env.COSMOS_DATABASE || 'Timesheets'}`);
console.log(`testing COSMOS_CONTAINER: ${process.env.COSMOS_CONTAINER || 'TimeAllocation'}`);

// Try to connect to Cosmos DB if credentials are provided
async function checkCosmosConnection() {
  const endpoint = process.env.COSMOS_ENDPOINT;
  const key = process.env.COSMOS_KEY;
  const databaseId = process.env.COSMOS_DATABASE || "Timesheets";
  const containerId = process.env.COSMOS_CONTAINER || "TimeAllocation";
  
  if (!endpoint || !key) {
    console.log("\ntesting Cannot test connection: Missing Cosmos DB credentials");
    return;
  }
  
  console.log("\ntesting Testing Cosmos DB Connection:");
  console.log("testing ===========================");
  
  try {
    console.log("testing Creating CosmosClient...");
    const client = new CosmosClient({ endpoint, key });
    
    console.log("testing Checking database...");
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    console.log(`testing Database '${databaseId}' exists or was created`);
    
    console.log("testing Checking container...");
    const { container } = await database.containers.createIfNotExists({ 
      id: containerId,
      partitionKey: { paths: ["/id"] }
    });
    console.log(`testing Container '${containerId}' exists or was created`);
    
    console.log("testing Querying items...");
    const { resources } = await container.items.readAll().fetchAll();
    console.log(`testing Found ${resources.length} items in the container`);
    
    if (resources.length > 0) {
      console.log("\ntesting Sample item IDs:");
      resources.slice(0, 5).forEach(item => {
        console.log(`testing - ${item.id}`);
      });
    }
    
    console.log("\ntesting Connection test completed successfully!");
  } catch (error) {
    console.error("\nError connecting to Cosmos DB:");
    console.error(error.message);
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
  }
}

// Run the check
checkCosmosConnection(); 