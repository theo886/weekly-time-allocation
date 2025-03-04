import React, { useState, useEffect } from 'react';
import { getTimesheets } from '../services/cosmosService';

const DatabaseTest = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({
    apiCalled: false,
    responseReceived: false,
    timestamp: null,
    isDevelopment: process.env.NODE_ENV === 'development'
  });

  useEffect(() => {
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

    fetchData();
  }, []);

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
        <p>No data found in the database. Add some records to see them here.</p>
      )}
      
      {renderDebugInfo()}
    </div>
  );
};

export default DatabaseTest; 