import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
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
    const { userId, userEmail, userName } = req.body;
    
    if (!userId || !userEmail) {
      context.res = {
        status: 400,
        body: "User information is required"
      };
      return;
    }
    
    // Extract timesheet data from the request body
    const timesheet = req.body;
    
    // Add metadata
    timesheet.id = timesheet.id || `${userId}-${timesheet.weekStarting}`;
    timesheet.createdAt = timesheet.createdAt || new Date().toISOString();
    timesheet.updatedAt = new Date().toISOString();
    
    // In a real app, you would get these from environment variables
    const endpoint = process.env.COSMOS_ENDPOINT || "";
    const key = process.env.COSMOS_KEY || "";
    const databaseId = process.env.COSMOS_DATABASE || "timesheets";
    const containerId = process.env.COSMOS_CONTAINER || "records";
    
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
  } catch (error) {
    context.log.error("Error saving timesheet:", error);
    context.res = {
      status: 500,
      body: "An error occurred while saving the timesheet: " + error.message
    };
  }
};

export default httpTrigger; 