import axios from 'axios';
import { placesService } from './placesService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Enhanced toilet service that combines public toilets (Seoul API) 
 * with commercial locations (Google Places API)
 */
export const toiletService = {
  /**
   * Search nearby toilets combining public and commercial sources
   * @param {number} lat - User latitude
   * @param {number} lng - User longitude  
   * @param {string} urgency - emergency, moderate, relaxed
   * @param {number} radius - Search radius in meters
   * @param {Object} filters - Search filters
   * @param {Array} placeTypes - Commercial place types to include
   * @returns {Promise<Object>} Combined search results
   */
  searchNearbyToilets: async (lat, lng, urgency = 'moderate', radius = 500, _filters = {}, placeTypes = ['starbucks']) => {
    try {
      // Execute searches in parallel for better performance
      const searchPromises = [];
      
      // 1. Search public toilets (Seoul API)
      const publicToiletsPromise = toiletService.searchPublicToilets(lat, lng, radius);
      searchPromises.push(publicToiletsPromise);
      
      // 2. Search commercial places (Google Places API) if enabled
      if (placeTypes && placeTypes.length > 0) {
        const commercialPlacesPromise = toiletService.searchCommercialPlaces(lat, lng, placeTypes, radius);
        searchPromises.push(commercialPlacesPromise);
      }
      
      // Wait for all searches to complete
      const results = await Promise.allSettled(searchPromises);
      
      let publicToilets = [];
      let commercialPlaces = [];
      
      // Process public toilets result
      if (results[0].status === 'fulfilled') {
        publicToilets = results[0].value;
      } else {
        console.error('Public toilets search failed:', results[0].reason);
      }
      
      // Process commercial places result (if searched)
      if (results.length > 1 && results[1].status === 'fulfilled') {
        commercialPlaces = results[1].value;
      } else if (results.length > 1) {
        console.error('Commercial places search failed:', results[1].reason);
      }
      
      // Combine and sort all results
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
   * Search public toilets from Seoul API (direct call) with enhanced debugging
   */
  searchPublicToilets: async (lat, lng, radius) => {
    console.log('🏛️ ===== 서울공공데이터 API 검색 시작 =====');
    console.log('📋 검색 조건:', {
      위치: `${lat}, ${lng}`,
      반경: `${radius}m`,
      시간: new Date().toLocaleTimeString()
    });
    
    try {
      const SEOUL_API_KEY = import.meta.env.VITE_SEOUL_API_KEY;
      
      // API 키 검증
      if (!SEOUL_API_KEY || SEOUL_API_KEY === 'your_seoul_api_key_here') {
        console.error('❌ 서울API 키가 설정되지 않았습니다.');
        console.error('💡 해결방법: .env 파일에서 VITE_SEOUL_API_KEY 설정');
        return [];
      }
      
      console.log('🔑 API 키 정보:', {
        키길이: SEOUL_API_KEY.length,
        첫4자: SEOUL_API_KEY.substring(0, 4) + '...',
        형식: /^[a-zA-Z0-9]+$/.test(SEOUL_API_KEY) ? '유효' : '잘못됨'
      });
      
      // 다중 URL 패턴 시도 (HTTP 우선 - SSL 문제 해결)
      const urlPatterns = [
        {
          name: 'HTTP+포트 (권장)',
          url: `http://openapi.seoul.go.kr:8088/${SEOUL_API_KEY}/json/SearchPublicToiletPOIService/1/1000/`
        },
        {
          name: 'HTTP 축소요청',
          url: `http://openapi.seoul.go.kr:8088/${SEOUL_API_KEY}/json/SearchPublicToiletPOIService/1/100/`
        },
        {
          name: '표준 HTTPS+포트',
          url: `https://openapi.seoul.go.kr:8088/${SEOUL_API_KEY}/json/SearchPublicToiletPOIService/1/1000/`
        },
        {
          name: 'HTTPS 포트없음',
          url: `https://openapi.seoul.go.kr/${SEOUL_API_KEY}/json/SearchPublicToiletPOIService/1/1000/`
        }
      ];
      
      let response = null;
      let usedPattern = null;
      
      // URL 패턴들을 순차적으로 시도
      for (const pattern of urlPatterns) {
        console.log(`🔗 ${pattern.name} 시도 중...`);
        console.log(`   URL: ${pattern.url.substring(0, 80)}...`);
        
        try {
          const startTime = Date.now();
          response = await axios.get(pattern.url, {
            timeout: 10000, // 10초 타임아웃
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'SaveMeToilet/1.0'
            }
          });
          const responseTime = Date.now() - startTime;
          
          console.log(`✅ ${pattern.name} 성공!`);
          console.log(`   응답시간: ${responseTime}ms`);
          console.log(`   상태코드: ${response.status}`);
          
          usedPattern = pattern;
          break;
          
        } catch (patternError) {
          console.warn(`⚠️ ${pattern.name} 실패:`, {
            상태: patternError.response?.status,
            메시지: patternError.message,
            코드: patternError.code
          });
          
          // 구체적인 에러 해결책 제안
          if (patternError.response?.status === 401) {
            console.error('🚫 인증 실패 - API 키 문제');
            console.error('💡 해결방법:');
            console.error('   1. https://data.seoul.go.kr/ 에서 API 키 재발급');
            console.error('   2. .env 파일의 VITE_SEOUL_API_KEY 확인');
            console.error('   3. API 키에 특수문자 포함여부 확인');
          } else if (patternError.response?.status === 403) {
            console.error('🚫 권한 없음 - 서비스 미신청');
            console.error('💡 해결방법:');
            console.error('   1. 서울열린데이터광장에서 SearchPublicToiletPOIService 신청');
            console.error('   2. 서비스 승인 상태 확인');
          } else if (patternError.code === 'NETWORK_ERROR') {
            console.error('🌐 네트워크 오류 - CORS 또는 연결 문제');
            console.error('💡 해결방법:');
            console.error('   1. 프록시 서버 사용 고려');
            console.error('   2. HTTP 대신 HTTPS 시도');
          }
          
          continue;
        }
      }
      
      // 모든 URL 패턴 실패
      if (!response) {
        console.error('❌ 모든 URL 패턴 실패');
        console.error('🔧 권장 디버깅 단계:');
        console.error('   1. 브라우저 개발자도구 → Network 탭 확인');
        console.error('   2. API 키 재발급');
        console.error('   3. 서비스 신청 상태 확인');
        return [];
      }
      
      console.log('📊 API 응답 분석:', {
        성공패턴: usedPattern.name,
        응답크기: JSON.stringify(response.data).length + ' bytes',
        응답구조: Object.keys(response.data)
      });
      
      // 응답 데이터 검증
      if (!response.data) {
        console.error('❌ 빈 응답 데이터');
        return [];
      }
      
      if (!response.data.SearchPublicToiletPOIService) {
        console.error('❌ 예상된 서비스 데이터 없음');
        console.error('📋 실제 응답 구조:', Object.keys(response.data));
        
        // 에러 응답인지 확인
        if (response.data.RESULT) {
          console.error('🚨 API 에러 응답:', response.data.RESULT);
        }
        return [];
      }
      
      const seoulData = response.data.SearchPublicToiletPOIService;
      console.log('📈 서비스 응답 분석:', {
        총개수: seoulData.list_total_count,
        반환개수: seoulData.row?.length || 0,
        결과코드: seoulData.RESULT?.CODE,
        결과메시지: seoulData.RESULT?.MESSAGE
      });
      
      const toilets = seoulData.row || [];
      
      if (toilets.length === 0) {
        console.warn('⚠️ 화장실 데이터 없음');
        if (seoulData.RESULT?.MESSAGE) {
          console.warn('📋 API 메시지:', seoulData.RESULT.MESSAGE);
        }
        return [];
      }
      
      // 데이터 품질 분석
      const qualityStats = {
        좌표있음: toilets.filter(t => t.Y_WGS84 && t.X_WGS84).length,
        이름있음: toilets.filter(t => t.FNAME).length,
        주소있음: toilets.filter(t => t.ANAME).length,
        샘플데이터: toilets.slice(0, 2).map(t => ({
          이름: t.FNAME,
          주소: t.ANAME,
          위도: t.Y_WGS84,
          경도: t.X_WGS84
        }))
      };
      
      console.log('🔍 데이터 품질 분석:', qualityStats);
      
      const processedToilets = toilets
        .filter(toilet => toilet.Y_WGS84 && toilet.X_WGS84 && toilet.FNAME) // 필수 데이터 체크
        .map((toilet) => {
          const distance = toiletService.calculateDistance(lat, lng, toilet.Y_WGS84, toilet.X_WGS84);
          const urgencyMatch = distance < 300 ? 'high' : distance < 600 ? 'medium' : 'low';
          const distanceColor = distance <= 1000 ? '#DC2626' : '#2563EB';
          
          return {
            id: `public_${toilet.POI_ID}`,
            name: toilet.FNAME,
            type: 'public',
            category: 'public',
            quality_score: toilet.ANAME?.includes('민간') ? 2 : 1,
            distance: Math.round(distance),
            is_free: true,
            coordinates: {
              lat: parseFloat(toilet.Y_WGS84),
              lng: parseFloat(toilet.X_WGS84)
            },
            address: toilet.ANAME || toilet.FNAME + ' 화장실',
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
      
      console.log('🎯 최종 처리 결과:', {
        원본데이터: toilets.length,
        유효데이터: processedToilets.length,
        평균거리: processedToilets.length > 0 ? Math.round(processedToilets.reduce((sum, t) => sum + t.distance, 0) / processedToilets.length) : 0,
        가장가까운: processedToilets.length > 0 ? Math.min(...processedToilets.map(t => t.distance)) : 0
      });
      
      if (processedToilets.length > 0) {
        console.log('🏆 상위 3개 가까운 화장실:');
        processedToilets
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 3)
          .forEach((toilet, idx) => {
            console.log(`   ${idx + 1}. ${toilet.name} (${toilet.distance}m)`);
          });
      }
      
      console.log('✅ ===== 서울공공데이터 API 검색 완료 =====\n');
      return processedToilets;
      
    } catch (error) {
      console.error('❌ ===== 서울공공데이터 API 전체 실패 =====');
      console.error('💥 최종 에러:', {
        타입: error.constructor.name,
        메시지: error.message,
        상태코드: error.response?.status,
        응답데이터: error.response?.data,
        스택: error.stack?.split('\n')[0]
      });
      
      // 최종 문제해결 가이드
      console.error('🔧 종합 문제해결 가이드:');
      console.error('   1. 브라우저 개발자도구 Network 탭에서 실제 요청 확인');
      console.error('   2. https://data.seoul.go.kr/ 에서 API 키 및 서비스 상태 확인');
      console.error('   3. 방화벽/프록시 설정으로 인한 차단 여부 확인');
      console.error('   4. 서울시 API 서버 장애 여부 확인');
      
      return [];
    }
  },

  /**
   * Search commercial places via Google Places API
   */
  searchCommercialPlaces: async (lat, lng, placeTypes, radius) => {
    try {
      const places = await placesService.searchCommercialPlaces(lat, lng, placeTypes, radius);
      return places;
    } catch (error) {
      console.error('Error searching commercial places:', error);
      return [];
    }
  },

  /**
   * Sort toilets by urgency-based algorithm
   */
  sortToiletsByUrgency: (toilets, userLat, userLng, urgency) => {
    return toilets.map(toilet => ({
      ...toilet,
      urgency_score: toiletService.calculateUrgencyScore(toilet, userLat, userLng, urgency)
    })).sort((a, b) => b.urgency_score - a.urgency_score);
  },


  // Distance calculation helper (Haversine formula)
  calculateDistance: (lat1, lng1, lat2, lng2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in meters
  },

  // Search toilets by location keyword (using Google Places)
  searchByLocation: async (query, urgency = 'moderate', radius = 1000) => {
    try {
      // Use Google Places Text Search to find location coordinates
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

  // Save user preferences to localStorage
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

  // Load user preferences from localStorage
  loadPreferences: () => {
    try {
      const saved = localStorage.getItem('toiletapp_preferences');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Error loading preferences:', error);
      return null;
    }
  },

  // Calculate urgency score for toilet ranking
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

  // Get quality level description
  getQualityDescription: (score) => {
    if (score >= 3) return { level: '⭐⭐⭐ 프리미엄', color: 'success' };
    if (score >= 2) return { level: '⭐⭐ 표준', color: 'warning' };
    return { level: '⭐ 기본', color: 'secondary' };
  },

  // Get urgency level configuration
  getUrgencyConfig: (level) => {
    const configs = {
      emergency: {
        label: '🔴 진짜 급해요!',
        radius: 300,
        color: 'danger',
        description: '가장 가까운 곳 우선',
        placeTypes: ['starbucks', 'twosome', 'ediya'] // Focus on reliable options
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

  /**
   * Get available commercial place types
   */
  getCommercialPlaceTypes: () => {
    return placesService.getAvailablePlaceTypes();
  },

  /**
   * Get combined statistics for search results
   */
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
      // Count by type
      stats.by_type[toilet.type] = (stats.by_type[toilet.type] || 0) + 1;
      
      // Count by urgency
      stats.by_urgency[toilet.urgency_match] = (stats.by_urgency[toilet.urgency_match] || 0) + 1;
      
      // Count by source
      stats.by_source[toilet.source] = (stats.by_source[toilet.source] || 0) + 1;
    });

    // Calculate average distance
    if (toilets.length > 0) {
      stats.average_distance = Math.round(
        toilets.reduce((sum, toilet) => sum + toilet.distance, 0) / toilets.length
      );
    }

    // Quality distribution
    toilets.forEach(toilet => {
      if (toilet.quality_score >= 3) stats.quality_distribution.high++;
      else if (toilet.quality_score >= 2) stats.quality_distribution.medium++;
      else stats.quality_distribution.low++;
    });

    return stats;
  }
};