import React from 'react';
import { useCurrentUser, getUserInfo } from '../auth/AuthProvider';

const DebugInfo = () => {
  // Get current user info
  const currentUser = useCurrentUser();
  const userInfo = getUserInfo(currentUser);
  
  // Only show in development 
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '10px', 
      right: '10px', 
      backgroundColor: 'rgba(0,0,0,0.7)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px',
      maxWidth: '300px',
      zIndex: 9999,
      fontSize: '12px'
    }}>
      <h4 style={{ margin: '0 0 5px 0' }}>Debug Info</h4>
      {userInfo ? (
        <div>
          <p style={{ margin: '2px 0' }}><strong>User ID:</strong> {userInfo.userId}</p>
          <p style={{ margin: '2px 0' }}><strong>Name:</strong> {userInfo.name}</p>
          <p style={{ margin: '2px 0' }}><strong>Email:</strong> {userInfo.email}</p>
        </div>
      ) : (
        <p style={{ margin: '2px 0' }}>Not logged in</p>
      )}
    </div>
  );
};

export default DebugInfo; 