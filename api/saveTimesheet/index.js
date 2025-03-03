const { CosmosClient } = require("@azure/cosmos");

// Initialize the Cosmos client
const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DATABASE || "Timesheets";
const containerId = process.env.COSMOS_CONTAINER || "TimeAllocation";

module.exports = async function (context, req) {
    context.log('Processing saveTimesheet request.');
    
    // Check if environment variables are set
    if (!endpoint || !key) {
        context.log.error("Cosmos DB is not configured properly. Missing endpoint or key.");
        context.res = {
            status: 500,
            body: { error: "Database not configured" }
        };
        return;
    }
    
    // Ensure request body exists
    if (!req.body) {
        context.res = {
            status: 400,
            body: { error: "Request body is required" }
        };
        return;
    }
    
    const timesheet = req.body;
    
    try {
        // Create client instance
        const client = new CosmosClient({ endpoint, key });
        const database = client.database(databaseId);
        const container = database.container(containerId);
        
        let response;
        
        // If timesheet has an id, replace it, otherwise create a new one
        if (timesheet.id) {
            response = await container.item(timesheet.id, timesheet.id).replace(timesheet);
        } else {
            // Generate a new ID if one doesn't exist
            const newTimesheet = {
                ...timesheet,
                id: `timesheet-${Date.now()}`
            };
            response = await container.items.create(newTimesheet);
            timesheet.id = newTimesheet.id; // Update the id for the response
        }
        
        context.res = {
            status: 200,
            body: timesheet
        };
    } catch (error) {
        context.log.error(`Error saving timesheet: ${error.message}`);
        context.res = {
            status: 500,
            body: { error: error.message }
        };
    }
}; 