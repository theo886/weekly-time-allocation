import React, { ReactNode, useEffect } from "react";
import { MsalProvider, useMsal, useIsAuthenticated } from "@azure/msal-react";
import { PublicClientApplication, EventType, AccountInfo, InteractionStatus } from "@azure/msal-browser";
import { msalConfig, loginRequest } from "./authConfig";

// Initialize MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);

// Handle the redirect response
if (!window.location.hash.includes("error")) {
  msalInstance.handleRedirectPromise().catch(error => {
    console.error("Redirect handling error:", error);
  });
}

// Default redirect behavior after login
msalInstance.addEventCallback(event => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
    // The event payload for LOGIN_SUCCESS should contain the account
    // Safely type check the event payload
    const payload = event.payload as { account?: AccountInfo };
    if (payload.account) {
      msalInstance.setActiveAccount(payload.account);
      console.log("Login successful, account set:", payload.account);
    }
  }
});

interface AuthProviderProps {
  children: ReactNode;
}

export const MsalAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
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
const AuthenticationHandler: React.FC<{ children: ReactNode }> = ({ children }) => {
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
export const getUserInfo = (account: AccountInfo | null) => {
  if (!account) return null;
  
  return {
    username: account.username,
    name: account.name || account.username,
    email: account.username,
    userId: account.localAccountId,
    tenantId: account.tenantId
  };
}; 