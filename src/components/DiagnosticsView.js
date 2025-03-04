import React, { useState, useEffect } from 'react';

const DiagnosticsView = () => {
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDiagnostics = async () => {
      try {
        setLoading(true);
        console.log('🔍 DiagnosticsView: Fetching diagnostics...');
        
        const response = await fetch('/api/diagnostics');
        console.log(`🔍 DiagnosticsView: Response status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('🔍 DiagnosticsView: Received diagnostics data:', data);
        setDiagnostics(data);
      } catch (err) {
        console.error('❌ DiagnosticsView: Error fetching diagnostics:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDiagnostics();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-4 rounded shadow mt-8">
        <h2 className="text-xl font-bold mb-2">API Diagnostics</h2>
        <p>Loading diagnostics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-4 rounded shadow mt-8">
        <h2 className="text-xl font-bold mb-2">API Diagnostics</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p><strong>Error:</strong> {error}</p>
          <p className="mt-2">Failed to fetch diagnostics information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded shadow mt-8">
      <h2 className="text-xl font-bold mb-4">API Diagnostics</h2>
      
      {diagnostics ? (
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded">
            <h3 className="font-bold mb-2">Environment Information</h3>
            <ul className="space-y-1 text-sm">
              <li><strong>Timestamp:</strong> {diagnostics.timestamp}</li>
              <li><strong>Environment:</strong> {diagnostics.environment}</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-3 rounded">
            <h3 className="font-bold mb-2">Cosmos DB Configuration</h3>
            <ul className="space-y-1 text-sm">
              <li><strong>Endpoint Configured:</strong> {diagnostics.cosmos.endpointConfigured ? '✅' : '❌'}</li>
              <li><strong>Key Configured:</strong> {diagnostics.cosmos.keyConfigured ? '✅' : '❌'}</li>
              <li><strong>Database ID:</strong> {diagnostics.cosmos.databaseId}</li>
              <li><strong>Container ID:</strong> {diagnostics.cosmos.containerId}</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-3 rounded">
            <h3 className="font-bold mb-2">Connection Status</h3>
            <ul className="space-y-1 text-sm">
              <li><strong>Connection Attempted:</strong> {diagnostics.connection.attempted ? '✅' : '❌'}</li>
              <li><strong>Connection Successful:</strong> {diagnostics.connection.successful ? '✅' : '❌'}</li>
              {diagnostics.connection.error && (
                <li className="text-red-600">
                  <strong>Error:</strong> {diagnostics.connection.error}
                </li>
              )}
            </ul>
          </div>
          
          <div className="bg-blue-50 p-3 rounded">
            <h3 className="font-bold mb-2">Database & Container Status</h3>
            <ul className="space-y-1 text-sm">
              <li><strong>Database Exists:</strong> {diagnostics.database.exists ? '✅' : '❌'}</li>
              <li><strong>Container Exists:</strong> {diagnostics.container.exists ? '✅' : '❌'}</li>
              {diagnostics.database.error && (
                <li className="text-red-600">
                  <strong>Database Error:</strong> {diagnostics.database.error}
                </li>
              )}
              {diagnostics.container.error && (
                <li className="text-red-600">
                  <strong>Container Error:</strong> {diagnostics.container.error}
                </li>
              )}
            </ul>
          </div>
          
          <div className="bg-blue-50 p-3 rounded">
            <h3 className="font-bold mb-2">Query Results</h3>
            <ul className="space-y-1 text-sm">
              <li><strong>Query Attempted:</strong> {diagnostics.query.attempted ? '✅' : '❌'}</li>
              <li><strong>Query Successful:</strong> {diagnostics.query.successful ? '✅' : '❌'}</li>
              <li><strong>Item Count:</strong> {diagnostics.query.itemCount}</li>
              {diagnostics.query.error && (
                <li className="text-red-600">
                  <strong>Query Error:</strong> {diagnostics.query.error}
                </li>
              )}
              {diagnostics.query.sampleIds && diagnostics.query.sampleIds.length > 0 && (
                <li>
                  <strong>Sample IDs:</strong> {diagnostics.query.sampleIds.join(', ')}
                </li>
              )}
            </ul>
          </div>
        </div>
      ) : (
        <p>No diagnostics information available.</p>
      )}
    </div>
  );
};

export default DiagnosticsView; 