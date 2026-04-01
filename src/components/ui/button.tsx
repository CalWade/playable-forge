import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-bold clay-transition focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
          {
            'clay-gradient-primary text-white clay-shadow hover:clay-shadow-hover hover:-translate-y-0.5 active:translate-y-0 active:clay-shadow-active': variant === 'default',
            'clay-gradient-blue text-clay-blue-400 clay-shadow-sm hover:clay-shadow hover:-translate-y-0.5 active:translate-y-0': variant === 'outline',
            'text-clay-text hover:bg-clay-blue-50/50': variant === 'ghost',
            'bg-gradient-to-br from-red-300 to-red-400 text-white clay-shadow hover:clay-shadow-hover': variant === 'destructive',
          },
          {
            'h-8 px-4 text-sm rounded-clay-sm': size === 'sm',
            'h-10 px-6 text-sm rounded-clay': size === 'md',
            'h-12 px-8 text-base rounded-clay-lg': size === 'lg',
            'h-10 w-10 rounded-full': size === 'icon',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
export { Button, type ButtonProps };
