import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  title?: string;
}

export const Button = ({ 
  children, 
  onClick, 
  disabled, 
  className, 
  variant = 'default',
  title
}: ButtonProps) => {
  const baseClass = 'rounded-md font-medium';
  
  const variantClasses = {
    default: 'bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2',
    ghost: 'hover:bg-slate-100 text-slate-700 px-3 py-2',
    outline: 'border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2',
  };
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      title={title}
      className={`${baseClass} ${variantClasses[variant]} ${className || ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}; 