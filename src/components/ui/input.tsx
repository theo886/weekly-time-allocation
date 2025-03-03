import React from 'react';

interface InputProps {
  type?: string;
  min?: string;
  max?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export const Input = ({ 
  type = 'text', 
  min, 
  max, 
  placeholder, 
  value, 
  onChange, 
  className 
}: InputProps) => (
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