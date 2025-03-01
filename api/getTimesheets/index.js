const { CosmosClient } = require("@azure/cosmos");

// This function will be replaced with Cosmos DB integration in production
module.exports = async function (context, req) {
    context.log("JavaScript HTTP trigger function processed a request to get timesheets");
    
    // In development, return mock data
    const mockData = {
        timesheets: [
            {
                id: "user1_3-1-2023-3-7-2023",
                weekStarting: "3/1/2023 - 3/7/2023",
                entries: [
                    { projectId: "1", projectName: "Website Redesign", percentage: "40" },
                    { projectId: "2", projectName: "Mobile App Development", percentage: "60" }
                ],
                total: 100,
                userId: "user1"
            }
        ]
    };

    context.res = {
        status: 200,
        headers: {
            "Content-Type": "application/json"
        },
        body: mockData
    };
}; 