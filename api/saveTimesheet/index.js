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
            headers: {
                'Content-Type': 'application/json'
            },
            body: { error: "Database not configured" }
        };
        return;
    }
    
    // Ensure request body exists
    if (!req.body) {
        context.log.error("❌ API: Request body is missing");
        context.res = {
            status: 400,
            headers: {
                'Content-Type': 'application/json'
            },
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
        
        try {
            // Ensure database exists
            context.log(`🔍 API: Checking if database "${databaseId}" exists`);
            const { database } = await client.databases.createIfNotExists({ id: databaseId });
            context.log(`🔍 API: Database "${databaseId}" confirmed`);
            
            try {
                // Ensure container exists
                context.log(`🔍 API: Checking if container "${containerId}" exists`);
                const { container } = await database.containers.createIfNotExists({ 
                    id: containerId,
                    partitionKey: { paths: ["/id"] }
                });
                context.log(`🔍 API: Container "${containerId}" confirmed`);
                
                let response;
                
                try {
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
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: timesheet
                    };
                    
                    context.log('🔍 API: Successfully completed saveTimesheet request');
                } catch (itemError) {
                    context.log.error(`❌ API: Error in item operation: ${itemError.message}`);
                    context.log.error(`❌ API: Item operation error details: ${JSON.stringify({
                        code: itemError.code,
                        body: itemError.body || 'No body',
                        statusCode: itemError.statusCode || 'No status'
                    })}`);
                    throw itemError;
                }
            } catch (containerError) {
                context.log.error(`❌ API: Error with container "${containerId}": ${containerError.message}`);
                throw containerError;
            }
        } catch (databaseError) {
            context.log.error(`❌ API: Error with database "${databaseId}": ${databaseError.message}`);
            throw databaseError;
        }
    } catch (error) {
        context.log.error(`❌ API: Error saving timesheet: ${error.message}`);
        context.log.error(`❌ API: Error details: ${JSON.stringify({
            code: error.code,
            name: error.name,
            stack: error.stack && error.stack.split('\n').slice(0, 3).join('\n')
        })}`);
        
        let errorMessage = "Unknown error occurred";
        let statusCode = 500;
        
        // Determine specific error type for better client feedback
        if (error.name === "TimeoutError" || error.message.includes("timeout")) {
            errorMessage = "Database operation timed out. Please try again.";
        } else if (error.code === "Unauthorized" || error.statusCode === 401) {
            errorMessage = "Not authorized to access the database. Check credentials.";
        } else if (error.code === "Forbidden" || error.statusCode === 403) {
            errorMessage = "Forbidden. The account may not have permission to perform this operation.";
        } else if (error.code === "ResourceNotFound" || error.statusCode === 404) {
            errorMessage = "Resource not found. The database or container may not exist.";
        } else if (error.code === "Conflict" || error.statusCode === 409) {
            errorMessage = "Conflict. An item with this ID may already exist.";
        } else if (error.code === "RequestEntityTooLarge" || error.statusCode === 413) {
            errorMessage = "The timesheet data is too large.";
        } else if (error.code === "TooManyRequests" || error.statusCode === 429) {
            errorMessage = "Too many requests. The database is throttling requests.";
        } else if (error.code === "BadRequest" || error.statusCode === 400) {
            errorMessage = "Bad request. There may be an issue with the timesheet data format.";
        }
        
        context.res = {
            status: statusCode,
            headers: {
                'Content-Type': 'application/json'
            },
            body: { 
                error: errorMessage,
                details: error.message,
                code: error.code || error.statusCode
            }
        };
    }
}; 