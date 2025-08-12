import React from 'react';
import Header from './Header';
import { SideMenu, LoadingSpinner } from '../ui';

/**
 * 🏠 Layout Component
 * 앱의 전체 레이아웃을 관리하는 컴포넌트
 */
const Layout = ({ 
  children,
  // Header props
  onMenuToggle,
  viewMode,
  onViewModeChange,
  // Sidebar props
  isMenuOpen,
  onMenuClose,
  userLocation,
  onLocationRefresh,
  selectedUrgency,
  onUrgencyChange,
  searchFilters,
  onFiltersChange,
  toilets,
  onSearch,
  // Loading
  loading,
  loadingMessage
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Global Loading Overlay */}
      {loading && (
        <LoadingSpinner 
          message={loadingMessage || "처리 중..."} 
        />
      )}

      {/* Header */}
      <Header
        onMenuToggle={onMenuToggle}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Side Menu */}
      <SideMenu 
        isOpen={isMenuOpen} 
        onClose={onMenuClose}
        userLocation={userLocation}
        onLocationRefresh={onLocationRefresh}
        selectedUrgency={selectedUrgency}
        onUrgencyChange={onUrgencyChange}
        searchFilters={searchFilters}
        onFiltersChange={onFiltersChange}
        toilets={toilets}
        onSearch={onSearch}
      />
    </div>
  );
};

export default React.memo(Layout);