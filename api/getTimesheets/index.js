const { CosmosClient } = require("@azure/cosmos");

// Initialize the Cosmos client
const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DATABASE || "Timesheets";
const containerId = process.env.COSMOS_CONTAINER || "TimeAllocation";

module.exports = async function (context, req) {
    context.log('🔍 API: Processing getTimesheets request');
    
    // Log environment variable status (without revealing values)
    context.log(`🔍 API: COSMOS_ENDPOINT configured: ${!!endpoint}`);
    context.log(`🔍 API: COSMOS_KEY configured: ${!!key}`);
    context.log(`🔍 API: Database ID: ${databaseId}`);
    context.log(`🔍 API: Container ID: ${containerId}`);
    
    // Check if environment variables are set
    if (!endpoint || !key) {
        context.log.error("❌ API: Cosmos DB is not configured properly. Missing endpoint or key.");
        context.res = {
            status: 500,
            body: { error: "Database not configured" }
        };
        return;
    }
    
    try {
        context.log('🔍 API: Creating Cosmos DB client');
        // Create client instance
        const client = new CosmosClient({ endpoint, key });
        const database = client.database(databaseId);
        const container = database.container(containerId);
        
        context.log('🔍 API: Querying for all timesheets');
        // Query all timesheets
        const { resources } = await container.items.readAll().fetchAll();
        
        context.log(`🔍 API: Query successful. Found ${resources.length} items`);
        if (resources.length > 0) {
            context.log(`🔍 API: First item sample: ${JSON.stringify(resources[0]).substring(0, 100)}...`);
        } else {
            context.log(`🔍 API: No items found in container`);
        }
        
        context.res = {
            status: 200,
            body: resources,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        context.log('🔍 API: Successfully completed getTimesheets request');
    } catch (error) {
        context.log.error(`❌ API: Error fetching timesheets: ${error.message}`);
        context.log.error(`❌ API: Error details: ${JSON.stringify(error)}`);
        context.res = {
            status: 500,
            body: { 
                error: error.message,
                stack: error.stack,
                code: error.code
            }
        };
    }
}; 