/**
 * 🏪 Kakao Places API Service 
 * 카페 및 공중화장실 검색을 위한 통합 서비스
 * 한국어 키워드 기반 최적화
 */

// 카페 브랜드 설정 (한국어 키워드 우선)
const CAFE_BRANDS = {
  starbucks: {
    keywords: ['스타벅스', 'Starbucks'],
    quality_score: 3,
    color: '#00704A',
    icon: '☕'
  },
  twosome: {
    keywords: ['투썸플레이스', 'A Twosome Place', 'A TWOSOME PLACE'],
    quality_score: 3,
    color: '#8B4513',
    icon: '☕'
  },
  ediya: {
    keywords: ['이디야커피', 'EDIYA COFFEE', '이디야'],
    quality_score: 2,
    color: '#FF6B35',
    icon: '☕'
  },
  pascucci: {
    keywords: ['파스쿠찌', 'PASCUCCI'],
    quality_score: 3,
    color: '#8B0000',
    icon: '☕'
  },
  coffeebean: {
    keywords: ['커피빈', 'Coffee Bean', 'The Coffee Bean'],
    quality_score: 3,
    color: '#4B0082',
    icon: '☕'
  },
  general_cafe: {
    keywords: ['카페', 'cafe', '커피숍'],
    quality_score: 2,
    color: '#8B4513',
    icon: '☕'
  }
};

// 공중화장실 검색 키워드 (Kakao용)
const TOILET_KEYWORDS = [
  '화장실',
  '공중화장실', 
  '지하철화장실',
  '역화장실',
  '공원화장실'
];

class KakaoPlacesService {
  constructor() {
    this.places = null;
    this.geocoder = null;
    this.initialized = false;
  }

  /**
   * Kakao Places 서비스 초기화
   */
  async initialize() {
    if (this.initialized && this.places) {
      return true;
    }

    if (!window.kakao?.maps?.services) {
      throw new Error('Kakao Maps Services가 로드되지 않았습니다');
    }

    try {
      this.places = new window.kakao.maps.services.Places();
      this.geocoder = new window.kakao.maps.services.Geocoder();
      this.initialized = true;
      
      console.log('✅ Kakao Places Service 초기화 완료');
      return true;
    } catch (error) {
      console.error('❌ Kakao Places Service 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 카페 검색 (모든 브랜드)
   * @param {number} lat - 위도
   * @param {number} lng - 경도
   * @param {number} radius - 검색 반경 (미터)
   * @returns {Promise<Array>} 카페 목록
   */
  async searchCafes(lat, lng, radius = 1000) {
    console.log('☕ ===== Kakao 카페 검색 시작 =====');
    console.log('📍 검색 조건:', {
      위치: `${lat}, ${lng}`,
      반경: `${radius}m`,
      브랜드: Object.keys(CAFE_BRANDS)
    });

    await this.initialize();
    
    const allCafes = [];
    const searchResults = {};

    // 각 브랜드별 검색
    for (const [brandKey, brandConfig] of Object.entries(CAFE_BRANDS)) {
      console.log(`\n🔍 ${brandKey} 검색 중...`);
      
      try {
        const cafes = await this.searchByBrand(lat, lng, brandConfig, radius);
        searchResults[brandKey] = {
          검색된개수: cafes.length,
          성공여부: true
        };
        
        console.log(`✅ ${brandKey}: ${cafes.length}개 발견`);
        allCafes.push(...cafes);
        
      } catch (error) {
        searchResults[brandKey] = {
          검색된개수: 0,
          에러: error.message,
          성공여부: false
        };
        console.error(`❌ ${brandKey} 검색 실패:`, error.message);
      }
    }

    console.log('\n📊 카페 검색 결과:');
    console.table(searchResults);

    // 중복 제거 및 정렬
    const uniqueCafes = this.removeDuplicates(allCafes);
    const sortedCafes = this.sortByQuality(uniqueCafes, lat, lng);
    
    console.log(`🎯 최종 카페 결과: ${allCafes.length}개 → ${uniqueCafes.length}개 (중복제거) → ${sortedCafes.length}개 (정렬)`);
    console.log('☕ ===== Kakao 카페 검색 완료 =====\n');
    
    return sortedCafes;
  }

  /**
   * 브랜드별 카페 검색
   */
  async searchByBrand(lat, lng, brandConfig, radius) {
    const results = [];
    
    // 각 키워드로 검색
    for (const keyword of brandConfig.keywords) {
      try {
        const places = await this.keywordSearch(keyword, lat, lng, radius);
        
        // 브랜드명으로 필터링
        const filteredPlaces = places.filter(place => 
          this.matchesBrand(place.place_name, brandConfig.keywords)
        );
        
        results.push(...filteredPlaces.map(place => 
          this.formatCafe(place, brandConfig, lat, lng)
        ));
        
      } catch (error) {
        console.warn(`⚠️ "${keyword}" 검색 실패:`, error.message);
      }
    }
    
    return results;
  }

  /**
   * 공중화장실 검색 (Kakao Places API 사용)
   */
  async searchPublicToilets(lat, lng, radius = 1000) {
    console.log('🚽 ===== Kakao 공중화장실 검색 시작 =====');
    
    await this.initialize();
    
    const allToilets = [];
    
    for (const keyword of TOILET_KEYWORDS) {
      try {
        const places = await this.keywordSearch(keyword, lat, lng, radius);
        const toilets = places
          .filter(place => this.isToilet(place.place_name, place.category_name))
          .map(place => this.formatToilet(place, lat, lng));
        
        allToilets.push(...toilets);
        console.log(`🔍 "${keyword}": ${toilets.length}개 발견`);
        
      } catch (error) {
        console.warn(`⚠️ "${keyword}" 검색 실패:`, error.message);
      }
    }

    const uniqueToilets = this.removeDuplicates(allToilets);
    console.log(`🎯 공중화장실 결과: ${allToilets.length}개 → ${uniqueToilets.length}개`);
    console.log('🚽 ===== Kakao 공중화장실 검색 완료 =====\n');
    
    return uniqueToilets;
  }

  /**
   * 키워드 검색 (Promise 래퍼)
   */
  keywordSearch(keyword, lat, lng, radius) {
    return new Promise((resolve, reject) => {
      if (!this.places) {
        reject(new Error('Places 서비스가 초기화되지 않았습니다'));
        return;
      }

      // 검색 옵션 설정
      const options = {
        location: new window.kakao.maps.LatLng(lat, lng),
        radius: radius,
        sort: window.kakao.maps.services.SortBy.DISTANCE
      };

      this.places.keywordSearch(keyword, (data, status, pagination) => {
        if (status === window.kakao.maps.services.Status.OK) {
          // 반경 내 결과만 필터링
          const filteredData = data.filter(place => {
            const distance = this.calculateDistance(lat, lng, place.y, place.x);
            return distance <= radius;
          });
          resolve(filteredData);
          
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULTS) {
          resolve([]);
          
        } else {
          reject(new Error(`검색 실패: ${status}`));
        }
      }, options);
    });
  }

  /**
   * 브랜드 매칭 확인
   */
  matchesBrand(placeName, keywords) {
    const name = placeName.toLowerCase();
    return keywords.some(keyword => 
      name.includes(keyword.toLowerCase())
    );
  }

  /**
   * 화장실 여부 확인
   */
  isToilet(placeName, categoryName) {
    const name = placeName.toLowerCase();
    const category = categoryName ? categoryName.toLowerCase() : '';
    
    const toiletIndicators = ['화장실', 'toilet', '공중화장실', '지하철', '역사'];
    const excludeKeywords = ['카페', 'cafe', '커피', '음식점', '상점'];
    
    const hasToiletKeyword = toiletIndicators.some(keyword => 
      name.includes(keyword) || category.includes(keyword)
    );
    
    const hasExcludeKeyword = excludeKeywords.some(keyword => 
      name.includes(keyword) || category.includes(keyword)
    );
    
    return hasToiletKeyword && !hasExcludeKeyword;
  }

  /**
   * 카페 데이터 포맷팅
   */
  formatCafe(place, brandConfig, userLat, userLng) {
    const distance = this.calculateDistance(userLat, userLng, place.y, place.x);
    
    return {
      id: `kakao_cafe_${place.id}`,
      name: place.place_name,
      type: 'cafe',
      category: 'cafe',
      quality_score: this.calculateQualityScore(place, brandConfig.quality_score),
      distance: Math.round(distance),
      is_free: false, // 카페는 유료
      coordinates: {
        lat: parseFloat(place.y),
        lng: parseFloat(place.x)
      },
      address: place.address_name || place.road_address_name || '주소 없음',
      phone: place.phone || null,
      hours: '영업시간 미확인', // Kakao Places에서 영업시간 정보 제한적
      rating: 0, // 기본값
      urgency_match: distance < 300 ? 'high' : distance < 600 ? 'medium' : 'low',
      source: 'kakao_places',
      color: this.getMarkerColor(distance, brandConfig.quality_score),
      icon: brandConfig.icon
    };
  }

  /**
   * 화장실 데이터 포맷팅
   */
  formatToilet(place, userLat, userLng) {
    const distance = this.calculateDistance(userLat, userLng, place.y, place.x);
    
    return {
      id: `kakao_toilet_${place.id}`,
      name: place.place_name,
      type: 'public',
      category: 'public',
      quality_score: 1,
      distance: Math.round(distance),
      is_free: true, // 공중화장실은 무료
      coordinates: {
        lat: parseFloat(place.y),
        lng: parseFloat(place.x)
      },
      address: place.address_name || place.road_address_name || '주소 없음',
      phone: place.phone || null,
      hours: '24시간', // 대부분의 공중화장실
      facilities: {
        disabled_access: null, // Kakao에서 제공하지 않음
        baby_changing: null,
        separate_gender: true
      },
      urgency_match: distance < 300 ? 'high' : distance < 600 ? 'medium' : 'low',
      source: 'kakao_places',
      color: this.getMarkerColor(distance, 1),
      icon: '🚽'
    };
  }

  /**
   * 마커 색상 결정 (거리 + 품질 기반)
   * 빨강: 300m 이내 (가장 가까운)
   * 파랑: 300-600m (중간 거리)  
   * 초록: 600m 이상 또는 고품질 (3점 이상)
   */
  getMarkerColor(distance, qualityScore) {
    if (distance <= 300) {
      return '#DC2626'; // 빨강 - 긴급 (가장 가까운)
    } else if (distance <= 600) {
      return '#2563EB'; // 파랑 - 보통 거리
    } else {
      // 먼 거리지만 품질이 좋으면 초록, 아니면 파랑 유지
      return qualityScore >= 3 ? '#10B981' : '#2563EB'; // 초록(고품질) 또는 파랑
    }
  }

  /**
   * 품질 점수 계산
   */
  calculateQualityScore(place, baseScore) {
    let score = baseScore;
    
    // 평점이 있는 경우 (제한적)
    if (place.rating && place.rating >= 4.0) {
      score += 0.5;
    }
    
    return Math.min(5, Math.max(1, score));
  }

  /**
   * 중복 제거
   */
  removeDuplicates(places) {
    const unique = [];
    const seenNames = new Set();
    const proximityThreshold = 50; // 50미터

    for (const place of places) {
      const nameKey = place.name.toLowerCase().trim();
      
      // 이름 중복 체크
      if (seenNames.has(nameKey)) continue;
      
      // 근접 중복 체크
      const isDuplicate = unique.some(existing => {
        const distance = this.calculateDistance(
          place.coordinates.lat, place.coordinates.lng,
          existing.coordinates.lat, existing.coordinates.lng
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
   * 품질별 정렬
   */
  sortByQuality(places, userLat, userLng) {
    return places.sort((a, b) => {
      // 긴급도 우선
      const urgencyOrder = { high: 3, medium: 2, low: 1 };
      const urgencyDiff = urgencyOrder[b.urgency_match] - urgencyOrder[a.urgency_match];
      if (urgencyDiff !== 0) return urgencyDiff;
      
      // 품질 점수
      const qualityDiff = b.quality_score - a.quality_score;
      if (qualityDiff !== 0) return qualityDiff;
      
      // 거리
      return a.distance - b.distance;
    });
  }

  /**
   * 거리 계산 (Haversine 공식)
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // 지구 반지름 (미터)
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
   * 사용 가능한 브랜드 목록 반환
   */
  getAvailableBrands() {
    return Object.keys(CAFE_BRANDS).map(key => ({
      key,
      keywords: CAFE_BRANDS[key].keywords,
      quality_score: CAFE_BRANDS[key].quality_score,
      color: CAFE_BRANDS[key].color,
      icon: CAFE_BRANDS[key].icon
    }));
  }
}

// 싱글톤 인스턴스 내보내기
export const kakaoPlacesService = new KakaoPlacesService();

// 브랜드 정보 내보내기
export { CAFE_BRANDS };