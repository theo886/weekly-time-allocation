import React from 'react';

export const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className || ''}`}>
    {children}
  </div>
);

export const CardHeader = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b ${className || ''}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <h3 className={`text-xl font-bold ${className || ''}`}>
    {children}
  </h3>
);

export const CardContent = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`p-6 ${className || ''}`}>
    {children}
  </div>
);

export const CardFooter = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`p-4 border-t bg-slate-50 flex justify-center items-center h-20 ${className || ''}`}>
    {children}
  </div>
); 