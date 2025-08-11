/**
 * Enhanced Functional SideMenu Component
 * Features current location, filters, favorites, and settings
 */
import React, { useState, useEffect } from 'react';
import { IconClose, IconFilter, IconSettings, IconHeart, IconPhone, IconMap, IconList, IconRefresh } from '../icons';
import { toiletService } from '../../services/toiletService';
import Button from './Button';
import Alert from './Alert';

const SideMenu = ({ 
  isOpen, 
  onClose, 
  userLocation, 
  onLocationRefresh, 
  selectedUrgency, 
  onUrgencyChange,
  searchFilters = {},
  onFiltersChange,
  toilets = [],
  onSearch
}) => {
  const [activeSection, setActiveSection] = useState('overview');
  const [localFilters, setLocalFilters] = useState({
    includeCommercial: true,
    includePublic: true,
    maxDistance: 1000,
    minQuality: 1,
    onlyFree: false,
    placeTypes: ['starbucks', 'twosome', 'ediya'],
    ...searchFilters
  });
  const [favorites, setFavorites] = useState([]);
  const [stats, setStats] = useState(null);

  // Calculate stats when toilets change
  useEffect(() => {
    if (toilets && toilets.length > 0) {
      const searchStats = toiletService.getSearchStats(toilets);
      setStats(searchStats);
    }
  }, [toilets]);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('savemetoilet-favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error('Failed to load favorites:', e);
      }
    }
  }, []);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  };

  const handleApplyFilters = () => {
    if (onSearch) {
      onSearch();
    }
    setActiveSection('overview');
  };

  const addToFavorites = (toilet) => {
    const newFavorites = [...favorites, { ...toilet, addedAt: new Date().toISOString() }];
    setFavorites(newFavorites);
    localStorage.setItem('savemetoilet-favorites', JSON.stringify(newFavorites));
  };

  const removeFromFavorites = (toiletId) => {
    const newFavorites = favorites.filter(fav => fav.id !== toiletId);
    setFavorites(newFavorites);
    localStorage.setItem('savemetoilet-favorites', JSON.stringify(newFavorites));
  };

  const formatLocation = (location) => {
    if (!location) return '위치 없음';
    return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
  };

  const menuSections = {
    overview: { title: '현재 상태', icon: <IconMap className="h-5 w-5" /> },
    filters: { title: '검색 필터', icon: <IconFilter className="h-5 w-5" /> },
    favorites: { title: '즐겨찾기', icon: <IconHeart className="h-5 w-5" /> },
    settings: { title: '설정', icon: <IconSettings className="h-5 w-5" /> }
  };

  return (
    <>
      {/* 배경 오버레이 */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* 메뉴 컨테이너 */}
      <aside className={`
        fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white z-50 
        shadow-2xl transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">SaveMeToilet</h2>
              <p className="text-sm text-gray-500 mt-1">내 주변 화장실 찾기</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <IconClose className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* 네비게이션 탭 */}
        <nav className="p-4 border-b border-gray-100">
          <div className="grid grid-cols-4 gap-1">
            {Object.entries(menuSections).map(([key, section]) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`
                  flex flex-col items-center p-2 rounded-lg text-xs
                  transition-all duration-200
                  ${
                    activeSection === key
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                {section.icon}
                <span className="mt-1">{section.title}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* 컨텐츠 영역 */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeSection === 'overview' && (
            <div className="space-y-4">
              {/* 현재 위치 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">📍 현재 위치</h4>
                {userLocation ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      좌표: {formatLocation(userLocation)}
                    </p>
                    {userLocation.fallback && (
                      <Alert type="warning" className="mb-2">
                        기본 위치(서울시청)를 사용 중입니다.
                      </Alert>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onLocationRefresh}
                      icon={<IconRefresh className="h-4 w-4" />}
                      fullWidth
                    >
                      위치 새로고침
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 mb-2">위치를 가져오는 중...</p>
                    <Button size="sm" onClick={onLocationRefresh} fullWidth>
                      위치 허용하기
                    </Button>
                  </div>
                )}
              </div>

              {/* 검색 결과 통계 */}
              {stats && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">📊 검색 결과</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-white rounded p-2">
                      <div className="text-blue-600 font-semibold">{stats.total}</div>
                      <div className="text-gray-500">총 개수</div>
                    </div>
                    <div className="bg-white rounded p-2">
                      <div className="text-green-600 font-semibold">{stats.average_distance}m</div>
                      <div className="text-gray-500">평균 거리</div>
                    </div>
                  </div>
                  
                  {Object.keys(stats.by_type).length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-xs font-medium text-gray-700 mb-1">유형별 분포</h5>
                      <div className="space-y-1">
                        {Object.entries(stats.by_type).map(([type, count]) => (
                          <div key={type} className="flex justify-between text-xs">
                            <span className="capitalize">{type === 'public' ? '공중화장실' : type === 'cafe' ? '카페' : type}</span>
                            <span>{count}개</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 긴급도 선택 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">🚨 긴급도</h4>
                <div className="space-y-2">
                  {['emergency', 'moderate', 'relaxed'].map(urgency => {
                    const config = toiletService.getUrgencyConfig(urgency);
                    return (
                      <button
                        key={urgency}
                        onClick={() => onUrgencyChange && onUrgencyChange(urgency)}
                        className={`
                          w-full p-2 rounded-lg text-left transition-colors
                          ${
                            selectedUrgency === urgency
                              ? 'bg-blue-100 border-2 border-blue-300'
                              : 'bg-white border border-gray-200 hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className="font-medium text-sm">{config.label}</div>
                        <div className="text-xs text-gray-500">{config.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'filters' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">🔧 검색 필터</h4>
              
              {/* 장소 유형 */}
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localFilters.includePublic}
                    onChange={(e) => handleFilterChange('includePublic', e.target.checked)}
                    className="mr-2"
                  />
                  공중화장실 포함
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localFilters.includeCommercial}
                    onChange={(e) => handleFilterChange('includeCommercial', e.target.checked)}
                    className="mr-2"
                  />
                  상업시설 포함
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localFilters.onlyFree}
                    onChange={(e) => handleFilterChange('onlyFree', e.target.checked)}
                    className="mr-2"
                  />
                  무료만 표시
                </label>
              </div>

              {/* 상업시설 유형 */}
              {localFilters.includeCommercial && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700">상업시설 유형</h5>
                  {['starbucks', 'twosome', 'ediya', 'cafe'].map(type => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={localFilters.placeTypes.includes(type)}
                        onChange={(e) => {
                          const newTypes = e.target.checked
                            ? [...localFilters.placeTypes, type]
                            : localFilters.placeTypes.filter(t => t !== type);
                          handleFilterChange('placeTypes', newTypes);
                        }}
                        className="mr-2"
                      />
                      {type === 'starbucks' ? '스타벅스' :
                       type === 'twosome' ? '투썸플레이스' :
                       type === 'ediya' ? '이디야' : '일반 카페'}
                    </label>
                  ))}
                </div>
              )}

              {/* 거리 및 품질 */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    최대 거리: {localFilters.maxDistance}m
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    step="100"
                    value={localFilters.maxDistance}
                    onChange={(e) => handleFilterChange('maxDistance', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    최소 품질: {localFilters.minQuality}점
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={localFilters.minQuality}
                    onChange={(e) => handleFilterChange('minQuality', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              <Button onClick={handleApplyFilters} fullWidth>
                필터 적용
              </Button>
            </div>
          )}

          {activeSection === 'favorites' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">❤️ 즐겨찾기</h4>
              {favorites.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">즐겨찾기한 화장실이 없습니다.</p>
                  <p className="text-gray-400 text-xs mt-1">화장실 정보에서 하트를 눌러 추가하세요.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {favorites.map(fav => (
                    <div key={fav.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-medium text-sm">{fav.name}</h5>
                          <p className="text-xs text-gray-500">{fav.address}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {Math.round(fav.distance)}m · {fav.type}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromFavorites(fav.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">⚙️ 설정</h4>
              
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <h5 className="text-sm font-medium text-gray-700">알림 설정</h5>
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      검색 결과 알림
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      위치 권한 알림
                    </label>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <h5 className="text-sm font-medium text-gray-700">데이터</h5>
                  <div className="mt-2 space-y-2">
                    <Button size="sm" variant="outline" fullWidth>
                      즐겨찾기 내보내기
                    </Button>
                    <Button size="sm" variant="outline" fullWidth>
                      캐시 초기화
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <h5 className="text-sm font-medium text-gray-700">정보</h5>
                  <div className="text-xs text-gray-500 mt-2 space-y-1">
                    <p>버전: 2.0.0</p>
                    <p>마지막 업데이트: 2025-01-11</p>
                    <p>데이터 소스: Seoul Open Data, Google Places</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단 액션 */}
        <div className="border-t border-gray-100 p-4">
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" className="flex-1">
              도움말
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              피드백
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default SideMenu;