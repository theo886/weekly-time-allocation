# Important Credentials and Configuration

This file contains important credentials and configuration details saved before starting the project from scratch.

## Azure Subscription Information
- AZURE_SUBSCRIPTION_ID=903698d9-fdb2-4101-bf43-4c2b63cddce5
- AZURE_TENANT_ID=43e5dc39-9e1f-4979-b674-674ace58ff9a

## CosmosDB  Configuration
The project uses Azure CosmosDB with the following configuration:

### Required Environment Variables
- COSMOS_ENDPOINT - The CosmosDB endpoint URL
- COSMOS_KEY - The CosmosDB access key

### Database Structure
- Database Name: "Timesheets" (or value from COSMOS_DATABASE env var)
- Container Name: "TimeAllocation" (or value from COSMOS_CONTAINER env var)
- Partition Key: "/id"

## API Functions
The project has two main API functions:
- `saveTimesheet` - Saves timesheet data to CosmosDB
- `getTimesheets` - Retrieves timesheet data from CosmosDB

## Environment Variables
Various environment files (.env, .env.development, .env.production, .env.ci) contain configuration parameters:

### Common Variables
- SKIP_PREFLIGHT_CHECK=true
- GENERATE_SOURCEMAP=false
- DISABLE_ESLINT_PLUGIN=true
- TSC_COMPILE_ON_ERROR=true
- DANGEROUSLY_DISABLE_HOST_CHECK=true (development)
- FAST_REFRESH=false (development & ci)
- INLINE_RUNTIME_CHUNK=false (production & ci)

## Note
Before proceeding with the new implementation, please ensure that you have the actual values for:
- COSMOS_ENDPOINT
- COSMOS_KEY

These values are not stored in the committed code but need to be set in your environment variables. 