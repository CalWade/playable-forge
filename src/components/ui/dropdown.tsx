'use client';

import { ReactNode, useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

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
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
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
            'absolute z-50 mt-1 min-w-[160px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg',
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
        'flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50',
        className
      )}
    >
      {children}
    </button>
  );
}

interface SelectDropdownProps {
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function SelectDropdown({ value, options, onChange, className, placeholder }: SelectDropdownProps) {
  const selected = options.find((o) => o.value === value);

  return (
    <Dropdown
      trigger={
        <div
          className={cn(
            'flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm hover:bg-gray-50',
            className
          )}
        >
          <span className={selected ? 'text-gray-700' : 'text-gray-400'}>
            {selected?.label || placeholder || '选择...'}
          </span>
          <ChevronDown size={14} className="text-gray-400" />
        </div>
      }
    >
      {options.map((option) => (
        <DropdownItem key={option.value} onClick={() => onChange(option.value)}>
          {option.label}
        </DropdownItem>
      ))}
    </Dropdown>
  );
}
