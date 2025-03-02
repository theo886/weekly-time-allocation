import React from 'react';

export const Alert = ({ children, className }) => (
  <div className={`p-3 rounded-md ${className || ''}`}>
    {children}
  </div>
);

export const AlertDescription = ({ children }) => (
  <div className="ml-2 text-sm">{children}</div>
); 