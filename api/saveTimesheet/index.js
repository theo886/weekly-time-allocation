const { CosmosClient } = require("@azure/cosmos");

// This function will be replaced with Cosmos DB integration in production
module.exports = async function (context, req) {
    context.log("JavaScript HTTP trigger function processed a request to save a timesheet");
    
    // Get the timesheet data from the request body
    const timesheet = req.body;
    
    if (!timesheet) {
        context.res = {
            status: 400,
            body: "Please provide a timesheet in the request body"
        };
        return;
    }
    
    // In development, just log the data and return success
    context.log("Timesheet data:", JSON.stringify(timesheet));
    
    context.res = {
        status: 200,
        headers: {
            "Content-Type": "application/json"
        },
        body: {
            message: "Timesheet saved successfully",
            id: `timesheet_${Date.now()}`
        }
    };
}; 