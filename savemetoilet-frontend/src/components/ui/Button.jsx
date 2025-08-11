/**
 * Reusable Button Component
 * Supports multiple variants, sizes, and states
 */
import React from 'react';

const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  icon,
  children,
  className = '',
  fullWidth = false,
  ...props 
}) => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm border border-blue-600',
    secondary: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent',
    ghost: 'text-gray-600 hover:bg-gray-100 bg-transparent border border-transparent',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm border border-red-600',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-sm border border-green-600',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm border border-yellow-500'
  };

  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
    xl: 'px-8 py-5 text-xl'
  };

  const baseClasses = `
    relative inline-flex items-center justify-center font-medium rounded-xl
    transition-all duration-200 transform
    hover:scale-105 active:scale-95
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    ${variants[variant]}
    ${sizes[size]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim();

  return (
    <button
      className={baseClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin opacity-80" />
        </div>
      )}
      
      <span className={`flex items-center space-x-2 ${loading ? 'opacity-0' : ''}`}>
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children && <span>{children}</span>}
      </span>
    </button>
  );
};

export default Button;