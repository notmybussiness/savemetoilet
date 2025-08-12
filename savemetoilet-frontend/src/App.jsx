import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/layout/Layout';
import MapContainer from './components/map/MapContainer';
import ToiletList from './components/toilet/ToiletList';
import UrgencySelector from './components/UrgencySelector';
import { Alert, Button } from './components/ui';
import { IconRefresh } from './components/icons';
import { useGeolocation } from './hooks/useGeolocation';
import { useToiletSearch } from './hooks/useToiletSearch';
import { DEFAULT_SEARCH_FILTERS } from './utils/constants';

/**
 * 🚀 SaveMeToilet App - 완전 재구축 버전
 * 최신 Google Maps API와 모듈화된 아키텍처 적용
 */
function App() {
  // UI State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState('map');
  const [selectedUrgency, setSelectedUrgency] = useState('moderate');
  const [searchFilters, setSearchFilters] = useState(DEFAULT_SEARCH_FILTERS);

  // Custom Hooks
  const {
    location: userLocation,
    loading: locationLoading,
    error: locationError,
    getCurrentPosition,
    refreshLocation
  } = useGeolocation();

  const {
    toilets,
    loading: searchLoading,
    error: searchError,
    searchToilets,
    setMockData,
    retrySearch,
    stats
  } = useToiletSearch();

  // Combined loading state
  const isLoading = locationLoading || searchLoading;
  const loadingMessage = locationLoading 
    ? "현재 위치를\n찾는 중..." 
    : searchLoading 
    ? "화장실을\n검색하는 중..." 
    : "";

  // Event handlers
  const handleMenuToggle = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const handleMenuClose = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
  }, []);

  const handleUrgencyChange = useCallback((urgency) => {
    setSelectedUrgency(urgency);
  }, []);

  const handleFiltersChange = useCallback((newFilters) => {
    setSearchFilters(newFilters);
  }, []);

  const handleToiletSelect = useCallback((toilet) => {
    console.log('🚽 화장실 선택:', toilet);
    // TODO: 모달이나 상세 정보 표시
  }, []);

  const handleLocationRefresh = useCallback(() => {
    refreshLocation();
  }, [refreshLocation]);

  const handleSearchRefresh = useCallback(() => {
    if (userLocation) {
      searchToilets(userLocation, selectedUrgency, searchFilters);
    }
  }, [userLocation, selectedUrgency, searchFilters, searchToilets]);

  // Initialize location on mount
  useEffect(() => {
    getCurrentPosition();
  }, [getCurrentPosition]);

  // Search when location or filters change
  useEffect(() => {
    if (userLocation) {
      searchToilets(userLocation, selectedUrgency, searchFilters);
    }
  }, [userLocation, selectedUrgency, searchToilets]);

  // Debounced search when filters change
  useEffect(() => {
    if (userLocation) {
      const timeoutId = setTimeout(() => {
        searchToilets(userLocation, selectedUrgency, searchFilters);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [searchFilters, userLocation, selectedUrgency, searchToilets]);

  return (
    <Layout
      // Header props
      onMenuToggle={handleMenuToggle}
      viewMode={viewMode}
      onViewModeChange={handleViewModeChange}
      // Sidebar props
      isMenuOpen={isMenuOpen}
      onMenuClose={handleMenuClose}
      userLocation={userLocation}
      onLocationRefresh={handleLocationRefresh}
      selectedUrgency={selectedUrgency}
      onUrgencyChange={handleUrgencyChange}
      searchFilters={searchFilters}
      onFiltersChange={handleFiltersChange}
      toilets={toilets}
      onSearch={handleSearchRefresh}
      // Loading
      loading={isLoading}
      loadingMessage={loadingMessage}
    >
      {/* Error Alerts */}
      {(locationError || searchError) && (
        <Alert 
          type={searchError?.includes('검색 완료') ? 'success' : 'warning'} 
          onClose={() => {
            // Clear errors after showing
          }}
          dismissible
          className="mb-6"
        >
          {locationError || searchError}
        </Alert>
      )}

      {/* Urgency Selector */}
      <div className="mb-6">
        <UrgencySelector
          selectedUrgency={selectedUrgency}
          onUrgencyChange={handleUrgencyChange}
        />
      </div>

      {/* Main Content */}
      {userLocation ? (
        <div className="space-y-6">
          {viewMode === 'map' ? (
            /* Map View */
            <div className="animate-fade-in">
              <div className="w-full h-[500px] rounded-2xl overflow-hidden shadow-lg border border-gray-200">
                <MapContainer
                  userLocation={userLocation}
                  toilets={toilets}
                  onToiletSelect={handleToiletSelect}
                  selectedUrgency={selectedUrgency}
                />
              </div>
            </div>
          ) : (
            /* List View */
            <div className="animate-fade-in">
              <ToiletList
                toilets={toilets}
                userLocation={userLocation}
                loading={searchLoading}
              />
            </div>
          )}

          {/* Refresh Button */}
          {toilets.length > 0 && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={handleSearchRefresh}
                disabled={isLoading}
                loading={searchLoading}
                icon={<IconRefresh className="h-5 w-5" />}
              >
                새로고침
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* No Location State */
        !isLoading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              위치 정보가 필요합니다
            </h3>
            <p className="text-gray-600 mb-6">
              정확한 화장실 정보를 위해 현재 위치를 허용해주세요.
            </p>
            <div className="space-x-4">
              <Button onClick={getCurrentPosition}>
                위치 다시 가져오기
              </Button>
              <Button variant="outline" onClick={setMockData}>
                샘플 데이터 보기
              </Button>
            </div>
          </div>
        )
      )}

      {/* Floating Action Button */}
      {userLocation && !isLoading && (
        <button
          onClick={handleSearchRefresh}
          className="
            fixed bottom-6 right-6 z-30
            w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white
            rounded-full shadow-lg hover:shadow-xl
            flex items-center justify-center
            transition-all duration-300 transform
            hover:scale-110 active:scale-95
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          "
          aria-label="새로고침"
        >
          <IconRefresh className="h-6 w-6" />
        </button>
      )}
    </Layout>
  );
}

export default App;