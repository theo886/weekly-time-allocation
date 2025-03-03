import React, { useState } from 'react';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { loginRequest } from '../auth/authConfig';
import { Button } from './ui/button';
import { LogIn, LogOut } from 'lucide-react';
import { useCurrentUser, getUserInfo } from '../auth/AuthProvider';

export const LoginButton: React.FC = () => {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const currentUser = useCurrentUser();
  const userInfo = getUserInfo(currentUser);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      if (isLoggingIn) return; // Prevent multiple login attempts
      
      setIsLoggingIn(true);
      setError(null);
      console.log("Starting login process...");
      
      // Standard login with correct parameters
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error("Login failed:", error);
      setError("Login failed. Please try again.");
      setIsLoggingIn(false); // Reset login state on error
    }
  };

  const handleLogout = async () => {
    try {
      console.log("Starting logout process...");
      const account = instance.getActiveAccount();
      if (account) {
        await instance.logoutRedirect({
          account,
          postLogoutRedirectUri: window.location.origin
        });
      } else {
        await instance.logoutRedirect();
      }
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