import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

const VARIANTS = {
  primary: 'bg-brand text-white hover:bg-brand-600',
  secondary: 'bg-white/10 text-white hover:bg-white/20 backdrop-blur',
  outline: 'border border-white/20 text-white hover:bg-white/10',
  ghost: 'text-zinc-300 hover:bg-white/10 hover:text-white',
  danger: 'bg-red-600/90 text-white hover:bg-red-600',
};

const SIZES = {
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
  icon: 'h-10 w-10 rounded-xl',
};

const base =
  'inline-flex items-center justify-center font-medium transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

function classes({ variant = 'primary', size = 'md', className = '' }) {
  return `${base} ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
}

const Button = forwardRef(function Button(
  { as, to, variant, size, className, loading, children, disabled, type = 'button', ...rest },
  ref,
) {
  const props = {
    ref,
    className: classes({ variant, size, className }),
    'aria-busy': loading || undefined,
    disabled: disabled || loading,
    ...rest,
  };
  if (as === 'a') return <a {...props}>{children}</a>;
  if (to) return <Link to={to} {...props}>{children}</Link>;
  return (
    <button type={type} {...props}>
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
      )}
      {children}
    </button>
  );
});

export default Button;
