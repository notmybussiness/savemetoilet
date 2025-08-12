// =================================================================
// 🚀 SaveMeToilet Constants & Configuration
// =================================================================

// Default coordinates (Seoul City Hall)
export const DEFAULT_LOCATION = {
  lat: 37.5665,
  lng: 126.9780
};

// Search configuration
export const SEARCH_CONFIG = {
  DEFAULT_RADIUS: 500,
  MAX_RESULTS: 50,
  MIN_ZOOM: 12,
  MAX_ZOOM: 18,
  DEFAULT_ZOOM: 15
};

// Urgency configurations
export const URGENCY_CONFIGS = {
  emergency: {
    radius: 300,
    color: '#dc3545',
    icon: '🚨',
    label: '응급',
    description: '300m 이내 즉시 필요',
    placeTypes: ['starbucks', 'twosome', 'ediya'],
    weights: { distance: 0.9, quality: 0.1 }
  },
  moderate: {
    radius: 500,
    color: '#ffc107',
    icon: '⏰',
    label: '보통',
    description: '500m 이내 적당히 급함',
    placeTypes: ['starbucks', 'twosome', 'ediya'],
    weights: { distance: 0.6, quality: 0.4 }
  },
  relaxed: {
    radius: 1000,
    color: '#28a745',
    icon: '🚶',
    label: '여유',
    description: '1km 이내 시간 여유',
    placeTypes: ['starbucks', 'twosome', 'ediya', 'cafe'],
    weights: { distance: 0.3, quality: 0.7 }
  }
};

// Default search filters
export const DEFAULT_SEARCH_FILTERS = {
  includeCommercial: true,
  includePublic: true,
  maxDistance: 1000,
  minQuality: 1,
  onlyFree: false,
  placeTypes: ['starbucks', 'twosome', 'ediya']
};

// Mock toilet data for development
export const MOCK_TOILETS = [
  {
    id: 'mock_starbucks_1',
    name: '스타벅스 강남역점',
    type: 'cafe',
    category: 'cafe',
    quality_score: 3,
    distance: 150,
    is_free: false,
    coordinates: { lat: 37.5665 + 0.001, lng: 126.9780 + 0.001 },
    address: '서울시 강남구 강남대로 396',
    phone: '02-1234-5678',
    hours: '06:00-22:00',
    facilities: {
      disabled_access: true,
      baby_changing: true,
      separate_gender: true,
      wifi: true,
      parking: false
    },
    urgency_match: 'high',
    source: 'mock_places',
    color: '#00704A',
    icon: '☕',
    rating: 4.5
  },
  {
    id: 'mock_starbucks_2',
    name: '스타벅스 명동점',
    type: 'cafe', 
    category: 'cafe',
    quality_score: 3,
    distance: 220,
    is_free: false,
    coordinates: { lat: 37.5665 + 0.002, lng: 126.9780 - 0.001 },
    address: '서울시 중구 명동길 123',
    phone: '02-2345-6789',
    hours: '06:30-22:30',
    facilities: {
      disabled_access: true,
      baby_changing: true,
      separate_gender: true,
      wifi: true,
      parking: true
    },
    urgency_match: 'high',
    source: 'mock_places',
    color: '#00704A',
    icon: '☕',
    rating: 4.3
  },
  {
    id: 'mock_twosome_1',
    name: 'A Twosome Place 시청점',
    type: 'cafe',
    category: 'cafe', 
    quality_score: 3,
    distance: 180,
    is_free: false,
    coordinates: { lat: 37.5665 - 0.001, lng: 126.9780 + 0.001 },
    address: '서울시 중구 세종대로 110',
    phone: '02-3456-7890',
    hours: '07:00-23:00',
    facilities: {
      disabled_access: true,
      baby_changing: true,
      separate_gender: true,
      wifi: true,
      parking: false
    },
    urgency_match: 'high',
    source: 'mock_places',
    color: '#8B4513',
    icon: '☕',
    rating: 4.2
  },
  {
    id: 'mock_ediya_1',
    name: 'EDIYA Coffee 종각점',
    type: 'cafe',
    category: 'cafe',
    quality_score: 2,
    distance: 320,
    is_free: false,
    coordinates: { lat: 37.5665 + 0.003, lng: 126.9780 + 0.002 },
    address: '서울시 종로구 종로 51',
    phone: '02-4567-8901',
    hours: '06:00-22:00',
    facilities: {
      disabled_access: true,
      baby_changing: false,
      separate_gender: true,
      wifi: true,
      parking: false
    },
    urgency_match: 'medium',
    source: 'mock_places',
    color: '#FF6B35',
    icon: '☕',
    rating: 4.0
  },
  {
    id: 'mock_public_1', 
    name: '강남구청 공중화장실',
    type: 'public',
    category: 'public',
    quality_score: 2,
    distance: 280,
    is_free: true,
    coordinates: { lat: 37.5665 - 0.002, lng: 126.9780 + 0.002 },
    address: '서울시 강남구 학동로 426',
    phone: null,
    hours: '24시간',
    facilities: {
      disabled_access: true,
      baby_changing: false,
      separate_gender: true
    },
    urgency_match: 'medium',
    source: 'seoul_api',
    color: '#28a745',
    icon: '🚽'
  },
  {
    id: 'mock_public_2',
    name: '시청역 지하 공중화장실',
    type: 'public',
    category: 'public',
    quality_score: 1,
    distance: 350,
    is_free: true,
    coordinates: { lat: 37.5665 - 0.003, lng: 126.9780 - 0.002 },
    address: '서울시 중구 시청역 지하1층',
    phone: null,
    hours: '05:30-00:30 (지하철 운행시간)',
    facilities: {
      disabled_access: true,
      baby_changing: false,
      separate_gender: true
    },
    urgency_match: 'low',
    source: 'seoul_api', 
    color: '#28a745',
    icon: '🚽'
  }
];

// Map marker styles
export const MARKER_STYLES = {
  userLocation: {
    size: { width: 32, height: 32 },
    color: '#007bff',
    borderColor: 'white',
    borderWidth: 3
  },
  toilet: {
    size: { width: 28, height: 28 },
    borderColor: 'white',
    borderWidth: 2
  }
};

// Animation classes
export const ANIMATIONS = {
  fadeIn: 'animate-fade-in',
  scaleIn: 'animate-scale-in',
  shimmer: 'animate-shimmer'
};