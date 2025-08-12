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
   * Search public toilets from Seoul API (direct call)
   */
  searchPublicToilets: async (lat, lng, radius) => {
    try {
      const SEOUL_API_KEY = import.meta.env.VITE_SEOUL_API_KEY;
      const seoulApiUrl = `https://openapi.seoul.go.kr:8088/${SEOUL_API_KEY}/json/SearchPublicToiletPOIService/1/1000/`;
      
      const response = await axios.get(seoulApiUrl);
      
      if (response.data && response.data.SearchPublicToiletPOIService) {
        const seoulData = response.data.SearchPublicToiletPOIService;
        const toilets = seoulData.row || [];
        
        return toilets.map((toilet) => {
          const distance = toiletService.calculateDistance(lat, lng, toilet.Y_WGS84, toilet.X_WGS84);
          const urgencyMatch = distance < 300 ? 'high' : distance < 600 ? 'medium' : 'low';
          
          return {
            id: `public_${toilet.POI_ID}`,
            name: toilet.FNAME,
            type: 'public',
            category: 'public',
            quality_score: toilet.ANAME?.includes('민간') ? 2 : 1,
            distance: Math.round(distance),
            is_free: true,
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
            urgency_match: urgencyMatch,
            source: 'seoul_api',
            color: '#28a745', // Green for public
            icon: '🚽'
          };
        }).filter(toilet => toilet.distance <= radius);
      }
      
      return [];
    } catch (error) {
      console.error('Error searching public toilets:', error);
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