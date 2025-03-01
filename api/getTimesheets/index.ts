import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  context.log('HTTP trigger function processed a request to get timesheets');

  try {
    // Get user ID from the request (could be from auth in a real app)
    const userId = req.query.userId || "default-user";
    
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
    
    // Query for all timesheets for the given user
    const querySpec = {
      query: "SELECT * FROM c WHERE c.userId = @userId",
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
      body: timesheets
    };
  } catch (error) {
    context.log.error("Error fetching timesheets:", error);
    context.res = {
      status: 500,
      body: "An error occurred while retrieving timesheets: " + error.message
    };
  }
};

export default httpTrigger; 