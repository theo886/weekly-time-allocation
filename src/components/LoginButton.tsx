import React from 'react';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { loginRequest } from '../auth/authConfig';
import { Button } from './ui/button';
import { LogIn, LogOut, User } from 'lucide-react';
import { useCurrentUser, getUserInfo } from '../auth/AuthProvider';

export const LoginButton: React.FC = () => {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const currentUser = useCurrentUser();
  const userInfo = getUserInfo(currentUser);

  const handleLogin = () => {
    instance.loginRedirect(loginRequest).catch(error => {
      console.error("Login failed:", error);
    });
  };

  const handleLogout = () => {
    instance.logoutRedirect().catch(error => {
      console.error("Logout failed:", error);
    });
  };

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
    >
      <LogIn className="h-4 w-4 mr-2" />
      Sign in with Microsoft
    </Button>
  );
}; 