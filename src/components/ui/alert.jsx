import React from 'react';

export function Alert({
  className,
  children,
  ...props
}) {
  return (
    <div
      className={`relative w-full rounded-lg border p-3 sm:p-4 flex gap-2 items-start text-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertDescription({
  className,
  ...props
}) {
  return (
    <div
      className={`text-sm font-normal [&_p]:leading-relaxed ${className}`}
      {...props}
    />
  );
} 