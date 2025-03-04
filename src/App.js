import React from 'react';
import WeeklyPercentageTracker from './components/WeeklyPercentageTracker';
import DatabaseTest from './components/DatabaseTest';
import DiagnosticsView from './components/DiagnosticsView';

function App() {
  return (
    <div className="min-h-screen py-8 bg-slate-100">
      <main className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Weekly Time Allocation</h1>
        
        {/* Database Test Component */}
        <div className="mb-8">
          <DatabaseTest />
        </div>
        
        {/* Diagnostics Component */}
        <div className="mb-8">
          <DiagnosticsView />
        </div>
        
        {/* Main Application Component */}
        <WeeklyPercentageTracker />
      </main>
    </div>
  );
}

export default App; 