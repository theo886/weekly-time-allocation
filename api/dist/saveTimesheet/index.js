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
 * Azure Function to save a timesheet
 */
const httpTrigger = function (context, req) {
    return __awaiter(this, void 0, void 0, function* () {
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
            // Try to get the existing item first (for update vs. create)
            const { resource: existingItem } = yield container.item(timesheet.id).read().catch(() => ({ resource: undefined }));
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
                result = yield container.item(timesheet.id).replace(timesheet);
                context.log(`Updated timesheet with id: ${timesheet.id}`);
            }
            else {
                // Create a new item
                result = yield container.items.create(timesheet);
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
        }
        catch (error) {
            context.log.error("Error saving timesheet:", error);
            context.res = {
                status: 500,
                body: "An error occurred while saving the timesheet: " + error.message
            };
        }
    });
};
exports.default = httpTrigger;
//# sourceMappingURL=index.js.map