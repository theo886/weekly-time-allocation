import React from 'react';

export const Select = ({ 
  children,
  value,
  onChange,
  className
}) => {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`w-full px-3 py-2 border rounded-md appearance-none ${className || ''}`}
    >
      {children}
    </select>
  );
};
