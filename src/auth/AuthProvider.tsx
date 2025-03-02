import React, { ReactNode } from "react";
import { MsalProvider, useMsal, useIsAuthenticated } from "@azure/msal-react";
import { PublicClientApplication, EventType, AccountInfo } from "@azure/msal-browser";
import { msalConfig } from "./authConfig";

// Initialize MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);

// Default redirect behavior after login
msalInstance.addEventCallback(event => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
    const account = event.payload.account;
    msalInstance.setActiveAccount(account);
  }
});

interface AuthProviderProps {
  children: ReactNode;
}

export const MsalAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  return (
    <MsalProvider instance={msalInstance}>
      {children}
    </MsalProvider>
  );
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