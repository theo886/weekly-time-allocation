const { CosmosClient } = require("@azure/cosmos");

module.exports = async function (context, req) {
    context.log('🔍 API: Processing diagnostics request');
    
    // Get environment variables
    const endpoint = process.env.COSMOS_ENDPOINT;
    const key = process.env.COSMOS_KEY;
    const databaseId = process.env.COSMOS_DATABASE || "Timesheets";
    const containerId = process.env.COSMOS_CONTAINER || "TimeAllocation";
    
    // Prepare diagnostics report
    const diagnostics = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown',
        cosmos: {
            endpointConfigured: !!endpoint,
            keyConfigured: !!key,
            databaseId,
            containerId
        },
        connection: {
            attempted: false,
            successful: false,
            error: null
        },
        database: {
            exists: false,
            error: null
        },
        container: {
            exists: false,
            error: null
        },
        query: {
            attempted: false,
            successful: false,
            itemCount: 0,
            error: null
        }
    };
    
    // Only try to connect if credentials are provided
    if (endpoint && key) {
        try {
            context.log('🔍 API Diagnostics: Creating Cosmos DB client');
            diagnostics.connection.attempted = true;
            
            // Try to create the client
            const client = new CosmosClient({ endpoint, key });
            diagnostics.connection.successful = true;
            
            // Check if database exists
            try {
                context.log(`🔍 API Diagnostics: Checking if database "${databaseId}" exists`);
                const { database } = await client.databases.createIfNotExists({ id: databaseId });
                diagnostics.database.exists = true;
                
                // Check if container exists
                try {
                    context.log(`🔍 API Diagnostics: Checking if container "${containerId}" exists`);
                    const { container } = await database.containers.createIfNotExists({ id: containerId });
                    diagnostics.container.exists = true;
                    
                    // Try to query items
                    try {
                        context.log('🔍 API Diagnostics: Testing query');
                        diagnostics.query.attempted = true;
                        const { resources } = await container.items.readAll().fetchAll();
                        diagnostics.query.successful = true;
                        diagnostics.query.itemCount = resources.length;
                        
                        // Log item IDs for debugging
                        if (resources.length > 0) {
                            diagnostics.query.sampleIds = resources.map(item => item.id).slice(0, 5);
                        }
                    } catch (queryError) {
                        context.log.error(`❌ API Diagnostics: Query error: ${queryError.message}`);
                        diagnostics.query.error = queryError.message;
                    }
                } catch (containerError) {
                    context.log.error(`❌ API Diagnostics: Container error: ${containerError.message}`);
                    diagnostics.container.error = containerError.message;
                }
            } catch (dbError) {
                context.log.error(`❌ API Diagnostics: Database error: ${dbError.message}`);
                diagnostics.database.error = dbError.message;
            }
        } catch (connectionError) {
            context.log.error(`❌ API Diagnostics: Connection error: ${connectionError.message}`);
            diagnostics.connection.error = connectionError.message;
        }
    }
    
    context.res = {
        status: 200,
        body: diagnostics,
        headers: {
            'Content-Type': 'application/json'
        }
    };
}; 