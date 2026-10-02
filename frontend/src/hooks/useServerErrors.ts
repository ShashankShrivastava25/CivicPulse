import { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from '@/lib/api';

/** Maps backend field errors onto the form; returns the message to show at the top. */
export function applyServerError<T extends FieldValues>(e: unknown, setError: UseFormSetError<T>) {
  if (e instanceof ApiError) {
    Object.entries(e.fieldErrors ?? {}).forEach(([k, m]) => setError(k as Path<T>, { message: m?.[0] }));
    return e.message;
  }
  return 'Something went wrong. Please try again';
}
