import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { IconHamburger, IconMap, IconList, IconRefresh, getUrgencyIcon } from './components/icons';
import LoadingSpinner from './components/ui/LoadingSpinner';
import SideMenu from './components/ui/SideMenu';
import GoogleMap from './components/GoogleMap';
import UrgencySelector from './components/UrgencySelector';
import ToiletCard from './components/ToiletCard';
import { locationService } from './services/locationService';
import { toiletService } from './services/toiletService';

// =================================================================
// 🎨 Modern UI Components
// =================================================================

const ModernAlert = ({ type = 'info', children, onClose }) => {
  const alertStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800'
  };

  return (
    <div className={`
      border rounded-xl p-4 mb-4 animate-fade-in
      ${alertStyles[type]}
    `}>
      <div className="flex justify-between items-start">
        <div className="flex-1">{children}</div>
        {onClose && (
          <button 
            onClick={onClose}
            className="ml-2 text-current hover:opacity-70 transition-opacity"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

const ModernButton = ({ 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  icon,
  children,
  className = '',
  ...props 
}) => {
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm',
    secondary: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50',
    ghost: 'text-gray-600 hover:bg-gray-100'
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };

  return (
    <button
      className={`
        relative inline-flex items-center justify-center font-medium rounded-xl
        transition-all duration-200 transform
        hover:scale-[1.02] active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      <span className={`flex items-center space-x-2 ${loading ? 'opacity-0' : ''}`}>
        {icon && <span>{icon}</span>}
        <span>{children}</span>
      </span>
    </button>
  );
};

const FloatingActionButton = ({ icon, onClick, className = '', ...props }) => (
  <button
    onClick={onClick}
    className={`
      fixed bottom-6 right-6 z-30
      w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white
      rounded-full shadow-lg hover:shadow-xl
      flex items-center justify-center
      transition-all duration-300 transform
      hover:scale-110 active:scale-95
      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
      ${className}
    `}
    {...props}
  >
    {icon}
  </button>
);

const ViewToggle = ({ viewMode, onViewChange }) => (
  <div className="flex bg-gray-100 p-1 rounded-xl">
    {[
      { key: 'map', icon: <IconMap className="h-5 w-5" />, label: '지도' },
      { key: 'list', icon: <IconList className="h-5 w-5" />, label: '목록' }
    ].map(({ key, icon, label }) => (
      <button
        key={key}
        onClick={() => onViewChange(key)}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium
          transition-all duration-200
          ${viewMode === key 
            ? 'bg-white text-primary-600 shadow-sm' 
            : 'text-gray-600 hover:text-gray-900'
          }
        `}
      >
        {icon}
        <span>{label}</span>
      </button>
    ))}
  </div>
);

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
  const [selectedToilet, setSelectedToilet] = useState(null);
  const [viewMode, setViewMode] = useState('map');

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

  // Search toilets
  const searchToilets = useCallback(async () => {
    if (!userLocation) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const urgencyConfig = toiletService.getUrgencyConfig(selectedUrgency);
      const result = await toiletService.searchNearbyToilets(
        userLocation.lat,
        userLocation.lng,
        selectedUrgency,
        urgencyConfig.radius
      );
      
      if (result.success) {
        const toiletsWithDistance = result.data.toilets.map(toilet => ({
          ...toilet,
          distance: locationService.calculateDistance(
            userLocation.lat,
            userLocation.lng,
            toilet.coordinates.lat,
            toilet.coordinates.lng
          )
        }));
        
        toiletsWithDistance.sort((a, b) => {
          const scoreA = toiletService.calculateUrgencyScore(a, userLocation.lat, userLocation.lng, selectedUrgency);
          const scoreB = toiletService.calculateUrgencyScore(b, userLocation.lat, userLocation.lng, selectedUrgency);
          return scoreB - scoreA;
        });
        
        setToilets(toiletsWithDistance);
      } else {
        setError('화장실 검색에 실패했습니다.');
      }
    } catch (err) {
      setError('API 서버에 연결할 수 없습니다. 임시 데이터를 표시합니다.');
      setMockData();
    } finally {
      setLoading(false);
    }
  }, [userLocation, selectedUrgency]);

  // Mock data for development
  const setMockData = () => {
    const mockToilets = [
      {
        id: 'mock_1',
        name: '스타벅스 강남역점',
        type: 'starbucks',
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
          separate_gender: true
        },
        urgency_match: 'high'
      },
      {
        id: 'mock_2', 
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
        urgency_match: 'medium'
      }
    ];
    
    setToilets(mockToilets);
  };

  // Event handlers
  const toggleMenu = useCallback(() => setIsMenuOpen(prev => !prev), []);
  const handleUrgencyChange = useCallback((urgency) => setSelectedUrgency(urgency), []);
  const handleToiletSelect = useCallback((toilet) => setSelectedToilet(toilet), []);
  const handleViewModeChange = useCallback((mode) => setViewMode(mode), []);

  // Effects
  useEffect(() => {
    initializeLocation();
  }, [initializeLocation]);

  useEffect(() => {
    if (userLocation) {
      searchToilets();
    }
  }, [userLocation, selectedUrgency, searchToilets]);

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
        {/* Error Alert */}
        {error && (
          <ModernAlert type="warning" onClose={() => setError(null)}>
            {error}
          </ModernAlert>
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
                  <ModernAlert type="info">
                    근처에 화장실을 찾을 수 없습니다. 검색 범위를 넓혀보세요.
                  </ModernAlert>
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
                <ModernButton
                  variant="outline"
                  onClick={searchToilets}
                  disabled={loading}
                  loading={loading}
                  icon={<IconRefresh className="h-5 w-5" />}
                >
                  새로고침
                </ModernButton>
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
              <ModernButton onClick={initializeLocation}>
                위치 다시 가져오기
              </ModernButton>
            </div>
          )
        )}
      </main>

      {/* Side Menu */}
      <SideMenu isOpen={isMenuOpen} onClose={toggleMenu} />

      {/* Floating Action Button */}
      <FloatingActionButton
        icon={<IconRefresh className="h-6 w-6" />}
        onClick={searchToilets}
        style={{ display: userLocation && !loading ? 'flex' : 'none' }}
      />
    </div>
  );
}

export default App;