import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

const control = 'w-full rounded border bg-surface px-3 text-sm text-fg placeholder:text-muted/70 focus-visible:outline-primary disabled:bg-sunken disabled:text-muted';

type FieldProps = { label: string; error?: string; hint?: string };

export const Field = forwardRef<HTMLInputElement, FieldProps & React.InputHTMLAttributes<HTMLInputElement>>(
  ({ label, error, hint, className, id, ...rest }, ref) => {
    const fid = id ?? rest.name;
    return (
      <div className={className}>
        <label htmlFor={fid} className="mb-1.5 block text-sm font-medium">{label}</label>
        <input ref={ref} id={fid} aria-invalid={!!error} className={cn(control, 'h-10', error ? 'border-danger' : 'border-line')} {...rest} />
        {error ? <p role="alert" className="mt-1 text-xs text-danger">{error}</p> : hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      </div>
    );
  },
);
Field.displayName = 'Field';

export const SelectField = forwardRef<HTMLSelectElement, FieldProps & React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ label, error, hint, className, id, children, ...rest }, ref) => {
    const fid = id ?? rest.name;
    return (
      <div className={className}>
        <label htmlFor={fid} className="mb-1.5 block text-sm font-medium">{label}</label>
        <select ref={ref} id={fid} className={cn(control, 'h-10', error ? 'border-danger' : 'border-line')} {...rest}>{children}</select>
        {error ? <p role="alert" className="mt-1 text-xs text-danger">{error}</p> : hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      </div>
    );
  },
);
SelectField.displayName = 'SelectField';

export const TextareaField = forwardRef<HTMLTextAreaElement, FieldProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ label, error, hint, className, id, ...rest }, ref) => {
    const fid = id ?? rest.name;
    return (
      <div className={className}>
        <label htmlFor={fid} className="mb-1.5 block text-sm font-medium">{label}</label>
        <textarea ref={ref} id={fid} aria-invalid={!!error} className={cn(control, 'min-h-[90px] py-2', error ? 'border-danger' : 'border-line')} {...rest} />
        {error ? <p role="alert" className="mt-1 text-xs text-danger">{error}</p> : hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      </div>
    );
  },
);
TextareaField.displayName = 'TextareaField';
