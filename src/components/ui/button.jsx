import React from 'react';

export function Button({
  children,
  className,
  variant = 'default',
  size = 'default',
  onClick,
  disabled,
  type = 'button',
  ...props
}) {
  const baseStyles = 'font-medium rounded-md inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none';
  
  const variantStyles = {
    default: 'bg-indigo-600 text-white hover:bg-indigo-700',
    destructive: 'bg-red-500 text-white hover:bg-red-600',
    outline: 'border border-input bg-background hover:bg-slate-100 hover:text-slate-900',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
    ghost: 'hover:bg-slate-100 hover:text-slate-900',
    link: 'text-indigo-600 hover:underline underline-offset-4'
  };
  
  const sizeStyles = {
    default: 'h-9 px-3 py-2 text-sm',
    sm: 'h-8 px-2 py-1 text-xs',
    lg: 'h-10 px-4 py-2 text-base',
    icon: 'h-9 w-9 p-1'
  };
  
  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
} 