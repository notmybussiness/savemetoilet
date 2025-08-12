import { useState, useEffect, useCallback } from 'react';

/**
 * 🗺️ useKakaoMaps Hook
 * Kakao Maps JavaScript API를 로드하고 관리
 * Google Maps API를 완전 대체
 */
export const useKakaoMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Kakao Maps API 로드
  useEffect(() => {
    const apiKey = import.meta.env.VITE_KAKAO_MAP_API_KEY;
    
    if (!apiKey || apiKey === 'your_kakao_javascript_key_here') {
      setLoadError('Kakao Map API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.');
      return;
    }

    // 이미 로드된 경우
    if (window.kakao?.maps) {
      setIsLoaded(true);
      return;
    }

    // 이미 로딩 중인 경우
    if (document.querySelector('script[src*="dapi.kakao.com"]')) {
      return;
    }

    setIsLoading(true);
    console.log('🗺️ Kakao Maps API 로딩 시작...');

    // Kakao Maps SDK 스크립트 동적 로드
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services`;
    script.async = true;
    
    script.onload = () => {
      console.log('✅ Kakao Maps API 로드 완료');
      setIsLoaded(true);
      setIsLoading(false);
      setLoadError(null);
    };
    
    script.onerror = (error) => {
      console.error('❌ Kakao Maps API 로드 실패:', error);
      setLoadError('Kakao Maps API 로드에 실패했습니다. API 키를 확인해주세요.');
      setIsLoading(false);
    };

    document.head.appendChild(script);

    // 정리 함수
    return () => {
      // 스크립트는 제거하지 않음 (재사용을 위해)
    };
  }, []);

  // 지도 인스턴스 생성
  const createMap = useCallback((element, options) => {
    if (!isLoaded || !window.kakao?.maps) {
      console.warn('⚠️ Kakao Maps API가 아직 로드되지 않았습니다');
      return null;
    }

    try {
      const mapOptions = {
        center: new window.kakao.maps.LatLng(options.center.lat, options.center.lng),
        level: options.zoom ? Math.max(1, Math.min(14, 15 - options.zoom)) : 3 // Google zoom을 Kakao level로 변환
      };

      const map = new window.kakao.maps.Map(element, mapOptions);
      
      console.log('🗺️ Kakao Map 인스턴스 생성 완료');
      return map;
    } catch (error) {
      console.error('❌ Kakao Map 생성 실패:', error);
      return null;
    }
  }, [isLoaded]);

  // 마커 생성 (Google Maps 호환 인터페이스)
  const createMarker = useCallback((options) => {
    if (!isLoaded || !window.kakao?.maps) {
      console.warn('⚠️ Kakao Maps API를 사용할 수 없습니다');
      return null;
    }

    try {
      const markerOptions = {
        position: new window.kakao.maps.LatLng(options.position.lat, options.position.lng),
        map: options.map
      };

      // 커스텀 마커 이미지가 있는 경우
      if (options.icon && options.icon.url) {
        // SVG data URL인 경우 처리
        if (options.icon.url.startsWith('data:image/svg+xml')) {
          const imageSize = new window.kakao.maps.Size(
            options.icon.scaledSize?.width || 32, 
            options.icon.scaledSize?.height || 32
          );
          const markerImage = new window.kakao.maps.MarkerImage(
            options.icon.url,
            imageSize
          );
          markerOptions.image = markerImage;
        }
      }

      const marker = new window.kakao.maps.Marker(markerOptions);
      
      // 제목 설정 (툴팁)
      if (options.title) {
        marker.setTitle = (title) => {
          // Kakao Maps에서는 직접적인 title 지원이 제한적
          // InfoWindow로 대체하거나 별도 처리 필요
        };
      }

      return marker;
    } catch (error) {
      console.error('❌ Kakao Marker 생성 실패:', error);
      return null;
    }
  }, [isLoaded]);

  // 정보창 생성 (Google Maps 호환)
  const createInfoWindow = useCallback((options = {}) => {
    if (!isLoaded || !window.kakao?.maps) {
      console.warn('⚠️ Kakao Maps API를 사용할 수 없습니다');
      return null;
    }

    try {
      const infoWindow = new window.kakao.maps.InfoWindow({
        content: options.content || '',
        removable: true
      });

      // Google Maps 호환 메서드 추가
      const originalOpen = infoWindow.open.bind(infoWindow);
      infoWindow.open = (map, marker) => {
        if (marker) {
          originalOpen(map, marker);
        } else {
          // 마커 없이 지도에 직접 표시
          originalOpen(map);
        }
      };

      return infoWindow;
    } catch (error) {
      console.error('❌ Kakao InfoWindow 생성 실패:', error);
      return null;
    }
  }, [isLoaded]);

  // 좌표 범위 생성
  const createBounds = useCallback(() => {
    if (!isLoaded || !window.kakao?.maps) {
      console.warn('⚠️ Kakao Maps API를 사용할 수 없습니다');
      return null;
    }

    try {
      return new window.kakao.maps.LatLngBounds();
    } catch (error) {
      console.error('❌ Kakao LatLngBounds 생성 실패:', error);
      return null;
    }
  }, [isLoaded]);

  return {
    // 상태
    isLoaded,
    loadError,
    isLoading,
    
    // Factory 메서드들 (Google Maps 호환 인터페이스)
    createMap,
    createMarker,
    createInfoWindow,
    createBounds,
    
    // 직접 API 접근
    maps: window.kakao?.maps,
    
    // 상태 체크 유틸리티
    hasPlacesAPI: isLoaded && !!window.kakao?.maps?.services?.Places,
    hasGeocoderAPI: isLoaded && !!window.kakao?.maps?.services?.Geocoder,
    
    // Google Maps과의 호환성을 위한 별칭
    mapsLoaded: isLoaded,
    mapsError: loadError
  };
};