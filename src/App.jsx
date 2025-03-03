import React from 'react';
import './App.css';
import WeeklyPercentageTracker from './components/WeeklyPercentageTracker';
import { MsalAuthProvider } from './auth/AuthProvider';
import { LoginButton } from './components/LoginButton';
import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import DebugInfo from './components/DebugInfo';

function App() {
  return (
    <MsalAuthProvider>
      <div className="App">
        <header className="bg-indigo-700 text-white p-4 shadow-md">
          <div className="container mx-auto flex flex-col sm:flex-row justify-center sm:justify-between items-center">
            <h1 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-0">Weekly Time Allocation</h1>
            <LoginButton />
          </div>
        </header>
        
        <main className="container mx-auto py-4 sm:py-8 px-4 sm:px-0">
          <AuthenticatedTemplate>
            <WeeklyPercentageTracker />
          </AuthenticatedTemplate>
          
          <UnauthenticatedTemplate>
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md text-center max-w-md mx-auto mt-6 sm:mt-12">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-indigo-700">Welcome!</h2>
              <p className="mb-6 text-gray-600">
                Please sign in with your Microsoft account to access your weekly time allocation tracker.
              </p>
              <div className="flex justify-center">
                <LoginButton />
              </div>
            </div>
          </UnauthenticatedTemplate>
        </main>
        
        <footer className="bg-slate-100 border-t mt-8 sm:mt-12 py-4 sm:py-6">
          <div className="container mx-auto text-center text-slate-500 px-4">
            <p>© 2025 Your Company. All rights reserved.</p>
          </div>
        </footer>
        
        <DebugInfo />
      </div>
    </MsalAuthProvider>
  );
}

export default App; 