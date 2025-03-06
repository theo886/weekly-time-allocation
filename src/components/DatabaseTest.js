import React, { useState, useEffect } from 'react';
import { getTimesheets, saveTimesheet, pingApi } from '../services/cosmosService';

const DatabaseTest = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [pingResult, setPingResult] = useState(null);
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    apiCalled: false,
    responseReceived: false,
    timestamp: null,
    isDevelopment: process.env.NODE_ENV === 'development'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setDebugInfo(prev => ({
        ...prev,
        apiCalled: true,
        timestamp: new Date().toISOString()
      }));
      
      const response = await getTimesheets();
      
      setDebugInfo(prev => ({
        ...prev,
        responseReceived: true,
        dataType: Array.isArray(response) ? 'Array' : typeof response,
        dataLength: Array.isArray(response) ? response.length : null
      }));
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setData(response);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTestRecord = async () => {
    try {
      setSaveStatus({ status: 'saving', message: 'Creating test record...' });
      
      // Create a simpler test document with minimal fields
      // This is to test if there's an issue with the document structure
      const simpleTestTimesheet = {
        id: "simple-test-" + Date.now(),
        name: "Simple Test Record",
        type: "timesheet"
      };
      
      console.log('testing 🔍 DatabaseTest: Creating simplified test record:', simpleTestTimesheet);
      
      try {
        const result = await saveTimesheet(simpleTestTimesheet);
        
        if (result.error) {
          console.error('❌ DatabaseTest: Error saving simple record:', result.error);
          setSaveStatus({ 
            status: 'error', 
            message: `Error with simple record: ${result.error}. Trying alternative format...` 
          });
          
          // If the simple record fails, try a different format with explicit partition key match
          const alternativeTimesheet = {
            id: "alt-test-" + Date.now(),
            name: "Alternative Test Format",
            // Ensure partition key is explicitly the same as the id
            partitionKey: "alt-test-" + Date.now()
          };
          
          console.log('testing 🔍 DatabaseTest: Trying alternative format with explicit partition key:', alternativeTimesheet);
          const altResult = await saveTimesheet(alternativeTimesheet);
          
          if (altResult.error) {
            console.error('❌ DatabaseTest: Error saving alternative record:', altResult.error);
            setSaveStatus({ 
              status: 'error', 
              message: `All attempts failed. Last error: ${altResult.error}` 
            });
          } else {
            console.log('testing 🔍 DatabaseTest: Alternative format succeeded:', altResult);
            setSaveStatus({ 
              status: 'success', 
              message: 'Record created with alternative format!' 
            });
            await fetchData();
          }
        } else {
          console.log('testing 🔍 DatabaseTest: Simple test record created successfully:', result);
          setSaveStatus({ status: 'success', message: 'Record created successfully!' });
          await fetchData();
        }
      } catch (saveError) {
        console.error('❌ DatabaseTest: Exception during save:', saveError);
        setSaveStatus({ 
          status: 'error', 
          message: `Save exception: ${saveError.message}. This might indicate a permission issue.` 
        });
      }
    } catch (err) {
      console.error('❌ DatabaseTest: Exception while preparing test record:', err);
      setSaveStatus({ status: 'error', message: `Exception: ${err.message}` });
    }
  };

  // Add dedicated permission test function
  const testWritePermissions = async () => {
    try {
      setSaveStatus({ status: 'saving', message: 'Testing database write permissions...' });
      
      // Create a special test object that triggers permission testing
      const permissionTest = {
        id: "permission-test-" + Date.now(),
        _testPermissions: true  // Special flag for API to test permissions
      };
      
      console.log('testing 🔍 DatabaseTest: Testing database write permissions');
      const result = await saveTimesheet(permissionTest);
      
      if (result.error) {
        console.error('❌ DatabaseTest: Permission test failed:', result.error);
        setSaveStatus({ 
          status: 'error', 
          message: `Permission test failed: ${result.error}` 
        });
      } else {
        console.log('testing 🔍 DatabaseTest: Permission test successful:', result);
        setSaveStatus({ 
          status: 'success', 
          message: 'Write permissions verified! The API can write to the database.' 
        });
      }
    } catch (err) {
      console.error('❌ DatabaseTest: Exception during permission test:', err);
      setSaveStatus({ 
        status: 'error', 
        message: `Permission test exception: ${err.message}` 
      });
    }
  };

  // Add API ping test
  const testApiConnection = async () => {
    try {
      setSaveStatus({ status: 'saving', message: 'Testing API connectivity...' });
      
      console.log('testing 🔍 DatabaseTest: Testing basic API connectivity');
      const result = await pingApi();
      
      if (result.error) {
        console.error('❌ DatabaseTest: API ping failed:', result.error);
        setSaveStatus({ 
          status: 'error', 
          message: `API ping failed: ${result.error}` 
        });
        setPingResult(null);
      } else {
        console.log('testing 🔍 DatabaseTest: API ping successful:', result);
        setSaveStatus({ 
          status: 'success', 
          message: 'API connectivity confirmed!' 
        });
        setPingResult(result);
      }
    } catch (err) {
      console.error('❌ DatabaseTest: Exception during API ping:', err);
      setSaveStatus({ 
        status: 'error', 
        message: `API ping exception: ${err.message}` 
      });
      setPingResult(null);
    }
  };

  // Debug modal component
  const DebugModal = () => {
    if (!showDebugModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Debug Information</h2>
            <button 
              onClick={() => setShowDebugModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-100 p-4 rounded">
              <h3 className="font-bold mb-2">Environment Information</h3>
              <ul className="space-y-1 text-sm">
                <li>Environment: {process.env.NODE_ENV || 'unknown'}</li>
                <li>API Called: {debugInfo.apiCalled ? '✅' : '❌'}</li>
                <li>Response Received: {debugInfo.responseReceived ? '✅' : '❌'}</li>
                <li>Timestamp: {debugInfo.timestamp}</li>
                <li>Data Type: {debugInfo.dataType}</li>
                <li>Data Length: {debugInfo.dataLength}</li>
              </ul>
            </div>
            
            {pingResult && (
              <div className="bg-gray-100 p-4 rounded">
                <h3 className="font-bold mb-2">API Ping Results</h3>
                <ul className="space-y-1 text-sm">
                  <li>Status: ✅ Connected</li>
                  <li>Timestamp: {pingResult.timestamp}</li>
                  <li>Function: {pingResult.functionName}</li>
                  <li>Environment: {pingResult.environment}</li>
                  <li className="font-bold mt-2">Environment Variables:</li>
                  {Object.entries(pingResult.envInfo || {}).map(([key, value]) => (
                    <li key={key} className="ml-2">
                      {key}: {value}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {saveStatus && (
              <div className={`bg-gray-100 p-4 rounded ${
                saveStatus.status === 'error' ? 'border-red-500' : 
                saveStatus.status === 'success' ? 'border-green-500' : ''
              }`}>
                <h3 className="font-bold mb-2">Save Operation Status</h3>
                <p className={
                  saveStatus.status === 'error' ? 'text-red-600' : 
                  saveStatus.status === 'success' ? 'text-green-600' : 
                  'text-blue-600'
                }>
                  {saveStatus.message}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Render save status - simplified for main UI
  const renderSaveStatus = () => {
    if (!saveStatus) return null;
    
    return (
      <div className="mt-4">
        <p className={
          saveStatus.status === 'error' ? 'text-red-600' : 
          saveStatus.status === 'success' ? 'text-green-600' : 
          'text-blue-600'
        }>
          {saveStatus.message}
        </p>
      </div>
    );
  };
  
  if (loading) {
    return <div className="p-4">Loading database information...</div>;
  }
  
  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }
  
  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Database Connection Test</h2>
        <button 
          onClick={() => setShowDebugModal(true)}
          className="bg-gray-200 hover:bg-gray-300 rounded-full p-2"
          title="View Debug Information"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {data && data.length > 0 ? (
        <div>
          <p className="mb-2">Found {data.length} record(s) in the database:</p>
          <ul className="space-y-2">
            {data.map(item => (
              <li key={item.id} className="p-2 bg-gray-100 rounded">
                <strong>{item.name}</strong> - ID: {item.id}
                {item.week && <span> (Week: {item.week})</span>}
                {item.projects && (
                  <div className="mt-1 text-sm">
                    <div>Projects:</div>
                    <ul className="ml-4 list-disc">
                      {item.projects.map((project, index) => (
                        <li key={index}>
                          {project.name}: {project.percentage}%
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div>
          <p>No data found in the database. Add some records to see them here.</p>
          
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={createTestRecord}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Create Test Record
              </button>
              
              <button 
                onClick={testWritePermissions}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Test Write Permissions
              </button>
              
              <button 
                onClick={testApiConnection}
                className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
              >
                Test API Connection
              </button>
            </div>
            
            {renderSaveStatus()}
          </div>
        </div>
      )}
      
      <DebugModal />
    </div>
  );
};

export default DatabaseTest; 