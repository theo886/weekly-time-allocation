import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  context.log('HTTP trigger function processed a request to save a timesheet');

  try {
    if (!req.body) {
      context.res = {
        status: 400,
        body: "Please provide a timesheet in the request body"
      };
      return;
    }

    // Get user ID from the request (could be from auth in a real app)
    const userId = req.query.userId || req.body.userId || "default-user";
    
    // Extract timesheet data from the request body
    const timesheet = req.body;
    
    // Add metadata
    timesheet.userId = userId;
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