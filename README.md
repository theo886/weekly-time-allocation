# Weekly Time Allocation App

A web application for tracking and managing weekly time allocations across different projects, deployed to Azure Static Web Apps.

## Prerequisites

- Azure account (for Cosmos DB and Static Web Apps)
- GitHub repository for source code management

## Deployment to Azure

### 1. Set up Azure Resources

1. **Create a Cosmos DB account**:
   - In Azure Portal, create a new Cosmos DB account
   - Note the endpoint URL (e.g., `https://weekly-time-allocation-db.documents.azure.com:443/`)
   - Get your primary key from the "Keys" section

2. **Create an Azure Static Web App**:
   - In Azure Portal, create a new Static Web App
   - Connect it to your GitHub repository
   - Get the deployment token from the overview page

### 2. Configure GitHub Repository

1. **Add deployment token to GitHub**:
   - Go to your GitHub repository
   - Click on "Settings" > "Secrets and variables" > "Actions"
   - Click "New repository secret"
   - Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - Value: [Paste the deployment token]
   - Click "Add secret"

### 3. Configure Azure Static Web App Settings

1. **Add Cosmos DB configuration**:
   - In Azure Portal, go to your Static Web App
   - Click on "Configuration" in the left menu
   - Add the following application settings:
     - `COSMOS_ENDPOINT`: Your Cosmos DB endpoint (e.g., `https://weekly-time-allocation-db.documents.azure.com:443/`)
     - `COSMOS_KEY`: Your Cosmos DB primary key
     - `COSMOS_DATABASE`: `Timesheets`
     - `COSMOS_CONTAINER`: `TimeAllocation`
   - Click "Save"

### 4. Deploy Your Application

1. **Push changes to GitHub**:
   - The GitHub Actions workflow will automatically deploy your app to Azure
   - Check the GitHub Actions tab for deployment status

## Troubleshooting

### Common issues

1. **API not connecting to Cosmos DB**:
   - Verify Cosmos DB connection details in Azure Static Web App configuration
   - Check the Azure Functions logs in Azure Portal
   - Make sure your database and container names match your configuration

2. **Authentication Issues**:
   - Verify Azure AD app registration settings
   - Check token scopes and permissions
   - Ensure MSAL configuration matches your Azure AD app

3. **Deployment Issues**:
   - Check GitHub Actions workflow logs for errors
   - Verify your deployment token is correctly added to GitHub secrets
   - Ensure the Azure Static Web Apps API token is valid and not expired

## Project Structure

- `/src` - Frontend React application
- `/api` - Azure Functions API
  - `/getTimesheets` - Function to retrieve timesheet data
  - `/saveTimesheet` - Function to save timesheet data
  - `/shared` - Shared utilities for the API
- `/.github/workflows` - GitHub Actions deployment workflow 