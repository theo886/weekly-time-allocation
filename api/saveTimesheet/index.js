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
    
    // Create a local copy of the timesheet to avoid modifying the original
    const timesheet = { ...req.body };
    
    // Ensure the timesheet has an ID
    if (!timesheet.id) {
        timesheet.id = `timesheet-${Date.now()}`;
        context.log(`🔍 API: No ID provided, generated: ${timesheet.id}`);
    }
    
    context.log(`🔍 API: Received timesheet data: ${JSON.stringify(timesheet)}`);
    
    try {
        context.log('🔍 API: Creating Cosmos DB client');
        // Create client instance
        const client = new CosmosClient({ endpoint, key });
        
        try {
            // First, check read permissions with a simple read operation
            context.log('🔍 API: Testing read permissions...');
            try {
                const { databases } = await client.databases.readAll().fetchAll();
                context.log(`🔍 API: Read permissions verified. Found ${databases.length} databases.`);
            } catch (readError) {
                context.log.error(`❌ API: Read permission test failed: ${readError.message}`);
                context.log.error(`❌ API: This suggests the credentials may not have read access.`);
                throw new Error(`Read permission test failed: ${readError.message}`);
            }
            
            // Ensure database exists
            context.log(`🔍 API: Checking if database "${databaseId}" exists`);
            let database;
            try {
                const dbResponse = await client.databases.createIfNotExists({ id: databaseId });
                database = dbResponse.database;
                context.log(`🔍 API: Database "${databaseId}" confirmed`);
            } catch (dbError) {
                context.log.error(`❌ API: Failed to create/confirm database: ${dbError.message}`);
                context.log.error(`❌ API: This suggests the credentials may not have write access.`);
                throw new Error(`Failed to create/confirm database: ${dbError.message}`);
            }
            
            try {
                // Ensure container exists
                context.log(`🔍 API: Checking if container "${containerId}" exists`);
                let container;
                try {
                    const containerResponse = await database.containers.createIfNotExists({ 
                        id: containerId,
                        partitionKey: { paths: ["/id"] }
                    });
                    container = containerResponse.container;
                    context.log(`🔍 API: Container "${containerId}" confirmed with partition key "/id"`);
                } catch (containerError) {
                    context.log.error(`❌ API: Failed to create/confirm container: ${containerError.message}`);
                    context.log.error(`❌ API: This suggests the credentials may not have container write access.`);
                    throw new Error(`Failed to create/confirm container: ${containerError.message}`);
                }
                
                // Test container read access first
                context.log(`🔍 API: Testing container read access...`);
                try {
                    const { resources } = await container.items.readAll().fetchAll();
                    context.log(`🔍 API: Container read access verified. Found ${resources.length} items.`);
                } catch (containerReadError) {
                    context.log.error(`❌ API: Container read test failed: ${containerReadError.message}`);
                    throw new Error(`Container read test failed: ${containerReadError.message}`);
                }
                
                let response;
                
                try {
                    // Create a very simple test object to verify writing works
                    if (timesheet._testPermissions === true) {
                        const testObj = {
                            id: `permission-test-${Date.now()}`,
                            test: true
                        };
                        context.log(`🔍 API: Testing write permissions with simple object: ${JSON.stringify(testObj)}`);
                        response = await container.items.create(testObj);
                        context.log(`🔍 API: Write permissions verified. Test object created successfully.`);
                        
                        // Return success for the permission test
                        context.res = {
                            status: 200,
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: { message: "Permission test successful", testId: testObj.id }
                        };
                        return;
                    }
                    
                    // Normal operation - create or replace the timesheet
                    context.log(`🔍 API: Attempting to save timesheet with ID: ${timesheet.id}`);
                    response = await container.items.upsert(timesheet);
                    context.log(`🔍 API: Timesheet saved successfully with upsert operation`);
                    
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
                        statusCode: itemError.statusCode || 'No status',
                        headers: itemError.headers || 'No headers'
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
            type: error.constructor.name,
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
        } else if (error.name === "TypeError" || error.message.includes("undefined") || error.message.includes("null")) {
            errorMessage = "Type error. Possibly missing required fields in the data.";
        }
        
        context.res = {
            status: statusCode,
            headers: {
                'Content-Type': 'application/json'
            },
            body: { 
                error: errorMessage,
                details: error.message,
                code: error.code || error.statusCode,
                name: error.name
            }
        };
    }
}; 