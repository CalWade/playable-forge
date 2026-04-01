import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-clay border-none bg-gradient-to-br from-[#f0e5f5] to-[#e8d8f0] px-4 py-2 text-sm font-medium text-clay-text clay-inset placeholder:text-clay-muted focus:outline-none focus:clay-inset-focus disabled:cursor-not-allowed disabled:opacity-50 clay-transition',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
export { Input };
