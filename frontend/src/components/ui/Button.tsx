import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

const variants = {
  primary: 'border border-fg bg-primary-soft text-fg hover:bg-[rgb(230_196_250)] dark:border-transparent dark:bg-primary dark:text-primary-fg dark:hover:bg-primary dark:hover:opacity-90',
  secondary: 'border border-fg bg-transparent text-fg hover:bg-sunken dark:border-line dark:bg-surface',
  ghost: 'text-fg hover:bg-sunken',
  danger: 'bg-danger text-white hover:opacity-90',
};
const sizes = { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4 text-sm', lg: 'h-12 px-6 text-base' };

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants; size?: keyof typeof sizes; loading?: boolean; href?: string;
};

export function Button({ variant = 'primary', size = 'md', loading, href, className, children, disabled, ...rest }: Props) {
  const cls = cn('inline-flex items-center justify-center gap-2 rounded font-medium transition disabled:cursor-not-allowed disabled:opacity-50', variants[variant], sizes[size], className);
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}{children}
    </button>
  );
}