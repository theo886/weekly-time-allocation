import React from 'react';
import './App.css';
import WeeklyPercentageTracker from './components/WeeklyPercentageTracker';

function App() {
  return (
    <div className="App">
      <header className="bg-indigo-700 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Weekly Time Allocation</h1>
        </div>
      </header>
      
      <main className="container mx-auto py-8">
        <WeeklyPercentageTracker />
      </main>
      
      <footer className="bg-slate-100 border-t mt-12 py-6">
        <div className="container mx-auto text-center text-slate-500">
          <p>© 2025 Your Company. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App; 