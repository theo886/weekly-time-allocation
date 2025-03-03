# Weekly Time Allocation App

A web application for tracking and managing weekly time allocations across different projects.

## Setup Instructions

### Prerequisites

- Node.js 14+ and npm
- Azure account (for Cosmos DB and Static Web Apps)

### Local Development Setup

1. **Clone the repository**
   ```
   git clone https://github.com/yourusername/weekly-time-allocation.git
   cd weekly-time-allocation
   ```

2. **Install dependencies**
   ```
   npm install
   cd api
   npm install
   cd ..
   ```

3. **Set up Cosmos DB**
   - Create a Cosmos DB account in Azure
   - Get your Cosmos DB endpoint and key
   - Update `api/local.settings.json` with your Cosmos DB details:
     ```json
     {
       "COSMOS_ENDPOINT": "https://your-cosmosdb-account.documents.azure.com:443/",
       "COSMOS_KEY": "your-cosmos-db-primary-key",
       "COSMOS_DATABASE": "TimeAllocation",
       "COSMOS_CONTAINER": "Timesheets"
     }
     ```

4. **Run the application locally**
   ```
   # Terminal 1 - Frontend
   npm start

   # Terminal 2 - API
   cd api
   npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:7071/api

## Deployment

### Deploy to Azure Static Web Apps

1. **Set up GitHub Actions**
   - Create a new Azure Static Web App in the Azure Portal
   - Get the deployment token 
   - Add it to your GitHub repository as a secret named `AZURE_STATIC_WEB_APPS_API_TOKEN`

2. **Configure environmennt variables**
   - In Azure Portal, add the Cosmos DB connection details as application settings:
     - COSMOS_ENDPOINT
     - COSMOS_KEY
     - COSMOS_DATABASE
     - COSMOS_CONTAINER

3. **Push to GitHub**
   - Push your changes to GitHub, and GitHub Actions will deploy your application

## Troubleshooting

### Common issues

1. **API not connecting to Cosmos DB**
   - Verify your Cosmos DB connection details
   - Check the Azure Functions logs for database connection errors
   - Make sure your database and container exist

2. **Authentication Issues**
   - Verify Azure AD app registration configuration
   - Check token scopes and permissions

## Project Structure

- `/src` - Frontend React application
- `/api` - Azure Functions API
  - `/getTimesheets` - Function to retrieve timesheet data
  - `/saveTimesheet` - Function to save timesheet data
  - `/shared` - Shared utilities for the API
- `/.github/workflows` - GitHub Actions deployment workflow 