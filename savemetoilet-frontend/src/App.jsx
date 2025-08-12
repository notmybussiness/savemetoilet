import React, { useState, useEffect } from 'react';
import { useGeolocation } from './hooks/useGeolocation';
import { useGoogleMaps } from './hooks/useGoogleMaps';
import { toiletService } from './services/toiletService';

/**
 * SaveMeToilet - Simple Version
 * 1. 현재위치 찾기
 * 2. Google Maps로 Starbucks, 이디야, 투썸플레이스 검색 (1km)
 * 3. Seoul API로 공중화장실 검색
 * 4. 지도에 마커로 표시
 */
function App() {
  const [toilets, setToilets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchRadius, setSearchRadius] = useState(1000); // 기본 1km

  // 위치 정보
  const {
    location: userLocation,
    loading: locationLoading,
    error: locationError,
    getCurrentPosition
  } = useGeolocation();

  // Google Maps
  const {
    isLoaded: mapsLoaded,
    loadError: mapsError,
    createMap,
    createMarker,
    createInfoWindow
  } = useGoogleMaps();

  // 현재 위치 찾기
  useEffect(() => {
    getCurrentPosition();
  }, []);

  // 위치를 찾으면 화장실 검색
  useEffect(() => {
    if (userLocation && mapsLoaded) {
      searchToilets();
    }
  }, [userLocation, mapsLoaded]);

  // 확장 검색 함수
  const expandSearch = () => {
    const newRadius = searchRadius === 1000 ? 3000 : searchRadius === 3000 ? 5000 : 1000;
    setSearchRadius(newRadius);
    console.log(`🔍 검색 반경 확장: ${newRadius/1000}km`);
  };

  // 반경 변경 시 자동 재검색
  useEffect(() => {
    if (userLocation && searchRadius !== 1000) {
      searchToilets();
    }
  }, [searchRadius]);

  // 화장실 검색 함수
  const searchToilets = async () => {
    if (!userLocation) return;

    setLoading(true);
    setError('');

    try {
      console.log('🔍 화장실 검색 시작:', userLocation);
      
      const result = await toiletService.searchNearbyToilets(
        userLocation.lat,
        userLocation.lng,
        'moderate', // 기본 긴급도
        searchRadius, // 동적 반경
        {}, // 필터 없음
        ['starbucks', 'ediya', 'twosome'] // 원하는 카페들
      );

      if (result.success) {
        setToilets(result.data.toilets);
        console.log('✅ 검색 완료:', result.data.toilets.length, '개 발견');
        console.log('📊 소스별 분포:', result.data.sources);
        
        // 결과 상세 분석
        const publicCount = result.data.sources.public || 0;
        const commercialCount = result.data.sources.commercial || 0;
        console.log(`🏛️ 공중화장실: ${publicCount}개, ☕ 카페: ${commercialCount}개`);
        
        // 화장실이 없고 기본 반경(1km)이면 자동으로 3km로 확장
        if (result.data.toilets.length === 0 && searchRadius === 1000) {
          console.log('🔍 화장실 없음 - 자동으로 3km 반경 확장');
          setSearchRadius(3000);
        }
      } else {
        setError('화장실 검색에 실패했습니다.');
      }
    } catch (err) {
      console.error('❌ 검색 오류:', err);
      setError('검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 지도 렌더링 - 현재 위치만 있어도 표시
  useEffect(() => {
    if (mapsLoaded && userLocation) {
      renderMap();
    }
  }, [mapsLoaded, userLocation, toilets]);

  const renderMap = () => {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    // 지도 생성
    const map = createMap(mapElement, {
      center: { lat: userLocation.lat, lng: userLocation.lng },
      zoom: 16
    });

    if (!map) return;

    // 현재 위치 마커
    createMarker({
      position: { lat: userLocation.lat, lng: userLocation.lng },
      map: map,
      title: '현재 위치',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="#FFFFFF" stroke-width="2"/>
            <circle cx="12" cy="12" r="3" fill="#FFFFFF"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(24, 24)
      }
    });

    // 화장실 마커들 (있는 경우에만)
    if (toilets.length > 0) {
      toilets.forEach(toilet => {
      const marker = createMarker({
        position: { lat: toilet.coordinates.lat, lng: toilet.coordinates.lng },
        map: map,
        title: toilet.name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="${toilet.color || '#10B981'}" stroke="#FFFFFF" stroke-width="2"/>
              <text x="16" y="20" text-anchor="middle" fill="white" font-size="16">${toilet.icon || '🚽'}</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32)
        }
      });

      // 정보 창
      const infoWindow = createInfoWindow({
        content: `
          <div style="padding: 10px; max-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #1F2937; font-size: 14px; font-weight: bold;">
              ${toilet.name}
            </h3>
            <p style="margin: 0 0 4px 0; color: #6B7280; font-size: 12px;">
              ${toilet.type === 'public' ? '공중화장실' : '카페'} • ${toilet.distance}m
            </p>
            <p style="margin: 0; color: #6B7280; font-size: 12px;">
              ${toilet.address}
            </p>
            ${toilet.hours ? `<p style="margin: 4px 0 0 0; color: #6B7280; font-size: 12px;">⏰ ${toilet.hours}</p>` : ''}
          </div>
        `
      });

      // 클릭 시 정보 창 열기
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
    });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">
            🚽 SaveMeToilet
          </h1>
          <p className="text-sm text-gray-600">
            주변 화장실과 카페를 찾아보세요
          </p>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 로딩 상태 */}
        {(locationLoading || loading) && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">
              {locationLoading ? '위치를 찾는 중...' : '화장실을 검색하는 중...'}
            </p>
          </div>
        )}

        {/* 오류 상태 */}
        {(locationError || mapsError || error) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">
              ❌ {locationError || mapsError || error}
            </p>
            <button 
              onClick={getCurrentPosition}
              className="mt-2 text-red-600 underline text-sm"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 지도 */}
        {mapsLoaded && userLocation && (
          <div className="mb-6">
            <div id="map" className="w-full h-96 rounded-lg border border-gray-200"></div>
          </div>
        )}

        {/* 화장실 목록 */}
        {toilets.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              📍 주변 화장실 ({toilets.length}개)
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {toilets.map(toilet => (
                <div 
                  key={toilet.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">
                        {toilet.icon} {toilet.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {toilet.type === 'public' ? '공중화장실' : '카페'} • {toilet.distance}m
                      </p>
                      <p className="text-xs text-gray-500">
                        {toilet.address}
                      </p>
                      {toilet.hours && (
                        <p className="text-xs text-gray-500 mt-1">
                          ⏰ {toilet.hours}
                        </p>
                      )}
                    </div>
                    <div className={`w-3 h-3 rounded-full ${toilet.color === '#DC2626' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 검색 버튼들 */}
        {userLocation && !loading && (
          <div className="text-center mt-6 space-y-3">
            <div>
              <button
                onClick={searchToilets}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors mr-3"
              >
                🔄 다시 검색
              </button>
              <button
                onClick={expandSearch}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                🔍 범위 확장 ({searchRadius/1000}km → {searchRadius === 1000 ? '3km' : searchRadius === 3000 ? '5km' : '1km'})
              </button>
            </div>
            <p className="text-sm text-gray-600">
              현재 검색 반경: {searchRadius/1000}km
            </p>
          </div>
        )}

        {/* 위치 없음 상태 */}
        {!userLocation && !locationLoading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              위치 정보가 필요합니다
            </h3>
            <p className="text-gray-600 mb-6">
              주변 화장실을 찾기 위해 현재 위치를 허용해주세요.
            </p>
            <button
              onClick={getCurrentPosition}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              위치 허용하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;