import React from 'react';
import { IconHamburger } from '../icons';
import { ViewToggle } from '../ui';

/**
 * 🎯 Header Component
 * 앱의 상단 헤더를 담당하는 컴포넌트
 */
const Header = ({ 
  onMenuToggle, 
  viewMode, 
  onViewModeChange,
  className = '' 
}) => {
  return (
    <header className={`
      bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-20
      ${className}
    `}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Menu Button */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuToggle}
              className="
                p-2 text-gray-600 hover:text-gray-900 
                hover:bg-gray-100 rounded-lg transition-colors
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              "
              aria-label="메뉴 열기"
            >
              <IconHamburger className="h-6 w-6" />
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="text-2xl">🚽</div>
              <h1 className="text-xl font-bold text-gray-900 hidden sm:block">
                SaveMeToilet
              </h1>
            </div>
          </div>

          {/* View Toggle */}
          <ViewToggle 
            viewMode={viewMode} 
            onViewChange={onViewModeChange} 
          />
        </div>
      </div>
    </header>
  );
};

export default React.memo(Header);