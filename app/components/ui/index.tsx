/**
 * Core UI primitives used throughout MistakeBook
 */
'use client';

import { forwardRef } from 'react';
import { cn } from '@/utils/helpers';

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const variantClass = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      ghost: 'btn-ghost',
      outline: 'btn-outline',
      danger: 'btn-danger',
    }[variant];

    const sizeClass = {
      sm: 'text-xs px-3 py-1.5 rounded-lg',
      md: '',
      lg: 'text-base px-6 py-3',
      icon: 'w-9 h-9 p-0',
    }[size];

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(variantClass, sizeClass, loading && 'opacity-70 cursor-wait', className)}
        {...props}
      >
        {loading && (
          <svg
            className="w-4 h-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'input-base',
              leftIcon && 'pl-10',
              error && 'border-destructive focus-visible:ring-destructive/30',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn('input-base appearance-none cursor-pointer', className)}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

// ─── Badge ────────────────────────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  variant?: 'default' | 'outline';
  className?: string;
}

export function Badge({ children, color, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'badge',
        variant === 'outline' ? 'border border-current bg-transparent' : '',
        className
      )}
      style={color ? { backgroundColor: `${color}22`, color } : undefined}
    >
      {children}
    </span>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn('card', onClick && 'cursor-pointer', className)}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gradient-to-r from-muted via-muted/40 to-muted rounded-lg',
        className
      )}
      style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s linear infinite' }}
    />
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
}

export function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer group">
      <div>
        {label && <p className="text-sm font-medium text-foreground">{label}</p>}
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0',
          checked ? 'bg-primary' : 'bg-muted'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </div>
    </label>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-border', className)} />;
}

// ─── Empty state ──────────────────────────────────────────────────────────────
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="font-display text-xl text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}
