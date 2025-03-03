import React from 'react';

interface AlertProps {
  children: React.ReactNode;
  className?: string;
}

export const Alert = ({ children, className }: AlertProps) => (
  <div className={`p-3 rounded-md ${className || ''}`}>
    {children}
  </div>
);

export const AlertDescription = ({ children }: { children: React.ReactNode }) => (
  <div className="ml-2 text-sm">{children}</div>
); 