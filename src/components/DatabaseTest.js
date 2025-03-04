import React, { useState, useEffect } from 'react';
import { getTimesheets, saveTimesheet, pingApi } from '../services/cosmosService';

const DatabaseTest = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [debugInfo, setDebugInfo] = useState({
    apiCalled: false,
    responseReceived: false,
    timestamp: null,
    isDevelopment: process.env.NODE_ENV === 'development'
  });
  const [pingResult, setPingResult] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setDebugInfo(prev => ({ ...prev, apiCalled: true, timestamp: new Date().toISOString() }));
      
      console.log('🔍 DatabaseTest: Calling getTimesheets()...');
      const result = await getTimesheets();
      
      console.log('🔍 DatabaseTest: Received result:', result);
      setDebugInfo(prev => ({ ...prev, responseReceived: true }));
      
      if (result.error) {
        console.error('❌ DatabaseTest: Error in result:', result.error);
        setError(result.error);
      } else {
        console.log(`🔍 DatabaseTest: Setting data, ${Array.isArray(result) ? result.length : 0} items`);
        setData(result);
      }
    } catch (err) {
      console.error('❌ DatabaseTest: Exception caught:', err);
      setError('An error occurred while fetching data: ' + err.message);
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
      
      console.log('🔍 DatabaseTest: Creating simplified test record:', simpleTestTimesheet);
      
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
          
          console.log('🔍 DatabaseTest: Trying alternative format with explicit partition key:', alternativeTimesheet);
          const altResult = await saveTimesheet(alternativeTimesheet);
          
          if (altResult.error) {
            console.error('❌ DatabaseTest: Error saving alternative record:', altResult.error);
            setSaveStatus({ 
              status: 'error', 
              message: `All attempts failed. Last error: ${altResult.error}` 
            });
          } else {
            console.log('🔍 DatabaseTest: Alternative format succeeded:', altResult);
            setSaveStatus({ 
              status: 'success', 
              message: 'Record created with alternative format!' 
            });
            await fetchData();
          }
        } else {
          console.log('🔍 DatabaseTest: Simple test record created successfully:', result);
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
      
      console.log('🔍 DatabaseTest: Testing database write permissions');
      const result = await saveTimesheet(permissionTest);
      
      if (result.error) {
        console.error('❌ DatabaseTest: Permission test failed:', result.error);
        setSaveStatus({ 
          status: 'error', 
          message: `Permission test failed: ${result.error}` 
        });
      } else {
        console.log('🔍 DatabaseTest: Permission test successful:', result);
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
      
      console.log('🔍 DatabaseTest: Testing basic API connectivity');
      const result = await pingApi();
      
      if (result.error) {
        console.error('❌ DatabaseTest: API ping failed:', result.error);
        setSaveStatus({ 
          status: 'error', 
          message: `API ping failed: ${result.error}` 
        });
        setPingResult(null);
      } else {
        console.log('🔍 DatabaseTest: API ping successful:', result);
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

  const renderDebugInfo = () => (
    <div className="mt-4 p-4 bg-gray-100 rounded text-xs font-mono">
      <h3 className="font-bold mb-2">Debug Information:</h3>
      <ul className="space-y-1">
        <li>Environment: {debugInfo.isDevelopment ? 'Development' : 'Production'}</li>
        <li>API Called: {debugInfo.apiCalled ? '✅' : '❌'}</li>
        <li>Response Received: {debugInfo.responseReceived ? '✅' : '❌'}</li>
        <li>Timestamp: {debugInfo.timestamp}</li>
        <li>Data Type: {data ? (Array.isArray(data) ? 'Array' : typeof data) : 'null'}</li>
        <li>Data Length: {Array.isArray(data) ? data.length : 'N/A'}</li>
      </ul>
    </div>
  );

  // Render a message if data save was attempted
  const renderSaveStatus = () => {
    if (!saveStatus) return null;
    
    const statusStyles = {
      saving: "bg-blue-100 border-blue-400 text-blue-700",
      success: "bg-green-100 border-green-400 text-green-700",
      error: "bg-red-100 border-red-400 text-red-700"
    };
    
    return (
      <div className={`mt-4 px-4 py-3 rounded border ${statusStyles[saveStatus.status]}`}>
        <p>{saveStatus.message}</p>
      </div>
    );
  };

  // Render ping results if available
  const renderPingResult = () => {
    if (!pingResult) return null;
    
    return (
      <div className="mt-4 p-4 bg-gray-100 rounded text-xs font-mono">
        <h3 className="font-bold mb-2">API Ping Results:</h3>
        <ul className="space-y-1">
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
    );
  };

  if (loading) {
    return (
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-bold mb-2">Database Connection Test</h2>
        <p>Loading data...</p>
        {renderDebugInfo()}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-bold mb-2">Database Connection Test</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p><strong>Error:</strong> {error}</p>
          <p className="mt-2">Please check your database configuration.</p>
        </div>
        {renderDebugInfo()}
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl font-bold mb-2">Database Connection Test</h2>
      
      {data && data.length > 0 ? (
        <div>
          <p className="mb-2">Successfully connected to database! Found {data.length} records.</p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr>
                  <th className="border p-2">ID</th>
                  <th className="border p-2">Name</th>
                  <th className="border p-2">Number Value</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id}>
                    <td className="border p-2">{item.id}</td>
                    <td className="border p-2">{item.name || 'N/A'}</td>
                    <td className="border p-2">{item.numberValue || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            {renderPingResult()}
          </div>
        </div>
      )}
      
      {renderDebugInfo()}
    </div>
  );
};

export default DatabaseTest; 