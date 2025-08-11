import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { IconHamburger, IconRefresh } from './components/icons';
import { LoadingSpinner, SideMenu, Alert, Button, ViewToggle } from './components/ui';
import GoogleMap from './components/GoogleMap';
import UrgencySelector from './components/UrgencySelector';
import ToiletCard from './components/ToiletCard';
import { locationService } from './services/locationService';
import { toiletService } from './services/toiletService';

// =================================================================
// 🚀 Enhanced SaveMeToilet App with Places API Integration
// =================================================================

// =================================================================
// 🚀 Main App Component
// =================================================================

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [toilets, setToilets] = useState([]);
  const [selectedUrgency, setSelectedUrgency] = useState('moderate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [, setSelectedToilet] = useState(null);
  const [viewMode, setViewMode] = useState('map');
  const [searchFilters, setSearchFilters] = useState({
    includeCommercial: true,
    includePublic: true,
    maxDistance: 1000,
    minQuality: 1,
    onlyFree: false,
    placeTypes: ['starbucks', 'twosome', 'ediya']
  });

  // Initialize location
  const initializeLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const location = await locationService.getCurrentPosition();
      setUserLocation(location);
      
      if (location.fallback) {
        setError('위치 권한이 거부되었습니다. 서울시청 기준으로 검색합니다.');
      }
    } catch (err) {
      setError('위치를 가져올 수 없습니다: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Enhanced search with Places API integration
  const searchToilets = useCallback(async () => {
    if (!userLocation) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🚀 검색 시작:', { userLocation, selectedUrgency, searchFilters });
      
      const urgencyConfig = toiletService.getUrgencyConfig(selectedUrgency);
      
      // Determine place types based on urgency and filters
      const placeTypes = searchFilters.includeCommercial 
        ? (urgencyConfig.placeTypes || searchFilters.placeTypes) 
        : [];
      
      console.log('📊 검색 설정:', { urgencyConfig, placeTypes });
      
      // Enhanced search with commercial places
      const result = await toiletService.searchNearbyToilets(
        userLocation.lat,
        userLocation.lng,
        selectedUrgency,
        Math.min(urgencyConfig.radius, searchFilters.maxDistance),
        searchFilters,
        placeTypes
      );
      
      console.log('🔎 검색 결과:', result);
      
      if (result.success) {
        let filteredToilets = result.data.toilets;
        
        // Apply client-side filters
        filteredToilets = filteredToilets.filter(toilet => {
          if (!searchFilters.includePublic && toilet.type === 'public') return false;
          if (!searchFilters.includeCommercial && toilet.category === 'cafe') return false;
          if (searchFilters.onlyFree && !toilet.is_free) return false;
          if (toilet.quality_score < searchFilters.minQuality) return false;
          if (toilet.distance > searchFilters.maxDistance) return false;
          return true;
        });
        
        console.log('✨ 필터링된 결과:', filteredToilets);
        setToilets(filteredToilets);
        
        // Show success message with source breakdown
        if (result.data.sources) {
          const { public: publicCount = 0, commercial: commercialCount = 0 } = result.data.sources;
          const message = `검색 완료: 공중화장실 ${publicCount}개, 상업시설 ${commercialCount}개 발견`;
          console.log('📋 ' + message);
          setError(message);
          setTimeout(() => setError(null), 3000);
        }
      } else {
        console.error('❌ 검색 실패:', result.error);
        setError(`검색 실패: ${result.error || '알 수 없는 오류'}`);
        if (result.data && result.data.toilets) {
          console.log('📦 Fallback 데이터 사용');
          setToilets(result.data.toilets); // Use fallback data
        }
      }
    } catch (err) {
      console.error('💥 Search error:', err);
      setError(`검색 중 오류 발생: ${err.message}\n\nGoogle Places API 키가 올바르게 설정되고 Places API가 활성화되었는지 확인해주세요.\n\nMock 데이터를 표시합니다.`);
      setMockData();
    } finally {
      setLoading(false);
    }
  }, [userLocation, selectedUrgency, searchFilters]);

  // Enhanced mock data for development (더 많은 스타벅스 데이터)
  const setMockData = () => {
    const mockToilets = [
      {
        id: 'mock_starbucks_1',
        name: '스타벅스 강남역점',
        type: 'cafe',
        category: 'cafe',
        quality_score: 3,
        distance: 150,
        is_free: false,
        coordinates: { lat: 37.5665 + 0.001, lng: 126.9780 + 0.001 },
        address: '서울시 강남구 강남대로 396',
        phone: '02-1234-5678',
        hours: '06:00-22:00',
        facilities: {
          disabled_access: true,
          baby_changing: true,
          separate_gender: true,
          wifi: true,
          parking: false
        },
        urgency_match: 'high',
        source: 'mock_places',
        color: '#00704A',
        icon: '☕',
        rating: 4.5
      },
      {
        id: 'mock_starbucks_2',
        name: '스타벅스 명동점',
        type: 'cafe', 
        category: 'cafe',
        quality_score: 3,
        distance: 220,
        is_free: false,
        coordinates: { lat: 37.5665 + 0.002, lng: 126.9780 - 0.001 },
        address: '서울시 중구 명동길 123',
        phone: '02-2345-6789',
        hours: '06:30-22:30',
        facilities: {
          disabled_access: true,
          baby_changing: true,
          separate_gender: true,
          wifi: true,
          parking: true
        },
        urgency_match: 'high',
        source: 'mock_places',
        color: '#00704A',
        icon: '☕',
        rating: 4.3
      },
      {
        id: 'mock_twosome_1',
        name: 'A Twosome Place 시청점',
        type: 'cafe',
        category: 'cafe', 
        quality_score: 3,
        distance: 180,
        is_free: false,
        coordinates: { lat: 37.5665 - 0.001, lng: 126.9780 + 0.001 },
        address: '서울시 중구 세종대로 110',
        phone: '02-3456-7890',
        hours: '07:00-23:00',
        facilities: {
          disabled_access: true,
          baby_changing: true,
          separate_gender: true,
          wifi: true,
          parking: false
        },
        urgency_match: 'high',
        source: 'mock_places',
        color: '#8B4513',
        icon: '☕',
        rating: 4.2
      },
      {
        id: 'mock_ediya_1',
        name: 'EDIYA Coffee 종각점',
        type: 'cafe',
        category: 'cafe',
        quality_score: 2,
        distance: 320,
        is_free: false,
        coordinates: { lat: 37.5665 + 0.003, lng: 126.9780 + 0.002 },
        address: '서울시 종로구 종로 51',
        phone: '02-4567-8901',
        hours: '06:00-22:00',
        facilities: {
          disabled_access: true,
          baby_changing: false,
          separate_gender: true,
          wifi: true,
          parking: false
        },
        urgency_match: 'medium',
        source: 'mock_places',
        color: '#FF6B35',
        icon: '☕',
        rating: 4.0
      },
      {
        id: 'mock_public_1', 
        name: '강남구청 공중화장실',
        type: 'public',
        category: 'public',
        quality_score: 2,
        distance: 280,
        is_free: true,
        coordinates: { lat: 37.5665 - 0.002, lng: 126.9780 + 0.002 },
        address: '서울시 강남구 학동로 426',
        phone: null,
        hours: '24시간',
        facilities: {
          disabled_access: true,
          baby_changing: false,
          separate_gender: true
        },
        urgency_match: 'medium',
        source: 'seoul_api',
        color: '#28a745',
        icon: '🚽'
      },
      {
        id: 'mock_public_2',
        name: '시청역 지하 공중화장실',
        type: 'public',
        category: 'public',
        quality_score: 1,
        distance: 350,
        is_free: true,
        coordinates: { lat: 37.5665 - 0.003, lng: 126.9780 - 0.002 },
        address: '서울시 중구 시청역 지하1층',
        phone: null,
        hours: '05:30-00:30 (지하철 운행시간)',
        facilities: {
          disabled_access: true,
          baby_changing: false,
          separate_gender: true
        },
        urgency_match: 'low',
        source: 'seoul_api', 
        color: '#28a745',
        icon: '🚽'
      }
    ];
    
    setToilets(mockToilets);
    
    // 성공 메시지 표시
    setError('Mock 데이터 로드됨: 공중화장실 2개, 상업시설 4개 (스타벅스, 투썸플레이스, 이디야)');
    setTimeout(() => setError(null), 4000);
  };

  // Event handlers
  const toggleMenu = useCallback(() => setIsMenuOpen(prev => !prev), []);
  const handleUrgencyChange = useCallback((urgency) => {
    setSelectedUrgency(urgency);
  }, []);
  const handleToiletSelect = useCallback((toilet) => {
    setSelectedToilet(toilet);
    // TODO: Implement toilet detail modal
    console.log('Selected toilet:', toilet);
  }, []);
  const handleViewModeChange = useCallback((mode) => setViewMode(mode), []);
  const handleFiltersChange = useCallback((newFilters) => {
    setSearchFilters(newFilters);
  }, []);
  const handleLocationRefresh = useCallback(() => {
    initializeLocation();
  }, [initializeLocation]);

  // Effects
  useEffect(() => {
    initializeLocation();
  }, [initializeLocation]);

  useEffect(() => {
    if (userLocation) {
      searchToilets();
    }
  }, [userLocation, selectedUrgency, searchToilets]);

  // Debounced search when filters change
  useEffect(() => {
    if (userLocation) {
      const timeoutId = setTimeout(() => {
        searchToilets();
      }, 500); // 500ms debounce
      
      return () => clearTimeout(timeoutId);
    }
  }, [searchFilters, searchToilets, userLocation]);

  // Memoized components
  const memoizedMap = useMemo(() => (
    userLocation && (
      <div className="w-full h-[500px] rounded-2xl overflow-hidden shadow-lg border border-gray-200">
        <GoogleMap
          userLocation={userLocation}
          toilets={toilets}
          onToiletSelect={handleToiletSelect}
          selectedUrgency={selectedUrgency}
        />
      </div>
    )
  ), [userLocation, toilets, selectedUrgency, handleToiletSelect]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Loading Overlay */}
      {loading && (
        <LoadingSpinner message={userLocation ? "화장실을\n검색하는 중..." : "현재 위치를\n찾는 중..."} />
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo & Menu Button */}
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleMenu}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="메뉴 열기"
              >
                <IconHamburger className="h-6 w-6" />
              </button>
              
              <div className="flex items-center space-x-2">
                <div className="text-2xl">🚽</div>
                <h1 className="text-xl font-bold text-gray-900">SaveMeToilet</h1>
              </div>
            </div>

            {/* View Toggle */}
            <ViewToggle viewMode={viewMode} onViewChange={handleViewModeChange} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error/Info Alert */}
        {error && (
          <Alert 
            type={error.includes('검색 완료') ? 'success' : 'warning'} 
            onClose={() => setError(null)}
            dismissible
          >
            {error}
          </Alert>
        )}

        {/* Urgency Selector */}
        <div className="mb-6">
          <UrgencySelector
            selectedUrgency={selectedUrgency}
            onUrgencyChange={handleUrgencyChange}
          />
        </div>

        {/* Content Area */}
        {userLocation ? (
          <div className="space-y-6">
            {viewMode === 'map' ? (
              /* Map View */
              <div className="animate-fade-in">
                {memoizedMap}
              </div>
            ) : (
              /* List View */
              <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    📍 내 근처 화장실 ({toilets.length}개)
                  </h2>
                </div>
                
                {toilets.length === 0 ? (
                  <Alert type="info">
                    <div className="space-y-2">
                      <p>근처에 화장실을 찾을 수 없습니다.</p>
                      <div className="text-sm">
                        <p>다음을 시도해보세요:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>검색 범위를 늘려보세요</li>
                          <li>다른 긴급도로 검색해보세요</li>
                          <li>상업시설 검색을 활성화해보세요</li>
                        </ul>
                      </div>
                    </div>
                  </Alert>
                ) : (
                  <div className="grid gap-4">
                    {toilets.map(toilet => (
                      <div key={toilet.id} className="animate-scale-in">
                        <ToiletCard
                          toilet={toilet}
                          userLocation={userLocation}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Refresh Button */}
            {toilets.length > 0 && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={searchToilets}
                  disabled={loading}
                  loading={loading}
                  icon={<IconRefresh className="h-5 w-5" />}
                >
                  새로고침
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* No Location State */
          !loading && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📍</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">위치 정보가 필요합니다</h3>
              <p className="text-gray-600 mb-6">정확한 화장실 정보를 위해 현재 위치를 허용해주세요.</p>
              <Button onClick={initializeLocation}>
                위치 다시 가져오기
              </Button>
            </div>
          )
        )}
      </main>

      {/* Enhanced Side Menu */}
      <SideMenu 
        isOpen={isMenuOpen} 
        onClose={toggleMenu}
        userLocation={userLocation}
        onLocationRefresh={handleLocationRefresh}
        selectedUrgency={selectedUrgency}
        onUrgencyChange={handleUrgencyChange}
        searchFilters={searchFilters}
        onFiltersChange={handleFiltersChange}
        toilets={toilets}
        onSearch={searchToilets}
      />

      {/* Floating Action Button */}
      {userLocation && !loading && (
        <button
          onClick={searchToilets}
          className="
            fixed bottom-6 right-6 z-30
            w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white
            rounded-full shadow-lg hover:shadow-xl
            flex items-center justify-center
            transition-all duration-300 transform
            hover:scale-110 active:scale-95
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          "
        >
          <IconRefresh className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}

export default App;