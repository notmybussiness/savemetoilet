import { useState, useCallback } from 'react';
import { locationService } from '../services/locationService';
import { DEFAULT_LOCATION } from '../utils/constants';

/**
 * 📍 useGeolocation Hook
 * 위치 정보를 관리하고 사용자의 현재 위치를 가져오는 Hook
 */
export const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 현재 위치 가져오기
  const getCurrentPosition = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const position = await locationService.getCurrentPosition();
      setLocation(position);
      
      if (position.fallback) {
        setError('위치 권한이 거부되었습니다. 서울시청 기준으로 검색합니다.');
      }
      
      return position;
    } catch (err) {
      const fallbackLocation = {
        ...DEFAULT_LOCATION,
        fallback: true,
        accuracy: null
      };
      
      setLocation(fallbackLocation);
      setError(`위치를 가져올 수 없습니다: ${err.message}. 기본 위치를 사용합니다.`);
      
      return fallbackLocation;
    } finally {
      setLoading(false);
    }
  }, []);

  // 위치 새로고침
  const refreshLocation = useCallback(() => {
    return getCurrentPosition();
  }, [getCurrentPosition]);

  // 위치 설정 (수동)
  const setManualLocation = useCallback((lat, lng, address = '') => {
    const manualLocation = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      accuracy: null,
      fallback: true,
      manual: true,
      address
    };
    
    setLocation(manualLocation);
    setError(null);
    
    return manualLocation;
  }, []);

  // 위치 클리어
  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  // 두 지점 사이의 거리 계산 (Haversine formula)
  const calculateDistance = useCallback((lat1, lng1, lat2, lng2) => {
    const R = 6371; // 지구의 반지름 (km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 1000; // 미터 단위
    return Math.round(distance);
  }, []);

  // 현재 위치에서 특정 지점까지의 거리
  const getDistanceFromCurrent = useCallback((lat, lng) => {
    if (!location) return null;
    return calculateDistance(location.lat, location.lng, lat, lng);
  }, [location, calculateDistance]);

  // 위치 권한 상태 체크
  const checkPermissionStatus = useCallback(async () => {
    if (!navigator.permissions || !navigator.permissions.query) {
      return 'unsupported';
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state; // 'granted', 'denied', 'prompt'
    } catch (error) {
      console.warn('⚠️ 위치 권한 상태를 확인할 수 없습니다:', error);
      return 'unknown';
    }
  }, []);

  return {
    // State
    location,
    loading,
    error,
    
    // Actions
    getCurrentPosition,
    refreshLocation,
    setManualLocation,
    clearLocation,
    
    // Utilities
    calculateDistance,
    getDistanceFromCurrent,
    checkPermissionStatus,
    
    // Computed values
    hasLocation: !!location,
    isDefault: location?.fallback === true,
    isManual: location?.manual === true,
    coordinates: location ? { lat: location.lat, lng: location.lng } : null
  };
};