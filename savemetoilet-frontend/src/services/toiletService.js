import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// API service for toilet search and data management
export const toiletService = {
  // Search nearby toilets based on location and urgency
  searchNearbyToilets: async (lat, lng, urgency = 'moderate', radius = 500, filters = {}) => {
    try {
      const params = {
        lat,
        lng,
        urgency,
        radius,
        ...filters
      };

      const response = await axios.get(`${API_BASE_URL}/toilets/nearby`, { params });
      return response.data;
    } catch (error) {
      console.error('Error searching toilets:', error);
      throw error;
    }
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