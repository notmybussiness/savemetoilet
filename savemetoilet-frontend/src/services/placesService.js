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
    console.log('🔍 ===== Places API 검색 시작 =====');
    console.log('📍 검색 조건:', { 
      위치: `${lat}, ${lng}`, 
      반경: `${radius}m`, 
      브랜드: placeTypes,
      검색시간: new Date().toLocaleTimeString()
    });
    
    try {
      // Places API 초기화 확인
      if (!await this.initialize()) {
        console.warn('⚠️ Places API 초기화 실패 - 빈 결과 반환');
        return [];
      }
      console.log('✅ Places API 초기화 완료');

      const allPlaces = [];
      const searchResults = {};
      
      // 각 place type별로 검색
      for (let i = 0; i < placeTypes.length; i++) {
        const placeType = placeTypes[i];
        const config = PLACE_TYPES[placeType];
        
        if (!config) {
          console.warn(`⚠️ 알 수 없는 place type: ${placeType}`);
          continue;
        }
        
        console.log(`\n🎯 [${i+1}/${placeTypes.length}] ${config.query} 검색 시작...`);
        console.log(`   검색 키워드: "${config.query.split(' ')[0]}"`);
        console.log(`   카테고리: ${config.category}`);
        
        try {
          const startTime = Date.now();
          const places = await this.searchPlacesByType(lat, lng, config, radius);
          const searchTime = Date.now() - startTime;
          
          searchResults[placeType] = {
            검색된개수: places.length,
            검색시간: `${searchTime}ms`,
            성공여부: true
          };
          
          console.log(`✅ ${config.query} 검색 완료:`);
          console.log(`   📊 결과: ${places.length}개 발견`);
          console.log(`   ⏱️ 소요시간: ${searchTime}ms`);
          
          if (places.length > 0) {
            console.log(`   📋 발견된 장소들:`, places.map(p => `${p.name} (${p.distance}m)`).join(', '));
          }
          
          allPlaces.push(...places);
        } catch (searchError) {
          searchResults[placeType] = {
            검색된개수: 0,
            에러메시지: searchError.message,
            성공여부: false
          };
          console.error(`❌ ${config.query} 검색 실패:`, searchError.message);
        }
      }

      console.log('\n🔄 검색 결과 후처리 시작...');
      console.log(`   원본 결과 수: ${allPlaces.length}개`);
      
      const uniquePlaces = this.removeDuplicates(allPlaces);
      console.log(`   중복 제거 후: ${uniquePlaces.length}개`);
      
      const sortedPlaces = this.sortPlacesByQuality(uniquePlaces, lat, lng);
      console.log(`   정렬 완료: ${sortedPlaces.length}개`);
      
      console.log('\n📊 ===== 최종 검색 통계 =====');
      console.table(searchResults);
      
      console.log('🎯 최종 결과 요약:');
      console.log(`   📍 총 발견: ${sortedPlaces.length}개`);
      console.log(`   🏆 최고 품질: ${Math.max(...sortedPlaces.map(p => p.quality_score || 0))}점`);
      console.log(`   📏 최단 거리: ${Math.min(...sortedPlaces.map(p => p.distance || Infinity))}m`);
      
      if (sortedPlaces.length > 0) {
        console.log('🏅 상위 3개 추천:');
        sortedPlaces.slice(0, 3).forEach((place, idx) => {
          console.log(`   ${idx+1}. ${place.name} (${place.distance}m, ⭐${place.quality_score})`);
        });
      }
      
      console.log('🎉 ===== Places API 검색 완료 =====\n');
      return sortedPlaces;
      
    } catch (error) {
      console.error('❌ ===== Places API 전체 검색 실패 =====');
      console.error('💥 에러 상세:', {
        메시지: error.message,
        스택: error.stack,
        시간: new Date().toLocaleTimeString()
      });
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
        const statusMessages = {
          [window.google.maps.places.PlacesServiceStatus.OK]: '성공',
          [window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS]: '결과없음',
          [window.google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT]: '호출한도초과',
          [window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED]: '요청거부',
          [window.google.maps.places.PlacesServiceStatus.INVALID_REQUEST]: '잘못된요청'
        };
        
        console.log(`      📡 API 응답 상태: ${statusMessages[status] || status}`);
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          console.log(`      📍 Google Places 원본 결과: ${results.length}개`);
          
          if (results.length > 0) {
            console.log(`      📋 원본 결과 샘플:`, results.slice(0, 3).map(place => ({
              이름: place.name,
              평점: place.rating,
              타입: place.types?.slice(0, 3),
              영업상태: place.business_status
            })));
          }
          
          // 브랜드명으로 필터링
          const brandName = config.query.split(' ')[0].toLowerCase();
          console.log(`      🔍 브랜드 필터링 키워드: "${brandName}"`);
          
          const filteredResults = results.filter(place => {
            const placeName = place.name.toLowerCase();
            const matches = placeName.includes(brandName) || 
                           placeName.includes(config.query.toLowerCase().split(' ')[0]);
            
            if (matches) {
              console.log(`      ✅ 매치: "${place.name}" (${place.rating}⭐, ${Math.round(this.calculateDistance(lat, lng, place.geometry.location.lat(), place.geometry.location.lng()))}m)`);
            }
            return matches;
          });
          
          console.log(`      🎯 브랜드 필터링 결과: ${results.length}개 → ${filteredResults.length}개`);
          
          if (filteredResults.length === 0 && results.length > 0) {
            console.warn(`      ⚠️ 필터링으로 인해 모든 결과가 제거됨!`);
            console.warn(`      🔍 원본 장소명들:`, results.slice(0, 5).map(p => p.name));
          }
          
          const places = filteredResults.map(place => {
            const formatted = this.formatPlace(place, config, lat, lng);
            console.log(`      ✨ 포맷: ${formatted.name} → 거리:${formatted.distance}m, 품질:${formatted.quality_score}, 긴급도:${formatted.urgency_match}`);
            return formatted;
          });
          
          console.log(`      🏁 최종 결과: ${places.length}개 장소`);
          resolve(places);
          
        } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          console.log(`      📭 ${config.query}: 검색 결과 없음 (반경 ${radius}m 내에 해당 브랜드 없음)`);
          resolve([]);
        } else if (status === window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
          console.error(`      🚫 ${config.query}: API 요청 거부됨`);
          console.error(`      💡 해결방법: Google Cloud Console에서 Places API 활성화 및 API 키 권한 확인`);
          resolve([]);
        } else if (status === window.google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
          console.error(`      ⏰ ${config.query}: API 호출 한도 초과`);
          console.error(`      💡 해결방법: API 키 결제 설정 확인 또는 잠시 후 재시도`);
          resolve([]);
        } else if (status === window.google.maps.places.PlacesServiceStatus.INVALID_REQUEST) {
          console.error(`      💥 ${config.query}: 잘못된 요청`);
          console.error(`      📋 요청 파라미터:`, request);
          resolve([]);
        } else {
          console.error(`      ❓ ${config.query}: 알 수 없는 상태 - ${status}`);
          resolve([]);
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
    console.log(`   🔄 중복 제거 시작: ${places.length}개 처리`);
    
    const unique = [];
    const seenNames = new Set();
    const proximityThreshold = 50; // 50 meters
    const duplicates = [];
    
    for (const place of places) {
      const nameKey = place.name.toLowerCase().trim();
      
      // Check for exact name duplicates
      if (seenNames.has(nameKey)) {
        duplicates.push({ 이유: '동일이름', 장소: place.name });
        continue;
      }
      
      // Check for proximity duplicates
      const proximateDuplicate = unique.find(existing => {
        const distance = this.calculateDistance(
          place.coordinates.lat,
          place.coordinates.lng,
          existing.coordinates.lat,
          existing.coordinates.lng
        );
        return distance < proximityThreshold && 
               existing.name.toLowerCase().includes(nameKey.split(' ')[0]);
      });
      
      if (proximateDuplicate) {
        duplicates.push({ 
          이유: '근접위치', 
          장소: place.name, 
          기존장소: proximateDuplicate.name,
          거리: Math.round(this.calculateDistance(
            place.coordinates.lat, place.coordinates.lng,
            proximateDuplicate.coordinates.lat, proximateDuplicate.coordinates.lng
          ))
        });
        continue;
      }
      
      unique.push(place);
      seenNames.add(nameKey);
    }
    
    console.log(`   ✅ 중복 제거 완료: ${places.length}개 → ${unique.length}개`);
    if (duplicates.length > 0) {
      console.log(`   🗑️ 제거된 중복 ${duplicates.length}개:`, duplicates);
    }
    
    return unique;
  }

  /**
   * Sort places by distance and quality
   */
  sortPlacesByQuality(places, _userLat, _userLng) {
    console.log(`   📊 정렬 시작: ${places.length}개 장소`);
    
    // 정렬 전 통계
    const beforeStats = {
      긴급도별: { high: 0, medium: 0, low: 0 },
      평균거리: places.length > 0 ? Math.round(places.reduce((sum, p) => sum + p.distance, 0) / places.length) : 0,
      평균품질: places.length > 0 ? (places.reduce((sum, p) => sum + p.quality_score, 0) / places.length).toFixed(1) : 0
    };
    
    places.forEach(p => beforeStats.긴급도별[p.urgency_match]++);
    console.log(`   📈 정렬 전 통계:`, beforeStats);
    
    const sorted = places.sort((a, b) => {
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
    
    console.log(`   🏆 정렬 완료: 긴급도 > 품질 > 거리 순`);
    if (sorted.length > 0) {
      console.log(`   🥇 1위: ${sorted[0].name} (${sorted[0].urgency_match}, ⭐${sorted[0].quality_score}, ${sorted[0].distance}m)`);
      if (sorted.length > 1) {
        console.log(`   🥈 2위: ${sorted[1].name} (${sorted[1].urgency_match}, ⭐${sorted[1].quality_score}, ${sorted[1].distance}m)`);
      }
      if (sorted.length > 2) {
        console.log(`   🥉 3위: ${sorted[2].name} (${sorted[2].urgency_match}, ⭐${sorted[2].quality_score}, ${sorted[2].distance}m)`);
      }
    }
    
    return sorted;
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