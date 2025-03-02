import { Configuration, LogLevel } from "@azure/msal-browser";

// MSAL configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: "5ad4bc33-fb98-47c5-a808-a254f7a37ded",
    authority: "https://login.microsoftonline.com/43e5dc39-9e1f-4979-b674-674ace58ff9a",
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: true
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
        }
      },
      logLevel: LogLevel.Verbose
    },
  },
};

// Add scopes for accessing Microsoft Graph API to get user details
export const loginRequest = {
  scopes: ["User.Read", "openid", "profile", "email"]
};

// Define any protected resources, like your API
export const protectedResources = {
  timeSheetApi: {
    endpoint: window.location.hostname === 'localhost' 
      ? 'http://localhost:7071/api' 
      : '/api',
    scopes: ["User.Read"] // Simplified scope that should work
  }
}; 