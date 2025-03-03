const cosmosClient = require('../shared/cosmosClient');

/**
 * Azure Function to save a timesheet
 */
const httpTrigger = async function (context, req) {
  context.log('HTTP trigger function processed a request to save a timesheet');

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
    
    if (!req.body) {
      context.res = {
        status: 400,
        body: "Please provide a timesheet in the request body"
      };
      return;
    }

    // Extract user information from the request body
    const timesheet = req.body;
    const { userId, userEmail, userName } = timesheet;
    
    if (!userId || !userEmail) {
      context.res = {
        status: 400,
        body: "User information is required"
      };
      return;
    }
    
    // Add metadata
    timesheet.id = timesheet.id || `${userId}-${timesheet.weekStarting}`;
    timesheet.createdAt = timesheet.createdAt || new Date().toISOString();
    timesheet.updatedAt = new Date().toISOString();
    
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
      
      // Try to get the existing item first (for update vs. create)
      const { resource: existingItem } = await container.item(timesheet.id).read().catch(() => ({ resource: undefined }));
      
      // If the item exists but is owned by a different user, deny the request
      if (existingItem && existingItem.userId !== userId) {
        context.res = {
          status: 403,
          body: "You do not have permission to modify this timesheet"
        };
        return;
      }
      
      let result;
      if (existingItem) {
        // Update the existing item
        result = await container.item(timesheet.id).replace(timesheet);
        context.log(`Updated timesheet with id: ${timesheet.id}`);
      } else {
        // Create a new item
        result = await container.items.create(timesheet);
        context.log(`Created new timesheet with id: ${timesheet.id}`);
      }
      
      context.res = {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          id: timesheet.id,
          message: existingItem ? "Timesheet updated successfully" : "Timesheet created successfully"
        }
      };
    } catch (dbError) {
      context.log.error(`Error with database operation: ${dbError.message}`);
      throw dbError;
    }
  } catch (error) {
    context.log.error("Error saving timesheet:", error);
    context.res = {
      status: 500,
      body: "An error occurred while saving the timesheet: " + error.message
    };
  }
};

module.exports = httpTrigger; 