const { CosmosClient } = require("@azure/cosmos");

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
    
    if (!userId) {
      context.res = {
        status: 400,
        body: "User ID is required"
      };
      return;
    }
    
    // In a real app, you would get these from environment variables
    const endpoint = process.env.COSMOS_ENDPOINT || "";
    const key = process.env.COSMOS_KEY || "";
    const databaseId = process.env.COSMOS_DATABASE || "TimeAllocation";
    const containerId = process.env.COSMOS_CONTAINER || "Timesheets";
    
    if (!endpoint || !key) {
      context.res = {
        status: 500,
        body: "Database connection information not configured"
      };
      return;
    }
    
    // Connect to CosmosDB
    const client = new CosmosClient({ endpoint, key });
    const database = client.database(databaseId);
    const container = database.container(containerId);
    
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
    
    const { resources: timesheets } = await container.items.query(querySpec).fetchAll();
    
    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        timesheets: timesheets
      }
    };
  } catch (error) {
    context.log.error("Error fetching timesheets:", error);
    context.res = {
      status: 500,
      body: "An error occurred while retrieving timesheets: " + error.message
    };
  }
};

module.exports = httpTrigger; 