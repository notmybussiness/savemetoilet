import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGoogleMaps } from '../../hooks/useGoogleMaps';
import { MARKER_STYLES, SEARCH_CONFIG } from '../../utils/constants';
import { Alert } from '../ui';

/**
 * 🗺️ MapContainer Component
 * 최신 Google Maps JavaScript API를 사용하는 최적화된 지도 컴포넌트
 */
const MapContainer = ({ 
  userLocation, 
  toilets = [], 
  onToiletSelect, 
  selectedUrgency = 'moderate',
  className = ''
}) => {
  const mapContainer = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [infoWindow, setInfoWindow] = useState(null);
  
  const {
    isLoaded,
    loadError,
    createMap,
    createAdvancedMarker,
    createMarker,
    createInfoWindow,
    createBounds,
    hasAdvancedMarkers
  } = useGoogleMaps();

  // 지도 초기화
  useEffect(() => {
    if (!isLoaded || !userLocation || !mapContainer.current || map) return;

    console.log('🗺️ 지도 초기화 시작');
    
    const mapOptions = {
      center: { lat: userLocation.lat, lng: userLocation.lng },
      zoom: SEARCH_CONFIG.DEFAULT_ZOOM,
      mapTypeId: 'roadmap'
    };

    const googleMap = createMap(mapContainer.current, mapOptions);
    if (googleMap) {
      setMap(googleMap);
      
      // InfoWindow 생성
      const infoWindowInstance = createInfoWindow();
      setInfoWindow(infoWindowInstance);
      
      console.log('✅ 지도 초기화 완료');
    }
  }, [isLoaded, userLocation, map, createMap, createInfoWindow]);

  // 사용자 위치 마커 생성
  const createUserLocationMarker = useCallback((map, location) => {
    if (!map || !location) return null;

    console.log('📍 사용자 위치 마커 생성');

    if (hasAdvancedMarkers) {
      // AdvancedMarkerElement 사용 (최신 권장 방법)
      const userLocationIcon = document.createElement('div');
      userLocationIcon.innerHTML = `
        <div style="
          width: ${MARKER_STYLES.userLocation.size.width}px; 
          height: ${MARKER_STYLES.userLocation.size.height}px;
          background: ${MARKER_STYLES.userLocation.color};
          border: ${MARKER_STYLES.userLocation.borderWidth}px solid ${MARKER_STYLES.userLocation.borderColor};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          position: relative;
          z-index: 10;
        ">
          <div style="
            width: 6px; height: 6px;
            background: ${MARKER_STYLES.userLocation.borderColor};
            border-radius: 50%;
          "></div>
        </div>
      `;
      
      return createAdvancedMarker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        title: '내 위치',
        content: userLocationIcon
      });
    } else {
      // Legacy Marker fallback
      console.log('⚠️ AdvancedMarkerElement를 사용할 수 없어 Legacy Marker 사용');
      return createMarker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        title: '내 위치',
        icon: {
          url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
              <circle cx="16" cy="16" r="12" fill="${MARKER_STYLES.userLocation.color}" stroke="${MARKER_STYLES.userLocation.borderColor}" stroke-width="${MARKER_STYLES.userLocation.borderWidth}"/>
              <circle cx="16" cy="16" r="3" fill="${MARKER_STYLES.userLocation.borderColor}"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 16)
        }
      });
    }
  }, [hasAdvancedMarkers, createAdvancedMarker, createMarker]);

  // 화장실 마커 생성
  const createToiletMarker = useCallback((map, toilet, infoWindow) => {
    if (!map || !toilet || !infoWindow) return null;

    const getMarkerColor = (urgencyMatch) => {
      switch (urgencyMatch) {
        case 'high': return '#dc3545'; // Red
        case 'medium': return '#ffc107'; // Yellow
        case 'low': return '#28a745'; // Green
        default: return '#6c757d'; // Gray
      }
    };

    const color = getMarkerColor(toilet.urgency_match);
    let marker;

    if (hasAdvancedMarkers) {
      // AdvancedMarkerElement 사용
      const toiletIcon = document.createElement('div');
      toiletIcon.innerHTML = `
        <div style="
          width: ${MARKER_STYLES.toilet.size.width}px; 
          height: ${MARKER_STYLES.toilet.size.height}px;
          background: ${color};
          border: ${MARKER_STYLES.toilet.borderWidth}px solid ${MARKER_STYLES.toilet.borderColor};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: transform 0.2s ease;
        " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
          ${toilet.icon || '🚽'}
        </div>
      `;
      
      marker = createAdvancedMarker({
        position: { 
          lat: toilet.coordinates.lat, 
          lng: toilet.coordinates.lng 
        },
        map: map,
        title: toilet.name,
        content: toiletIcon
      });
    } else {
      // Legacy Marker fallback
      marker = createMarker({
        position: { 
          lat: toilet.coordinates.lat, 
          lng: toilet.coordinates.lng 
        },
        map: map,
        title: toilet.name,
        icon: {
          url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
              <circle cx="14" cy="14" r="12" fill="${color}" stroke="${MARKER_STYLES.toilet.borderColor}" stroke-width="${MARKER_STYLES.toilet.borderWidth}"/>
              <text x="14" y="18" text-anchor="middle" fill="white" font-size="12">${toilet.icon || '🚽'}</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(28, 28),
          anchor: new window.google.maps.Point(14, 14)
        }
      });
    }

    // 마커 클릭 이벤트
    if (marker && window.google?.maps?.event) {
      window.google.maps.event.addListener(marker, 'click', () => {
        // 화장실 선택 콜백
        if (onToiletSelect) {
          onToiletSelect(toilet);
        }
        
        // InfoWindow 내용 생성
        const infoContent = `
          <div style="padding: 12px; min-width: 200px; font-family: 'Inter', sans-serif; line-height: 1.4;">
            <h6 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">
              ${toilet.name}
            </h6>
            <div style="margin-bottom: 8px; font-size: 13px; color: #6b7280;">
              <span style="display: inline-flex; align-items: center; margin-right: 12px;">
                🚶‍♂️ ${Math.round(toilet.distance)}m
              </span>
              <span style="display: inline-flex; align-items: center;">
                ${toilet.is_free ? '🆓 무료' : '💰 구매필요'}
              </span>
            </div>
            ${toilet.hours ? `
              <div style="margin-bottom: 8px; font-size: 12px; color: #9ca3af;">
                🕒 ${toilet.hours}
              </div>
            ` : ''}
            <div style="display: flex; gap: 6px; margin-top: 10px;">
              <a href="https://www.google.com/maps/dir/?api=1&destination=${toilet.coordinates.lat},${toilet.coordinates.lng}" 
                 target="_blank" rel="noopener noreferrer"
                 style="padding: 6px 10px; font-size: 11px; background: #4285f4; color: white; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 500;">
                Google 길찾기
              </a>
              <a href="https://map.naver.com/v5/directions/-/-,${toilet.coordinates.lng},${toilet.coordinates.lat},name=${encodeURIComponent(toilet.name)}" 
                 target="_blank" rel="noopener noreferrer"
                 style="padding: 6px 10px; font-size: 11px; background: #00c73c; color: white; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 500;">
                네이버 길찾기
              </a>
            </div>
          </div>
        `;

        infoWindow.setContent(infoContent);
        infoWindow.open(map, marker);
      });
    }

    return marker;
  }, [hasAdvancedMarkers, createAdvancedMarker, createMarker, onToiletSelect]);

  // 마커 업데이트
  useEffect(() => {
    if (!map || !infoWindow) return;

    console.log('🗺️ 마커 업데이트 시작:', { toilets: toilets.length, userLocation: !!userLocation });

    // 기존 마커 제거
    markers.forEach(marker => {
      if (marker && marker.setMap) {
        marker.setMap(null);
      }
    });

    const newMarkers = [];

    // 사용자 위치 마커 추가
    if (userLocation) {
      const userMarker = createUserLocationMarker(map, userLocation);
      if (userMarker) {
        newMarkers.push(userMarker);
      }
    }

    // 화장실 마커 추가
    toilets.forEach(toilet => {
      const toiletMarker = createToiletMarker(map, toilet, infoWindow);
      if (toiletMarker) {
        newMarkers.push(toiletMarker);
      }
    });

    setMarkers(newMarkers);

    // 지도 범위 조정
    if (toilets.length > 0 && userLocation) {
      const bounds = createBounds();
      if (bounds) {
        // 사용자 위치 추가
        bounds.extend(new window.google.maps.LatLng(userLocation.lat, userLocation.lng));
        
        // 화장실 위치들 추가
        toilets.forEach(toilet => {
          bounds.extend(new window.google.maps.LatLng(
            toilet.coordinates.lat,
            toilet.coordinates.lng
          ));
        });

        map.fitBounds(bounds);
        
        // 최대 줌 레벨 제한
        const listener = window.google.maps.event.addListener(map, 'idle', () => {
          if (map.getZoom() > SEARCH_CONFIG.MAX_ZOOM) {
            map.setZoom(SEARCH_CONFIG.MAX_ZOOM);
          }
          window.google.maps.event.removeListener(listener);
        });
      }
    }

    console.log('✅ 마커 업데이트 완료:', newMarkers.length);
  }, [map, toilets, userLocation, infoWindow, createUserLocationMarker, createToiletMarker, createBounds, markers]);

  // 로딩 중일 때
  if (!isLoaded) {
    return (
      <div className={`w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">지도를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러가 있을 때
  if (loadError) {
    return (
      <div className={className}>
        <Alert variant="danger">
          <div className="space-y-2">
            <h6 className="font-semibold">지도 로드 오류</h6>
            <p className="text-sm">{loadError}</p>
            <div className="text-xs text-gray-600">
              <p>Google Maps API 키가 필요합니다.</p>
              <p>
                <a 
                  href="https://console.cloud.google.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Google Cloud Console
                </a>
                에서 Maps JavaScript API를 활성화하고 API 키를 생성해주세요.
              </p>
            </div>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div 
      ref={mapContainer} 
      className={`w-full h-[400px] rounded-lg border border-gray-200 shadow-sm ${className}`}
      style={{ minHeight: '400px' }}
    />
  );
};

export default React.memo(MapContainer);