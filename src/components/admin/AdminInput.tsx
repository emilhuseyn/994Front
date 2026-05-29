import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';

interface FieldShellProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

function FieldShell({ label, hint, error, required, className, children }: FieldShellProps) {
  return (
    <label className={`block ${className ?? ''}`}>
      {label && (
        <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-neutral-600">
          {label}
          {required && <span className="ml-0.5 text-red-600">*</span>}
        </span>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-[11px] text-neutral-500">{hint}</p>}
      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
    </label>
  );
}

const INPUT_CLASS =
  'block w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-black focus:ring-1 focus:ring-black disabled:bg-neutral-50 disabled:text-neutral-500';

interface AdminInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function AdminInput({
  label,
  hint,
  error,
  required,
  className,
  ...rest
}: AdminInputProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={className}>
      <input
        {...rest}
        required={required}
        className={`${INPUT_CLASS} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
      />
    </FieldShell>
  );
}

interface AdminTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function AdminTextarea({
  label,
  hint,
  error,
  required,
  className,
  rows = 4,
  ...rest
}: AdminTextareaProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={className}>
      <textarea
        {...rest}
        rows={rows}
        required={required}
        className={`${INPUT_CLASS} resize-y ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
      />
    </FieldShell>
  );
}

interface AdminSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  options?: { value: string | number; label: string }[];
}

export function AdminSelect({
  label,
  hint,
  error,
  required,
  className,
  options,
  placeholder,
  children,
  ...rest
}: AdminSelectProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={className}>
      <select
        {...rest}
        required={required}
        className={`${INPUT_CLASS} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
    </FieldShell>
  );
}

interface AdminCheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export function AdminCheckbox({ label, hint, className, ...rest }: AdminCheckboxProps) {
  return (
    <label className={`flex items-start gap-2 ${className ?? ''}`}>
      <input
        type="checkbox"
        {...rest}
        className="mt-0.5 h-4 w-4 cursor-pointer accent-black"
      />
      <span className="text-sm">
        {label}
        {hint && <span className="block text-[11px] text-neutral-500">{hint}</span>}
      </span>
    </label>
  );
}
