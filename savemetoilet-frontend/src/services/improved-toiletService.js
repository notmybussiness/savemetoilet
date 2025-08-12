import axios from 'axios';
import { placesService } from './placesService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * 서울공공데이터 API 디버깅 시스템
 */
const SeoulAPIDebugger = {
  /**
   * API 키 유효성 검증
   */
  validateApiKey: (apiKey) => {
    const validations = {
      exists: !!apiKey,
      length: apiKey ? apiKey.length : 0,
      format: apiKey ? /^[a-zA-Z0-9]+$/.test(apiKey) : false,
      expectedLength: apiKey ? apiKey.length >= 20 && apiKey.length <= 50 : false
    };

    console.log('🔍 API Key 유효성 검사:', {
      key: apiKey ? `${apiKey.substring(0, 6)}...${apiKey.slice(-4)}` : 'NULL',
      ...validations
    });

    return validations;
  },

  /**
   * API 응답 상태 분석
   */
  analyzeResponse: (response, error = null) => {
    if (error) {
      console.error('❌ Seoul API 오류 분석:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      return { success: false, error: error.message };
    }

    if (response?.data?.SearchPublicToiletPOIService) {
      const service = response.data.SearchPublicToiletPOIService;
      console.log('✅ Seoul API 응답 성공:', {
        list_total_count: service.list_total_count,
        result_code: service.RESULT?.CODE,
        result_message: service.RESULT?.MESSAGE,
        row_count: service.row?.length || 0
      });
      return { success: true, data: service };
    } else {
      console.error('⚠️ 예상치 못한 응답 구조:', response?.data);
      return { success: false, error: 'Unexpected response structure' };
    }
  },

  /**
   * 일반적인 Seoul API 오류 해결책 제안
   */
  suggestSolution: (error) => {
    const solutions = {
      401: {
        problem: 'API 키 인증 실패',
        solutions: [
          '1. API 키 재발급 (https://data.seoul.go.kr/)',
          '2. 환경변수 VITE_SEOUL_API_KEY 확인',
          '3. API 키 형식 검증 (영문, 숫자만 허용)'
        ]
      },
      403: {
        problem: '서비스 사용 권한 없음',
        solutions: [
          '1. 서울공공데이터 포털에서 서비스 신청 확인',
          '2. API 키 활성화 상태 확인',
          '3. 일일 요청 한도 초과 여부 확인'
        ]
      },
      404: {
        problem: '서비스 URL 오류',
        solutions: [
          '1. 서비스명 확인: SearchPublicToiletPOIService',
          '2. URL 구조 재확인',
          '3. API 버전 확인'
        ]
      },
      500: {
        problem: '서버 내부 오류',
        solutions: [
          '1. 요청 매개변수 검증',
          '2. 데이터 범위 축소 (1/1000 → 1/100)',
          '3. 잠시 후 재시도'
        ]
      }
    };

    const status = error.response?.status;
    const suggestion = solutions[status];
    
    if (suggestion) {
      console.log(`💡 해결책 제안 (HTTP ${status}):`, suggestion);
    }
    
    return suggestion;
  }
};

/**
 * Enhanced toilet service with comprehensive Seoul API debugging
 */
export const toiletService = {
  /**
   * 향상된 서울 공공화장실 검색 (완전 디버깅 버전)
   */
  searchPublicToiletsWithDebug: async (lat, lng, radius) => {
    console.log('🚀 Seoul API 요청 시작');
    
    try {
      const SEOUL_API_KEY = import.meta.env.VITE_SEOUL_API_KEY;
      
      // 1. API 키 유효성 검증
      const keyValidation = SeoulAPIDebugger.validateApiKey(SEOUL_API_KEY);
      if (!keyValidation.exists) {
        throw new Error('Seoul API Key가 환경변수에 설정되지 않았습니다');
      }

      // 2. 다양한 URL 패턴 시도
      const urlPatterns = [
        // 표준 패턴 (현재)
        `https://openapi.seoul.go.kr:8088/${SEOUL_API_KEY}/json/SearchPublicToiletPOIService/1/1000/`,
        
        // 포트 없는 패턴
        `https://openapi.seoul.go.kr/${SEOUL_API_KEY}/json/SearchPublicToiletPOIService/1/1000/`,
        
        // HTTP 패턴 (CORS 우회 시도)
        `http://openapi.seoul.go.kr:8088/${SEOUL_API_KEY}/json/SearchPublicToiletPOIService/1/1000/`,
        
        // 축소된 데이터 요청
        `https://openapi.seoul.go.kr:8088/${SEOUL_API_KEY}/json/SearchPublicToiletPOIService/1/100/`
      ];

      console.log('🔗 시도할 URL 패턴들:');
      urlPatterns.forEach((url, index) => {
        console.log(`   ${index + 1}. ${url.replace(SEOUL_API_KEY, '[API_KEY]')}`);
      });

      let lastError = null;

      // 3. URL 패턴 순차 시도
      for (let i = 0; i < urlPatterns.length; i++) {
        const seoulApiUrl = urlPatterns[i];
        console.log(`\n📡 패턴 ${i + 1} 시도 중...`);

        try {
          const startTime = Date.now();
          
          // 요청 설정 (타임아웃 및 헤더 최적화)
          const config = {
            timeout: 10000, // 10초 타임아웃
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'SaveMeToilet/1.0'
            }
          };

          const response = await axios.get(seoulApiUrl, config);
          const responseTime = Date.now() - startTime;

          console.log(`⏱️ 응답 시간: ${responseTime}ms`);

          // 4. 응답 분석
          const analysis = SeoulAPIDebugger.analyzeResponse(response);
          
          if (analysis.success) {
            const toilets = analysis.data.row || [];
            
            // 5. 데이터 품질 검증
            console.log('📊 데이터 품질 분석:', {
              total_received: toilets.length,
              has_coordinates: toilets.filter(t => t.Y_WGS84 && t.X_WGS84).length,
              has_name: toilets.filter(t => t.FNAME).length,
              sample_data: toilets.slice(0, 2).map(t => ({
                name: t.FNAME,
                lat: t.Y_WGS84,
                lng: t.X_WGS84,
                address: t.ANAME
              }))
            });

            // 6. 지리적 필터링 및 거리 계산
            const processedToilets = toilets
              .filter(toilet => toilet.Y_WGS84 && toilet.X_WGS84) // 좌표 있는 것만
              .map((toilet) => {
                const distance = toiletService.calculateDistance(
                  lat, lng, toilet.Y_WGS84, toilet.X_WGS84
                );
                
                const urgencyMatch = distance < 300 ? 'high' : distance < 600 ? 'medium' : 'low';
                const distanceColor = distance <= 1000 ? '#DC2626' : '#2563EB';
                
                return {
                  id: `public_${toilet.POI_ID}`,
                  name: toilet.FNAME || '공공화장실',
                  type: 'public',
                  category: 'public',
                  quality_score: toilet.ANAME?.includes('민간') ? 2 : 1,
                  distance: Math.round(distance),
                  is_free: true,
                  coordinates: {
                    lat: parseFloat(toilet.Y_WGS84),
                    lng: parseFloat(toilet.X_WGS84)
                  },
                  address: toilet.FNAME + ' 화장실',
                  phone: null,
                  hours: '24시간',
                  facilities: {
                    disabled_access: true,
                    baby_changing: false,
                    separate_gender: true
                  },
                  urgency_match: urgencyMatch,
                  source: 'seoul_api',
                  color: distanceColor,
                  icon: '🚽'
                };
              });

            console.log(`✅ 성공! 처리된 화장실: ${processedToilets.length}개`);
            return processedToilets;

          } else {
            lastError = new Error(analysis.error);
            console.log(`❌ 패턴 ${i + 1} 실패, 다음 패턴 시도...`);
            continue;
          }

        } catch (error) {
          lastError = error;
          console.error(`❌ 패턴 ${i + 1} 네트워크 오류:`, error.message);
          
          // 해결책 제안
          SeoulAPIDebugger.suggestSolution(error);
          
          // 마지막 패턴이 아니면 계속 시도
          if (i < urlPatterns.length - 1) {
            console.log('⏭️ 다음 패턴 시도 중...');
            continue;
          }
        }
      }

      // 모든 패턴 실패 시
      throw new Error(`모든 Seoul API 패턴 실패. 마지막 오류: ${lastError?.message}`);

    } catch (error) {
      console.error('💥 Seoul API 완전 실패:', error);
      
      // 최종 해결책 제안
      console.log('🔧 최종 디버깅 체크리스트:');
      console.log('1. ✅ API 키 확인: https://data.seoul.go.kr/');
      console.log('2. ✅ 서비스 신청 상태 확인');
      console.log('3. ✅ 네트워크 연결 확인');
      console.log('4. ✅ CORS 정책 확인');
      console.log('5. ✅ API 서버 상태 확인');
      
      return []; // 빈 배열 반환으로 앱 동작 유지
    }
  },

  // 기존 메서드들 유지...
  searchNearbyToilets: async (lat, lng, urgency = 'moderate', radius = 500, _filters = {}, placeTypes = ['starbucks']) => {
    try {
      const searchPromises = [];
      
      // 디버깅 버전 사용
      const publicToiletsPromise = toiletService.searchPublicToiletsWithDebug(lat, lng, radius);
      searchPromises.push(publicToiletsPromise);
      
      if (placeTypes && placeTypes.length > 0) {
        const commercialPlacesPromise = toiletService.searchCommercialPlaces(lat, lng, placeTypes, radius);
        searchPromises.push(commercialPlacesPromise);
      }
      
      const results = await Promise.allSettled(searchPromises);
      
      let publicToilets = [];
      let commercialPlaces = [];
      
      if (results[0].status === 'fulfilled') {
        publicToilets = results[0].value;
      } else {
        console.error('Public toilets search failed:', results[0].reason);
      }
      
      if (results.length > 1 && results[1].status === 'fulfilled') {
        commercialPlaces = results[1].value;
      } else if (results.length > 1) {
        console.error('Commercial places search failed:', results[1].reason);
      }
      
      const allToilets = [...publicToilets, ...commercialPlaces];
      const sortedToilets = toiletService.sortToiletsByUrgency(allToilets, lat, lng, urgency);
      
      return {
        success: true,
        data: {
          toilets: sortedToilets,
          total_count: sortedToilets.length,
          sources: {
            public: publicToilets.length,
            commercial: commercialPlaces.length
          }
        }
      };
      
    } catch (error) {
      console.error('Error searching toilets:', error);
      return {
        success: false,
        error: error.message,
        data: {
          toilets: [],
          total_count: 0,
          sources: {}
        }
      };
    }
  },

  /**
   * 기존 서울 API 검색 (호환성 유지)
   */
  searchPublicToilets: async (lat, lng, radius) => {
    return await toiletService.searchPublicToiletsWithDebug(lat, lng, radius);
  },

  searchCommercialPlaces: async (lat, lng, placeTypes, radius) => {
    try {
      const places = await placesService.searchCommercialPlaces(lat, lng, placeTypes, radius);
      return places;
    } catch (error) {
      console.error('Error searching commercial places:', error);
      return [];
    }
  },

  sortToiletsByUrgency: (toilets, userLat, userLng, urgency) => {
    return toilets.map(toilet => ({
      ...toilet,
      urgency_score: toiletService.calculateUrgencyScore(toilet, userLat, userLng, urgency)
    })).sort((a, b) => b.urgency_score - a.urgency_score);
  },

  calculateDistance: (lat1, lng1, lat2, lng2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  searchByLocation: async (query, urgency = 'moderate', radius = 1000) => {
    try {
      const location = await placesService.searchLocation(query);
      if (location) {
        return await toiletService.searchNearbyToilets(
          location.lat, 
          location.lng, 
          urgency, 
          radius
        );
      }
      return { success: false, error: 'Location not found' };
    } catch (error) {
      console.error('Error searching by location:', error);
      throw error;
    }
  },

  savePreferences: (preferences) => {
    try {
      localStorage.setItem('toiletapp_preferences', JSON.stringify({
        ...preferences,
        lastUpdated: new Date().toISOString()
      }));
      return { success: true };
    } catch (error) {
      console.error('Error saving preferences:', error);
      return { success: false, error: error.message };
    }
  },

  loadPreferences: () => {
    try {
      const saved = localStorage.getItem('toiletapp_preferences');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Error loading preferences:', error);
      return null;
    }
  },

  calculateUrgencyScore: (toilet, userLat, userLng, urgency) => {
    const distance = toilet.distance || 0;
    const quality = toilet.quality_score || 1;
    
    let distanceWeight, qualityWeight;
    
    switch (urgency) {
      case 'emergency':
        distanceWeight = 0.9;
        qualityWeight = 0.1;
        break;
      case 'moderate':
        distanceWeight = 0.6;
        qualityWeight = 0.4;
        break;
      case 'relaxed':
        distanceWeight = 0.3;
        qualityWeight = 0.7;
        break;
      default:
        distanceWeight = 0.6;
        qualityWeight = 0.4;
    }
    
    const distanceScore = Math.max(0, 1000 - distance);
    const qualityScore = quality * 100;
    
    return (distanceScore * distanceWeight) + (qualityScore * qualityWeight);
  },

  getQualityDescription: (score) => {
    if (score >= 3) return { level: '⭐⭐⭐ 프리미엄', color: 'success' };
    if (score >= 2) return { level: '⭐⭐ 표준', color: 'warning' };
    return { level: '⭐ 기본', color: 'secondary' };
  },

  getUrgencyConfig: (level) => {
    const configs = {
      emergency: {
        label: '🔴 진짜 급해요!',
        radius: 300,
        color: 'danger',
        description: '가장 가까운 곳 우선',
        placeTypes: ['starbucks', 'twosome', 'ediya']
      },
      moderate: {
        label: '🟡 좀 급해요',
        radius: 500,
        color: 'warning',
        description: '거리와 품질 균형',
        placeTypes: ['starbucks', 'twosome', 'ediya', 'cafe']
      },
      relaxed: {
        label: '🟢 여유있어요',
        radius: 1000,
        color: 'success',
        description: '깨끗한 곳 우선',
        placeTypes: ['starbucks', 'twosome', 'ediya', 'cafe', 'department_store']
      }
    };
    
    return configs[level] || configs.moderate;
  },

  getCommercialPlaceTypes: () => {
    return placesService.getAvailablePlaceTypes();
  },

  getSearchStats: (toilets) => {
    const stats = {
      total: toilets.length,
      by_type: {},
      by_urgency: { high: 0, medium: 0, low: 0 },
      by_source: {},
      average_distance: 0,
      quality_distribution: { high: 0, medium: 0, low: 0 }
    };

    toilets.forEach(toilet => {
      stats.by_type[toilet.type] = (stats.by_type[toilet.type] || 0) + 1;
      stats.by_urgency[toilet.urgency_match] = (stats.by_urgency[toilet.urgency_match] || 0) + 1;
      stats.by_source[toilet.source] = (stats.by_source[toilet.source] || 0) + 1;
    });

    if (toilets.length > 0) {
      stats.average_distance = Math.round(
        toilets.reduce((sum, toilet) => sum + toilet.distance, 0) / toilets.length
      );
    }

    toilets.forEach(toilet => {
      if (toilet.quality_score >= 3) stats.quality_distribution.high++;
      else if (toilet.quality_score >= 2) stats.quality_distribution.medium++;
      else stats.quality_distribution.low++;
    });

    return stats;
  }
};