/**
 * Reusable Card Component
 * Flexible card layout with header, body, and footer support
 */
import React from 'react';

const Card = ({ 
  children,
  header,
  footer,
  className = '',
  shadow = 'sm',
  padding = 'md',
  clickable = false,
  onClick,
  ...props 
}) => {
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  const baseClasses = `
    bg-white rounded-xl border border-gray-200
    ${shadowClasses[shadow]}
    ${clickable ? 'cursor-pointer hover:shadow-md transition-shadow duration-200' : ''}
    ${className}
  `.trim();

  const cardProps = {
    className: baseClasses,
    ...props
  };

  if (clickable && onClick) {
    cardProps.onClick = onClick;
    cardProps.role = 'button';
    cardProps.tabIndex = 0;
    cardProps.onKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick(e);
      }
    };
  }

  return (
    <div {...cardProps}>
      {header && (
        <div className={`border-b border-gray-200 ${paddingClasses[padding]} pb-4`}>
          {header}
        </div>
      )}
      
      <div className={paddingClasses[padding]}>
        {children}
      </div>
      
      {footer && (
        <div className={`border-t border-gray-200 ${paddingClasses[padding]} pt-4`}>
          {footer}
        </div>
      )}
    </div>
  );
};

// Sub-components for more structured usage
Card.Header = ({ children, className = '', ...props }) => (
  <div className={`font-semibold text-gray-900 ${className}`} {...props}>
    {children}
  </div>
);

Card.Title = ({ children, className = '', ...props }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`} {...props}>
    {children}
  </h3>
);

Card.Body = ({ children, className = '', ...props }) => (
  <div className={`text-gray-600 ${className}`} {...props}>
    {children}
  </div>
);

Card.Footer = ({ children, className = '', ...props }) => (
  <div className={`text-sm text-gray-500 ${className}`} {...props}>
    {children}
  </div>
);

export default Card;