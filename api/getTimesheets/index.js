const cosmosClient = require('../shared/cosmosClient');

/**
 * Azure Function to get timesheets for a user
 */
const httpTrigger = async function (context, req) {
  context.log('HTTP trigger function processed a request to get timesheets');

  try {
    // Check for authentication 
    const authHeader = req.headers["authorization"];
    
    // In production, you should validate the token here
    // This involves checking the signature and claims
    // For simplicity, we're just checking if the header exists
    if (!authHeader && process.env.NODE_ENV === 'production') {
      context.res = {
        status: 401,
        body: "Authorization required"
      };
      return;
    }
    
    // Get user ID from the request
    const userId = req.query.userId;
    context.log(`Received request for timesheets with userId: ${userId}`);
    
    if (!userId) {
      context.log.warn('No user ID provided in request');
      context.res = {
        status: 400,
        body: "User ID is required"
      };
      return;
    }
    
    // Validate the Cosmos DB configuration
    if (!cosmosClient.validateConfig()) {
      context.log.error('Database connection information not configured correctly');
      context.res = {
        status: 500,
        body: "Database connection configuration is missing or incomplete"
      };
      return;
    }
    
    try {
      // Get container using our centralized client
      const container = await cosmosClient.getContainer();
      context.log(`Connected to container: ${cosmosClient.containerId}`);
      
      // Query for all timesheets for the given user
      const querySpec = {
        query: "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.weekStarting DESC",
        parameters: [
          {
            name: "@userId",
            value: userId
          }
        ]
      };
      
      context.log(`Executing query for user ${userId}: ${querySpec.query}`);
      const { resources: timesheets } = await container.items.query(querySpec).fetchAll();
      context.log(`Found ${timesheets.length} timesheets for user ${userId}`);
      
      // For debugging, log the actual timesheets
      if (timesheets.length === 0) {
        context.log('No timesheets found for this user. Returning empty array.');
      } else {
        context.log(`First timesheet: ${JSON.stringify(timesheets[0])}`);
      }
      
      context.res = {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          timesheets: timesheets
        }
      };
    } catch (dbError) {
      context.log.error(`Error with database operation: ${dbError.message}`);
      throw dbError;
    }
  } catch (error) {
    context.log.error("Error fetching timesheets:", error);
    context.res = {
      status: 500,
      body: "An error occurred while retrieving timesheets: " + error.message
    };
  }
};

module.exports = httpTrigger; 