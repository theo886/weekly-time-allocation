import React from 'react';

export const Button = ({ 
  children, 
  onClick, 
  disabled, 
  className, 
  variant = 'default',
  title,
  size
}) => {
  const baseClass = 'rounded-md font-medium';
  
  const variantClasses = {
    default: 'bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2',
    ghost: 'hover:bg-slate-100 text-slate-700 px-3 py-2',
    outline: 'border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2',
  };
  
  const sizeClasses = {
    icon: 'p-2'
  };
  
  const sizeClass = size && sizeClasses[size] ? sizeClasses[size] : '';
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      title={title}
      className={`${baseClass} ${variantClasses[variant]} ${sizeClass} ${className || ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}; 