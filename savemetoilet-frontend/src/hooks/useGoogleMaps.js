import { useState, useEffect, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

/**
 * 🗺️ useGoogleMaps Hook
 * Google Maps JavaScript API를 최신 베스트 프랙티스로 로드하고 관리
 */
export const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [loader, setLoader] = useState(null);

  // Google Maps API 로드
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey === 'your_google_maps_api_key_here' || apiKey === '받으신API키를여기에넣어주세요') {
      setLoadError('Google Maps API 키가 설정되지 않았습니다. 환경 변수를 확인해주세요.');
      return;
    }

    // 이미 로드된 경우
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    const mapsLoader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'marker'],
      loading: 'async' // 🚀 성능 최적화: 비동기 로딩
    });

    setLoader(mapsLoader);

    mapsLoader
      .load()
      .then(() => {
        setIsLoaded(true);
        setLoadError(null);
        console.log('🗺️ Google Maps API 로드 완료');
      })
      .catch((error) => {
        console.error('❌ Google Maps API 로드 실패:', error);
        setLoadError(`Google Maps API 로드 실패: ${error.message}`);
      });
  }, []);

  // Map 인스턴스 생성
  const createMap = useCallback((element, options) => {
    if (!isLoaded || !window.google?.maps) {
      console.warn('⚠️ Google Maps API가 아직 로드되지 않았습니다');
      return null;
    }

    try {
      return new window.google.maps.Map(element, {
        ...options,
        // 🚀 최신 Map ID 사용 (선택사항)
        mapId: 'DEMO_MAP_ID', 
        // 성능 최적화를 위한 기본 옵션들
        gestureHandling: 'greedy',
        disableDefaultUI: true,
        zoomControl: true,
        // 📱 모바일 최적화
        clickableIcons: false,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'simplified' }]
          },
          {
            featureType: 'transit',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });
    } catch (error) {
      console.error('❌ Map 생성 실패:', error);
      return null;
    }
  }, [isLoaded]);

  // AdvancedMarkerElement 생성 (최신 권장 방법)
  const createAdvancedMarker = useCallback((options) => {
    if (!isLoaded || !window.google?.maps?.marker?.AdvancedMarkerElement) {
      console.warn('⚠️ AdvancedMarkerElement를 사용할 수 없습니다. Fallback to Marker');
      return null;
    }

    try {
      return new window.google.maps.marker.AdvancedMarkerElement(options);
    } catch (error) {
      console.error('❌ AdvancedMarker 생성 실패:', error);
      return null;
    }
  }, [isLoaded]);

  // Legacy Marker 생성 (fallback)
  const createMarker = useCallback((options) => {
    if (!isLoaded || !window.google?.maps?.Marker) {
      console.warn('⚠️ Marker API를 사용할 수 없습니다');
      return null;
    }

    try {
      return new window.google.maps.Marker(options);
    } catch (error) {
      console.error('❌ Marker 생성 실패:', error);
      return null;
    }
  }, [isLoaded]);

  // InfoWindow 생성
  const createInfoWindow = useCallback((options = {}) => {
    if (!isLoaded || !window.google?.maps?.InfoWindow) {
      console.warn('⚠️ InfoWindow API를 사용할 수 없습니다');
      return null;
    }

    try {
      return new window.google.maps.InfoWindow(options);
    } catch (error) {
      console.error('❌ InfoWindow 생성 실패:', error);
      return null;
    }
  }, [isLoaded]);

  // LatLngBounds 생성
  const createBounds = useCallback(() => {
    if (!isLoaded || !window.google?.maps?.LatLngBounds) {
      console.warn('⚠️ LatLngBounds API를 사용할 수 없습니다');
      return null;
    }

    try {
      return new window.google.maps.LatLngBounds();
    } catch (error) {
      console.error('❌ LatLngBounds 생성 실패:', error);
      return null;
    }
  }, [isLoaded]);

  return {
    isLoaded,
    loadError,
    loader,
    // Factory methods
    createMap,
    createAdvancedMarker,
    createMarker,
    createInfoWindow,
    createBounds,
    // Direct API access
    maps: window.google?.maps,
    // 상태 체크 유틸리티
    hasAdvancedMarkers: isLoaded && !!window.google?.maps?.marker?.AdvancedMarkerElement,
    hasPlacesAPI: isLoaded && !!window.google?.maps?.places
  };
};