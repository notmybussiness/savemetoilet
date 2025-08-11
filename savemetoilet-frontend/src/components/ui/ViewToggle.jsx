/**
 * Reusable ViewToggle Component
 * Toggle between different view modes (map, list, etc.)
 */
import React from 'react';
import { IconMap, IconList } from '../icons';

const ViewToggle = ({ 
  viewMode, 
  onViewChange, 
  options,
  className = '',
  size = 'md',
  ...props 
}) => {
  // Default options if none provided
  const defaultOptions = [
    { key: 'map', icon: <IconMap className="h-5 w-5" />, label: '지도' },
    { key: 'list', icon: <IconList className="h-5 w-5" />, label: '목록' }
  ];

  const viewOptions = options || defaultOptions;

  const sizeClasses = {
    sm: 'p-0.5 text-xs',
    md: 'p-1 text-sm',
    lg: 'p-1.5 text-base'
  };

  const buttonSizeClasses = {
    sm: 'px-2 py-1',
    md: 'px-4 py-2', 
    lg: 'px-6 py-3'
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const baseClasses = `
    flex bg-gray-100 rounded-xl
    ${sizeClasses[size]}
    ${className}
  `.trim();

  const handleViewChange = (key) => {
    if (onViewChange && key !== viewMode) {
      onViewChange(key);
    }
  };

  const handleKeyDown = (e, key) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleViewChange(key);
    }
  };

  return (
    <div className={baseClasses} role="tablist" {...props}>
      {viewOptions.map(({ key, icon, label }) => {
        const isActive = viewMode === key;
        
        const buttonClasses = `
          flex items-center space-x-2 rounded-lg font-medium
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${buttonSizeClasses[size]}
          ${isActive 
            ? 'bg-white text-blue-600 shadow-sm' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
          }
        `.trim();

        // Clone icon with appropriate size
        const sizedIcon = icon ? React.cloneElement(icon, {
          className: iconSizeClasses[size]
        }) : null;

        return (
          <button
            key={key}
            onClick={() => handleViewChange(key)}
            onKeyDown={(e) => handleKeyDown(e, key)}
            className={buttonClasses}
            role="tab"
            aria-selected={isActive}
            aria-controls={`${key}-panel`}
            tabIndex={isActive ? 0 : -1}
          >
            {sizedIcon}
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ViewToggle;