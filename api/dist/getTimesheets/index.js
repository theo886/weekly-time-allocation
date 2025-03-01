"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const cosmos_1 = require("@azure/cosmos");
/**
 * Azure Function to get timesheets for a user
 */
const httpTrigger = function (context, req) {
    return __awaiter(this, void 0, void 0, function* () {
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
            const client = new cosmos_1.CosmosClient({ endpoint, key });
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
            const { resources: timesheets } = yield container.items.query(querySpec).fetchAll();
            context.res = {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: {
                    timesheets: timesheets
                }
            };
        }
        catch (error) {
            context.log.error("Error fetching timesheets:", error);
            context.res = {
                status: 500,
                body: "An error occurred while retrieving timesheets: " + error.message
            };
        }
    });
};
exports.default = httpTrigger;
//# sourceMappingURL=index.js.map