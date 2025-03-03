import React from 'react';

export function Input({
  className,
  type = 'text',
  ...props
}) {
  return (
    <input
      type={type}
      className={`
        flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2
        text-sm shadow-sm transition-colors file:border-0 file:bg-transparent
        file:text-sm file:font-medium placeholder:text-slate-400
        focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400
        disabled:cursor-not-allowed disabled:opacity-50 
        ${className}
      `}
      {...props}
    />
  );
} 