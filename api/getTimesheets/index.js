const { CosmosClient } = require("@azure/cosmos");

// Initialize the Cosmos client
const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DATABASE || "Timesheets";
const containerId = process.env.COSMOS_CONTAINER || "TimeAllocation";

module.exports = async function (context, req) {
    context.log('Processing getTimesheets request.');
    
    // Check if environment variables are set
    if (!endpoint || !key) {
        context.log.error("Cosmos DB is not configured properly. Missing endpoint or key.");
        context.res = {
            status: 500,
            body: { error: "Database not configured" }
        };
        return;
    }
    
    try {
        // Create client instance
        const client = new CosmosClient({ endpoint, key });
        const database = client.database(databaseId);
        const container = database.container(containerId);
        
        // Query all timesheets
        const { resources } = await container.items.readAll().fetchAll();
        
        context.res = {
            status: 200,
            body: resources
        };
    } catch (error) {
        context.log.error(`Error fetching timesheets: ${error.message}`);
        context.res = {
            status: 500,
            body: { error: error.message }
        };
    }
}; 