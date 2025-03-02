import React, { useEffect } from "react";
import { MsalProvider, useMsal, useIsAuthenticated } from "@azure/msal-react";
import { PublicClientApplication, EventType, InteractionStatus } from "@azure/msal-browser";
import { msalConfig } from "./authConfig";

// Initialize MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);

// Always handle redirects properly
msalInstance.handleRedirectPromise()
  .then(response => {
    if (response) {
      console.log("Redirect handling succeeded:", response);
    }
  })
  .catch(error => {
    console.error("Redirect handling error:", error);
  });

// Default redirect behavior after login
msalInstance.addEventCallback(event => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
    // The event payload for LOGIN_SUCCESS should contain the account
    const payload = event.payload;
    if (payload.account) {
      msalInstance.setActiveAccount(payload.account);
      console.log("Login successful, account set:", payload.account);
    }
  } else if (event.eventType === EventType.LOGOUT_SUCCESS) {
    // Clear cache on logout
    console.log("Logout successful, clearing cache");
    sessionStorage.clear();
  }
});

export const MsalAuthProvider = ({ children }) => {
  useEffect(() => {
    // Check if we have active accounts on component mount
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      msalInstance.setActiveAccount(accounts[0]);
      console.log("Set active account on mount:", accounts[0]);
    }
  }, []);

  return (
    <MsalProvider instance={msalInstance}>
      <AuthenticationHandler>
        {children}
      </AuthenticationHandler>
    </MsalProvider>
  );
};

// Component to handle authentication state
const AuthenticationHandler = ({ children }) => {
  const { instance, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  
  useEffect(() => {
    // If no active account is set but we have accounts in the cache,
    // set the first one as active
    if (!isAuthenticated && inProgress === InteractionStatus.None) {
      const accounts = instance.getAllAccounts();
      if (accounts.length > 0) {
        // Check if there's already an active account to avoid unnecessary updates
        const activeAccount = instance.getActiveAccount();
        if (!activeAccount) {
          instance.setActiveAccount(accounts[0]);
          console.log("Set active account from handler:", accounts[0]);
        }
      }
    }
  }, [instance, inProgress, isAuthenticated]);
  
  return <>{children}</>;
};

// Custom hook to get the currently authenticated user
export const useCurrentUser = () => {
  const { accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  
  if (!isAuthenticated || accounts.length === 0) {
    return null;
  }
  
  return accounts[0];
};

// Get user information from the account
export const getUserInfo = (account) => {
  if (!account) {
    console.log("getUserInfo called with no account");
    return null;
  }
  
  // Ensure we have valid data
  if (!account.localAccountId) {
    console.warn("Account missing localAccountId:", account);
    
    // If for some reason there's an issue with the account ID, use a fallback
    // based on the username to ensure we have a stable userId
    const fallbackId = account.username ? 
      `user_${account.username.replace(/[^a-zA-Z0-9]/g, '_')}` : 
      null;
      
    if (!fallbackId) {
      console.error("Cannot determine user ID from account:", account);
      return null;
    }
    
    return {
      username: account.username,
      name: account.name || account.username,
      email: account.username,
      userId: fallbackId,
      tenantId: account.tenantId || "unknown-tenant"
    };
  }
  
  const userInfo = {
    username: account.username,
    name: account.name || account.username,
    email: account.username,
    userId: account.localAccountId,
    tenantId: account.tenantId
  };
  
  console.log("Generated user info:", userInfo);
  return userInfo;
}; 