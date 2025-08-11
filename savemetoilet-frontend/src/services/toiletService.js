import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// API service for toilet search and data management
export const toiletService = {
  // Search nearby toilets based on location and urgency
  searchNearbyToilets: async (lat, lng, urgency = 'moderate', radius = 500, filters = {}) => {
    try {
      // 실제 백엔드 API 호출
      const response = await axios.get(`${API_BASE_URL}/test/toilets/sample`, { 
        params: { limit: 20 }  // 20개 샘플 데이터 요청
      });
      
      if (response.data.success && response.data.data) {
        // Seoul API 응답을 프론트엔드 형식으로 변환
        const seoulData = response.data.data;
        const toilets = seoulData.SearchPublicToiletPOIService?.row || [];
        
        const transformedToilets = toilets.map((toilet, index) => {
          const distance = toiletService.calculateDistance(lat, lng, toilet.Y_WGS84, toilet.X_WGS84);
          const urgencyMatch = distance < 300 ? 'high' : distance < 600 ? 'medium' : 'low';
          
          return {
            id: toilet.POI_ID,
            name: toilet.FNAME,
            type: toilet.ANAME?.includes('민간') ? 'private' : 'public',
            category: toilet.ANAME?.includes('민간') ? 'private' : 'public',
            quality_score: toilet.ANAME?.includes('민간') ? 2 : 1,
            distance: Math.round(distance),
            is_free: !toilet.ANAME?.includes('민간'),
            coordinates: {
              lat: toilet.Y_WGS84,
              lng: toilet.X_WGS84
            },
            address: toilet.FNAME + ' 화장실',
            phone: null,
            hours: '24시간',
            facilities: {
              disabled_access: true,
              baby_changing: false,
              separate_gender: true
            },
            urgency_match: urgencyMatch
          };
        });
        
        return {
          success: true,
          data: {
            toilets: transformedToilets,
            total_count: toilets.length
          }
        };
      }
      
      throw new Error('Invalid response format');
      
    } catch (error) {
      console.error('Error searching toilets:', error);
      throw error;
    }
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

  // Search toilets by location keyword
  searchByLocation: async (query, urgency = 'moderate', radius = 1000) => {
    try {
      const params = { query, urgency, radius };
      const response = await axios.get(`${API_BASE_URL}/locations/search`, { params });
      return response.data;
    } catch (error) {
      console.error('Error searching by location:', error);
      throw error;
    }
  },

  // Save user preferences
  savePreferences: async (preferences) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/user/preferences`, preferences);
      return response.data;
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw error;
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
        description: '가장 가까운 곳 우선'
      },
      moderate: {
        label: '🟡 좀 급해요',
        radius: 500,
        color: 'warning',
        description: '거리와 품질 균형'
      },
      relaxed: {
        label: '🟢 여유있어요',
        radius: 1000,
        color: 'success',
        description: '깨끗한 곳 우선'
      }
    };
    
    return configs[level] || configs.moderate;
  }
};