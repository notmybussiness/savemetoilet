/**
 * Google Places API Service for commercial locations (Starbucks, cafes, etc.)
 * Extensible architecture supporting multiple place types
 */

// Place type configurations for extensibility
const PLACE_TYPES = {
  starbucks: {
    query: 'Starbucks near Seoul',
    type: 'cafe',
    quality_score: 3,
    category: 'cafe',
    color: '#00704A', // Starbucks green
    icon: '☕',
    is_free: false
  },
  twosome: {
    query: 'A Twosome Place near Seoul',
    type: 'cafe', 
    quality_score: 3,
    category: 'cafe',
    color: '#8B4513',
    icon: '☕',
    is_free: false
  },
  ediya: {
    query: 'EDIYA Coffee',
    type: 'restaurant',
    quality_score: 2,
    category: 'cafe', 
    color: '#FF6B35',
    icon: '☕',
    is_free: false
  },
  cafe: {
    query: 'cafe coffee',
    type: 'restaurant',
    quality_score: 2,
    category: 'cafe',
    color: '#8B4513',
    icon: '☕',
    is_free: false
  },
  department_store: {
    query: 'department store',
    type: 'shopping_mall',
    quality_score: 3,
    category: 'shopping',
    color: '#6B46C1',
    icon: '🏬',
    is_free: true
  }
};

class PlacesService {
  constructor() {
    this.service = null;
    this.map = null;
    this.initialized = false;
  }

  /**
   * Initialize Google Places service with retry logic
   */
  async initialize() {
    if (this.initialized) {
      console.log('📍 Places service 이미 초기화됨');
      return true;
    }

    try {
      console.log('⏳ Google Maps API 로딩 대기 중...');
      console.log('🔍 API 상태 확인:', {
        google: !!window.google,
        maps: !!window.google?.maps,
        places: !!window.google?.maps?.places,
        PlacesService: !!window.google?.maps?.places?.PlacesService
      });
      
      await this.waitForGoogleMaps();
      
      // Create a temporary map for Places service (required by Google)
      const mapElement = document.createElement('div');
      mapElement.style.display = 'none'; // Hide the temporary map
      document.body.appendChild(mapElement);
      
      this.map = new window.google.maps.Map(mapElement, {
        center: { lat: 37.5665, lng: 126.9780 }, // Seoul center
        zoom: 15
      });

      this.service = new window.google.maps.places.PlacesService(this.map);
      this.initialized = true;
      
      console.log('✅ Places service 초기화 완료');
      console.log('📋 사용 가능한 Places 메서드:', Object.keys(this.service));
      return true;
    } catch (error) {
      console.error('❌ Places service 초기화 실패:', error);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Wait for Google Maps API to load with better error handling
   */
  async waitForGoogleMaps() {
    // Check if already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      return Promise.resolve();
    }

    let attempts = 0;
    const maxAttempts = 50; // 5 seconds with 100ms intervals

    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        attempts++;
        
        if (window.google && window.google.maps && window.google.maps.places) {
          clearInterval(checkInterval);
          console.log('✅ Google Maps API 로드 완료');
          resolve();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.error('❌ Google Maps API 로드 타임아웃');
          reject(new Error('Google Maps API failed to load within 5 seconds'));
        }
      }, 100);
    });
  }

  /**
   * Search for commercial places using Places API (Legacy 방식)
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude  
   * @param {Array} placeTypes - Array of place type keys
   * @param {number} radius - Search radius in meters
   * @returns {Promise<Array>} Array of places
   */
  async searchCommercialPlaces(lat, lng, placeTypes = ['starbucks'], radius = 1000) {
    console.log('🔍 Places API 검색 시작:', { lat, lng, placeTypes, radius });
    
    try {
      // Places API 초기화 확인
      if (!await this.initialize()) {
        console.log('⚠️ Places API 초기화 실패');
        return [];
      }

      const allPlaces = [];
      
      // 각 place type별로 검색
      for (const placeType of placeTypes) {
        const config = PLACE_TYPES[placeType];
        if (!config) continue;
        
        console.log(`🎯 ${config.query} 검색 중...`);
        
        try {
          const places = await this.searchPlacesByType(lat, lng, config, radius);
          console.log(`✅ ${config.query}: ${places.length}개 발견`);
          allPlaces.push(...places);
        } catch (searchError) {
          console.error(`❌ ${config.query} 검색 실패:`, searchError);
        }
      }

      const uniquePlaces = this.removeDuplicates(allPlaces);
      const sortedPlaces = this.sortPlacesByQuality(uniquePlaces, lat, lng);
      
      console.log('🎉 전체 검색 완료:', sortedPlaces.length, '개');
      return sortedPlaces;
      
    } catch (error) {
      console.error('❌ Places API 전체 오류:', error);
      return [];
    }
  }

  /**
   * Search places by specific type configuration using nearbySearch
   */
  searchPlacesByType(lat, lng, config, radius) {
    return new Promise((resolve, reject) => {
      if (!this.service) {
        console.error('❌ PlacesService가 초기화되지 않음');
        resolve([]);
        return;
      }

      // nearbySearch를 사용하고 keyword로 브랜드명 검색
      const request = {
        location: new window.google.maps.LatLng(lat, lng),
        radius: radius,
        keyword: config.query.split(' ')[0], // "Starbucks", "A" 등 브랜드명만
        type: ['restaurant', 'cafe']
      };

      console.log(`🎯 ${config.query} 검색 요청:`, request);
      console.log(`📍 검색 위치:`, `${lat}, ${lng}, 반경: ${radius}m`);

      this.service.nearbySearch(request, (results, status) => {
        console.log(`📋 ${config.query} 검색 상태:`, status);
        console.log(`🔍 가능한 상태들:`, {
          OK: window.google.maps.places.PlacesServiceStatus.OK,
          ZERO_RESULTS: window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS,
          OVER_QUERY_LIMIT: window.google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT,
          REQUEST_DENIED: window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED,
          INVALID_REQUEST: window.google.maps.places.PlacesServiceStatus.INVALID_REQUEST
        });
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          console.log(`📍 ${config.query} 원본 결과 개수:`, results.length);
          
          // 브랜드명으로 필터링
          const brandName = config.query.split(' ')[0].toLowerCase();
          const filteredResults = results.filter(place => 
            place.name.toLowerCase().includes(brandName) || 
            place.name.toLowerCase().includes(config.query.toLowerCase().split(' ')[0])
          );
          
          console.log(`🗂️ 필터링된 결과:`, filteredResults.length);
          if (filteredResults.length > 0) {
            console.log(`🗂️ 첫 번째 결과 샘플:`, filteredResults[0]);
          }
          
          const places = filteredResults.map(place => this.formatPlace(place, config, lat, lng));
          console.log(`✨ ${config.query} 포맷된 결과:`, places.length, '개');
          resolve(places);
        } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          console.log(`📭 ${config.query}: 결과 없음`);
          resolve([]);
        } else if (status === window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
          console.error(`🚫 ${config.query}: API 키 또는 권한 문제`);
          resolve([]);
        } else if (status === window.google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
          console.error(`⏰ ${config.query}: API 호출 한도 초과`);
          resolve([]);
        } else {
          console.error(`💥 ${config.query} 검색 실패 상태:`, status);
          resolve([]); // 에러 대신 빈 배열 반환
        }
      });
    });
  }

  /**
   * Format New Places API result to our standard format
   */
  formatNewPlace(place, config, userLat, userLng) {
    const distance = this.calculateDistance(
      userLat, 
      userLng, 
      place.location.lat(), 
      place.location.lng()
    );

    // 거리 기반 색상 결정: 1km 이내 빨간색, 1km 밖 파란색
    const distanceColor = distance <= 1000 ? '#DC2626' : '#2563EB';

    // Determine urgency match based on distance
    const urgencyMatch = distance < 300 ? 'high' : distance < 600 ? 'medium' : 'low';

    return {
      id: `${config.category}_${place.id || Math.random()}`,
      name: place.displayName || place.name || '이름 없음',
      type: config.category,
      category: config.category,
      quality_score: this.calculateNewQualityScore(place, config),
      distance: Math.round(distance),
      is_free: config.is_free,
      coordinates: {
        lat: place.location.lat(),
        lng: place.location.lng()
      },
      address: place.formattedAddress || '주소 없음',
      phone: null,
      hours: place.regularOpeningHours?.weekdayDescriptions?.join(', ') || '영업시간 미확인',
      rating: place.rating || 0,
      place_id: place.id,
      facilities: {
        disabled_access: null,
        baby_changing: null,
        separate_gender: true,
        wifi: null,
        parking: null
      },
      urgency_match: urgencyMatch,
      source: 'google_places_new',
      color: distanceColor, // 거리 기반 색상
      icon: config.icon
    };
  }

  /**
   * Format Old Places API result to our standard format (Legacy)
   */
  formatPlace(place, config, userLat, userLng) {
    const distance = this.calculateDistance(
      userLat, 
      userLng, 
      place.geometry.location.lat(), 
      place.geometry.location.lng()
    );

    // Determine urgency match based on distance
    const urgencyMatch = distance < 300 ? 'high' : distance < 600 ? 'medium' : 'low';

    return {
      id: `${config.category}_${place.place_id}`,
      name: place.name,
      type: config.category,
      category: config.category,
      quality_score: this.calculateQualityScore(place, config),
      distance: Math.round(distance),
      is_free: config.is_free,
      coordinates: {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      },
      address: place.formatted_address || place.vicinity || '주소 없음',
      phone: place.formatted_phone_number || null,
      hours: place.opening_hours?.weekday_text?.join(', ') || place.business_status || '영업시간 미확인',
      rating: place.rating || 0,
      price_level: place.price_level || 0,
      photo_url: place.photos?.[0]?.getUrl({ maxWidth: 400 }) || null,
      place_id: place.place_id,
      facilities: {
        disabled_access: place.accessibility?.wheelchair_accessible_entrance || null,
        baby_changing: null, // Not available in Places API
        separate_gender: true, // Assume true for commercial places
        wifi: place.types?.includes('wifi') || null,
        parking: place.types?.includes('parking') || null
      },
      urgency_match: urgencyMatch,
      source: 'google_places',
      color: config.color,
      icon: config.icon
    };
  }

  /**
   * Calculate quality score for New Places API
   */
  calculateNewQualityScore(place, config) {
    let score = config.quality_score;
    
    // Adjust based on rating
    if (place.rating >= 4.5) score += 0.5;
    else if (place.rating >= 4.0) score += 0.3;
    else if (place.rating < 3.0) score -= 0.3;
    
    return Math.min(5, Math.max(1, score));
  }

  /**
   * Calculate quality score based on Google Places data (Legacy)
   */
  calculateQualityScore(place, config) {
    let score = config.quality_score;
    
    // Adjust based on rating
    if (place.rating >= 4.5) score += 0.5;
    else if (place.rating >= 4.0) score += 0.3;
    else if (place.rating < 3.0) score -= 0.3;
    
    // Adjust based on price level (lower price = higher score for toilets)
    if (place.price_level <= 2) score += 0.2;
    
    return Math.min(5, Math.max(1, score));
  }

  /**
   * Remove duplicate places based on name and proximity
   */
  removeDuplicates(places) {
    const unique = [];
    const seenNames = new Set();
    const proximityThreshold = 50; // 50 meters
    
    for (const place of places) {
      const nameKey = place.name.toLowerCase().trim();
      
      // Check for exact name duplicates
      if (seenNames.has(nameKey)) {
        continue;
      }
      
      // Check for proximity duplicates
      const isDuplicate = unique.some(existing => {
        const distance = this.calculateDistance(
          place.coordinates.lat,
          place.coordinates.lng,
          existing.coordinates.lat,
          existing.coordinates.lng
        );
        return distance < proximityThreshold && 
               existing.name.toLowerCase().includes(nameKey.split(' ')[0]);
      });
      
      if (!isDuplicate) {
        unique.push(place);
        seenNames.add(nameKey);
      }
    }
    
    return unique;
  }

  /**
   * Sort places by distance and quality
   */
  sortPlacesByQuality(places, _userLat, _userLng) {
    return places.sort((a, b) => {
      // Primary: urgency match (high > medium > low)
      const urgencyOrder = { high: 3, medium: 2, low: 1 };
      const urgencyDiff = urgencyOrder[b.urgency_match] - urgencyOrder[a.urgency_match];
      if (urgencyDiff !== 0) return urgencyDiff;
      
      // Secondary: quality score
      const qualityDiff = b.quality_score - a.quality_score;
      if (qualityDiff !== 0) return qualityDiff;
      
      // Tertiary: distance
      return a.distance - b.distance;
    });
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Get available place types for UI
   */
  getAvailablePlaceTypes() {
    return Object.keys(PLACE_TYPES).map(key => ({
      key,
      ...PLACE_TYPES[key]
    }));
  }

  /**
   * Get place type configuration
   */
  getPlaceTypeConfig(type) {
    return PLACE_TYPES[type] || null;
  }

}

// Export singleton instance
export const placesService = new PlacesService();

// Export place types for external use
export { PLACE_TYPES };