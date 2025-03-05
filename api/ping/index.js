module.exports = async function (context, req) {
    context.log('🔍 API: Ping endpoint called');
    
    // Return process.env details (excluding sensitive information)
    const envInfo = {};
    
    // List of environment variables to check and report (only presence, not values)
    const varsToCheck = ['COSMOS_ENDPOINT', 'COSMOS_KEY', 'COSMOS_DATABASE', 'COSMOS_CONTAINER', 'WEBSITE_SITE_NAME', 'FUNCTIONS_EXTENSION_VERSION'];
    
    varsToCheck.forEach(varName => {
        envInfo[varName] = process.env[varName] ? '✅ Configured' : '❌ Not configured';
    });
    
    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        },
        body: {
            message: "API is operational",
            timestamp: new Date().toISOString(),
            functionName: context.executionContext.functionName,
            invocationId: context.executionContext.invocationId,
            environment: process.env.NODE_ENV || process.env.AZURE_FUNCTIONS_ENVIRONMENT || 'unknown',
            envInfo: envInfo
        }
    };
}; 