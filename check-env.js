const { CosmosClient } = require("@azure/cosmos");

// Gather environment variables
console.log("Environment Variable Check:");
console.log("==========================");
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`COSMOS_ENDPOINT configured: ${!!process.env.COSMOS_ENDPOINT}`);
console.log(`COSMOS_KEY configured: ${!!process.env.COSMOS_KEY}`);
console.log(`COSMOS_DATABASE: ${process.env.COSMOS_DATABASE || 'Timesheets'}`);
console.log(`COSMOS_CONTAINER: ${process.env.COSMOS_CONTAINER || 'TimeAllocation'}`);

// Try to connect to Cosmos DB if credentials are provided
async function checkCosmosConnection() {
  const endpoint = process.env.COSMOS_ENDPOINT;
  const key = process.env.COSMOS_KEY;
  const databaseId = process.env.COSMOS_DATABASE || "Timesheets";
  const containerId = process.env.COSMOS_CONTAINER || "TimeAllocation";
  
  if (!endpoint || !key) {
    console.log("\nCannot test connection: Missing Cosmos DB credentials");
    return;
  }
  
  console.log("\nTesting Cosmos DB Connection:");
  console.log("===========================");
  
  try {
    console.log("Creating CosmosClient...");
    const client = new CosmosClient({ endpoint, key });
    
    console.log("Checking database...");
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    console.log(`Database '${databaseId}' exists or was created`);
    
    console.log("Checking container...");
    const { container } = await database.containers.createIfNotExists({ 
      id: containerId,
      partitionKey: { paths: ["/id"] }
    });
    console.log(`Container '${containerId}' exists or was created`);
    
    console.log("Querying items...");
    const { resources } = await container.items.readAll().fetchAll();
    console.log(`Found ${resources.length} items in the container`);
    
    if (resources.length > 0) {
      console.log("\nSample item IDs:");
      resources.slice(0, 5).forEach(item => {
        console.log(`- ${item.id}`);
      });
    }
    
    console.log("\nConnection test completed successfully!");
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