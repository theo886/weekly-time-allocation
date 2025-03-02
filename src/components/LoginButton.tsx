import React, { useState } from 'react';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { loginRequest } from '../auth/authConfig';
import { Button } from './ui/button';
import { LogIn, LogOut, User } from 'lucide-react';
import { useCurrentUser, getUserInfo } from '../auth/AuthProvider';

export const LoginButton: React.FC = () => {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const currentUser = useCurrentUser();
  const userInfo = getUserInfo(currentUser);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setError(null);
      console.log("Starting login process...");
      
      // Instead of clearCache (which doesn't exist), just logout before login
      // This can help with authentication loops
      if (accounts.length > 0) {
        // Remove all accounts from the cache
        accounts.forEach(account => {
          instance.logoutRedirect({
            account,
            postLogoutRedirectUri: window.location.origin
          }).catch(e => console.error("Logout during login failed:", e));
          return; // Just remove the first account
        });
      } else {
        await instance.loginRedirect(loginRequest);
      }
    } catch (error) {
      console.error("Login failed:", error);
      setError("Login failed. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log("Starting logout process...");
      await instance.logoutRedirect();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // If there's an error, show it
  if (error) {
    return (
      <div className="flex items-center">
        <span className="text-red-500 mr-2">{error}</span>
        <Button 
          onClick={() => setError(null)}
          variant="outline"
        >
          Dismiss
        </Button>
      </div>
    );
  }

  if (isAuthenticated && userInfo) {
    return (
      <div className="flex items-center">
        <div className="mr-4 text-sm">
          <div className="font-medium text-slate-700">{userInfo.name}</div>
          <div className="text-slate-500 text-xs">{userInfo.email}</div>
        </div>
        <Button 
          variant="outline" 
          onClick={handleLogout} 
          className="flex items-center"
          disabled={isLoggingIn}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <Button 
      onClick={handleLogin}
      className="flex items-center bg-blue-600 hover:bg-blue-700"
      disabled={isLoggingIn}
    >
      <LogIn className="h-4 w-4 mr-2" />
      {isLoggingIn ? "Signing in..." : "Sign in with Microsoft"}
    </Button>
  );
}; 