import React from 'react';

export function Select({
  className,
  ...props
}) {
  return (
    <select
      className={`
        flex h-9 w-full rounded-md border border-input bg-background px-3 py-2
        text-sm shadow-sm ring-offset-background file:border-0 file:bg-transparent
        file:text-sm file:font-medium placeholder:text-slate-400
        focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400
        disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-select-arrow bg-no-repeat
        bg-[length:16px_16px] bg-[right_8px_center] pr-8
        ${className}
      `}
      {...props}
    />
  );
}
