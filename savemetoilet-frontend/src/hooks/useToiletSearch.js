import { useState, useCallback, useMemo } from 'react';
import { toiletService } from '../services/toiletService';
import { URGENCY_CONFIGS, MOCK_TOILETS } from '../utils/constants';

/**
 * 🚽 useToiletSearch Hook
 * 화장실 검색 로직을 관리하는 Hook
 */
export const useToiletSearch = () => {
  const [toilets, setToilets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSearchParams, setLastSearchParams] = useState(null);

  // 화장실 검색
  const searchToilets = useCallback(async (userLocation, urgency, filters = {}) => {
    if (!userLocation) {
      console.warn('⚠️ 사용자 위치가 없습니다');
      return;
    }

    setLoading(true);
    setError(null);
    
    const searchParams = {
      userLocation,
      urgency,
      filters,
      timestamp: Date.now()
    };
    setLastSearchParams(searchParams);

    try {
      console.log('🚀 화장실 검색 시작:', searchParams);
      
      const urgencyConfig = URGENCY_CONFIGS[urgency] || URGENCY_CONFIGS.moderate;
      
      // 검색 반경 계산 (필터의 maxDistance와 urgency의 radius 중 작은 값)
      const searchRadius = Math.min(
        urgencyConfig.radius,
        filters.maxDistance || 1000
      );

      // 상업시설 타입 결정
      const placeTypes = filters.includeCommercial 
        ? (urgencyConfig.placeTypes || filters.placeTypes || [])
        : [];

      console.log('📊 검색 설정:', {
        urgencyConfig,
        searchRadius,
        placeTypes,
        filters
      });

      // 화장실 검색 실행
      const result = await toiletService.searchNearbyToilets(
        userLocation.lat,
        userLocation.lng,
        urgency,
        searchRadius,
        filters,
        placeTypes
      );

      console.log('🔎 검색 결과:', result);

      if (result.success) {
        let filteredToilets = result.data.toilets || [];
        
        // 클라이언트 측 추가 필터링
        filteredToilets = filteredToilets.filter(toilet => {
          // 공중화장실 포함 여부
          if (!filters.includePublic && toilet.type === 'public') return false;
          
          // 상업시설 포함 여부
          if (!filters.includeCommercial && toilet.category === 'cafe') return false;
          
          // 무료만 필터링
          if (filters.onlyFree && !toilet.is_free) return false;
          
          // 최소 품질 점수
          if (toilet.quality_score < (filters.minQuality || 1)) return false;
          
          // 최대 거리
          if (toilet.distance > (filters.maxDistance || 1000)) return false;
          
          return true;
        });

        // 긴급도에 따른 정렬
        filteredToilets.sort((a, b) => {
          const weights = urgencyConfig.weights;
          
          // 점수 계산 (거리는 역수로 계산 - 가까울수록 높은 점수)
          const scoreA = (1000 - a.distance) * weights.distance + a.quality_score * 100 * weights.quality;
          const scoreB = (1000 - b.distance) * weights.distance + b.quality_score * 100 * weights.quality;
          
          return scoreB - scoreA; // 내림차순 정렬
        });

        console.log('✨ 필터링 및 정렬된 결과:', filteredToilets);
        setToilets(filteredToilets);

        // 검색 결과 요약 메시지
        if (result.data.sources) {
          const { public: publicCount = 0, commercial: commercialCount = 0 } = result.data.sources;
          const message = `검색 완료: 공중화장실 ${publicCount}개, 상업시설 ${commercialCount}개 발견`;
          console.log('📋 ' + message);
          
          // 성공 메시지를 일시적으로 표시
          setError(message);
          setTimeout(() => setError(null), 3000);
        }
      } else {
        console.error('❌ 검색 실패:', result.error);
        setError(`검색 실패: ${result.error || '알 수 없는 오류'}`);
        
        // Fallback 데이터가 있으면 사용
        if (result.data?.toilets) {
          console.log('📦 Fallback 데이터 사용');
          setToilets(result.data.toilets);
        }
      }
    } catch (err) {
      console.error('💥 검색 중 오류:', err);
      const errorMessage = `검색 중 오류 발생: ${err.message}\n\nGoogle Places API 키가 올바르게 설정되고 Places API가 활성화되었는지 확인해주세요.\n\nMock 데이터를 표시합니다.`;
      setError(errorMessage);
      
      // Mock 데이터 로드
      setMockData();
    } finally {
      setLoading(false);
    }
  }, []);

  // Mock 데이터 설정
  const setMockData = useCallback(() => {
    setToilets(MOCK_TOILETS);
    setError('Mock 데이터 로드됨: 공중화장실 2개, 상업시설 4개 (스타벅스, 투썸플레이스, 이디야)');
    setTimeout(() => setError(null), 4000);
  }, []);

  // 화장실 검색 재시도
  const retrySearch = useCallback(() => {
    if (lastSearchParams) {
      const { userLocation, urgency, filters } = lastSearchParams;
      searchToilets(userLocation, urgency, filters);
    }
  }, [lastSearchParams, searchToilets]);

  // 화장실 목록 클리어
  const clearToilets = useCallback(() => {
    setToilets([]);
    setError(null);
    setLastSearchParams(null);
  }, []);

  // 특정 화장실 찾기
  const findToiletById = useCallback((id) => {
    return toilets.find(toilet => toilet.id === id);
  }, [toilets]);

  // 긴급도별 화장실 필터링
  const getToiletsByUrgency = useCallback((urgency) => {
    return toilets.filter(toilet => toilet.urgency_match === urgency);
  }, [toilets]);

  // 타입별 화장실 필터링
  const getToiletsByType = useCallback((type) => {
    return toilets.filter(toilet => toilet.type === type);
  }, [toilets]);

  // 통계 정보 계산
  const stats = useMemo(() => {
    const publicCount = toilets.filter(t => t.type === 'public').length;
    const commercialCount = toilets.filter(t => t.type === 'cafe').length;
    const freeCount = toilets.filter(t => t.is_free).length;
    const averageDistance = toilets.length > 0 
      ? Math.round(toilets.reduce((sum, t) => sum + t.distance, 0) / toilets.length)
      : 0;

    return {
      total: toilets.length,
      public: publicCount,
      commercial: commercialCount,
      free: freeCount,
      paid: toilets.length - freeCount,
      averageDistance
    };
  }, [toilets]);

  return {
    // State
    toilets,
    loading,
    error,
    lastSearchParams,
    
    // Actions
    searchToilets,
    setMockData,
    retrySearch,
    clearToilets,
    
    // Utilities
    findToiletById,
    getToiletsByUrgency,
    getToiletsByType,
    
    // Computed values
    hasToilets: toilets.length > 0,
    isEmpty: toilets.length === 0 && !loading,
    stats
  };
};