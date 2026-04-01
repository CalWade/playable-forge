'use client';

import { ReactNode, useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Generic Dropdown                                                     */
/* ------------------------------------------------------------------ */

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, children, align = 'left', className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className={cn('relative inline-block', className)}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-2 min-w-[160px]',
            'rounded-clay-xl bg-clay-surface',
            'border-2 border-clay-border',
            'shadow-clay-effect-md',
            'py-1.5',
            'animate-clay-bounce-in',
            align === 'right' ? 'right-0' : 'left-0'
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dropdown Item                                                        */
/* ------------------------------------------------------------------ */

interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function DropdownItem({ children, onClick, className }: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center px-3.5 py-2',
        'text-sm font-medium text-clay-text',
        'hover:bg-clay-neutral-100 hover:text-clay-primary',
        'transition-colors duration-100',
        className
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Select Dropdown                                                      */
/* ------------------------------------------------------------------ */

interface SelectDropdownProps {
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function SelectDropdown({
  value,
  options,
  onChange,
  className,
  placeholder,
}: SelectDropdownProps) {
  const selected = options.find((o) => o.value === value);

  return (
    <Dropdown
      trigger={
        <div
          className={cn(
            'flex items-center justify-between gap-1.5',
            'rounded-clay-md border-2 border-clay-border',
            'bg-clay-neutral-50',
            'px-3 py-1.5',
            'text-sm text-clay-text',
            'shadow-clay-input',
            'hover:border-clay-primary/40 transition-colors duration-150',
            className
          )}
        >
          <span className={selected ? 'text-clay-text' : 'text-clay-text-faint'}>
            {selected?.label || placeholder || '选择...'}
          </span>
          <ChevronDown size={13} className="text-clay-text-muted shrink-0" />
        </div>
      }
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'flex w-full items-center justify-between gap-2 px-3.5 py-2',
            'text-sm font-medium transition-colors duration-100',
            option.value === value
              ? 'text-clay-primary bg-clay-primary-lt/60'
              : 'text-clay-text hover:bg-clay-neutral-100 hover:text-clay-primary'
          )}
        >
          {option.label}
          {option.value === value && <Check size={13} className="text-clay-primary" />}
        </button>
      ))}
    </Dropdown>
  );
}
