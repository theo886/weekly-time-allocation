const { CosmosClient } = require("@azure/cosmos");

// Initialize the Cosmos client
const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DATABASE || "Timesheets";
const containerId = process.env.COSMOS_CONTAINER || "TimeAllocation";

module.exports = async function (context, req) {
    context.log('🔍 API: Processing saveTimesheet request');
    
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
    
    // Ensure request body exists
    if (!req.body) {
        context.log.error("❌ API: Request body is missing");
        context.res = {
            status: 400,
            body: { error: "Request body is required" }
        };
        return;
    }
    
    const timesheet = req.body;
    context.log(`🔍 API: Received timesheet data: ${JSON.stringify(timesheet)}`);
    
    try {
        context.log('🔍 API: Creating Cosmos DB client');
        // Create client instance
        const client = new CosmosClient({ endpoint, key });
        
        // Ensure database exists
        context.log(`🔍 API: Checking if database "${databaseId}" exists`);
        const { database } = await client.databases.createIfNotExists({ id: databaseId });
        context.log(`🔍 API: Database "${databaseId}" confirmed`);
        
        // Ensure container exists
        context.log(`🔍 API: Checking if container "${containerId}" exists`);
        const { container } = await database.containers.createIfNotExists({ 
            id: containerId,
            partitionKey: { paths: ["/id"] }
        });
        context.log(`🔍 API: Container "${containerId}" confirmed`);
        
        let response;
        
        // If timesheet has an id, replace it, otherwise create a new one
        if (timesheet.id) {
            context.log(`🔍 API: Updating existing timesheet with ID: ${timesheet.id}`);
            response = await container.item(timesheet.id, timesheet.id).replace(timesheet);
            context.log(`🔍 API: Timesheet updated successfully`);
        } else {
            // Generate a new ID if one doesn't exist
            const newTimesheet = {
                ...timesheet,
                id: `timesheet-${Date.now()}`
            };
            context.log(`🔍 API: Creating new timesheet with generated ID: ${newTimesheet.id}`);
            response = await container.items.create(newTimesheet);
            timesheet.id = newTimesheet.id; // Update the id for the response
            context.log(`🔍 API: Timesheet created successfully`);
        }
        
        context.res = {
            status: 200,
            body: timesheet,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        context.log('🔍 API: Successfully completed saveTimesheet request');
    } catch (error) {
        context.log.error(`❌ API: Error saving timesheet: ${error.message}`);
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