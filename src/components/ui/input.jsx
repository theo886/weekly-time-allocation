import React from 'react';

export const Input = ({ 
  type = 'text', 
  min, 
  max, 
  placeholder, 
  value, 
  onChange, 
  className 
}) => (
  <input
    type={type}
    min={min}
    max={max}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`w-full px-3 py-2 border rounded-md ${className || ''}`}
  />
); 