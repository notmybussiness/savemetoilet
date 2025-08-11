/**
 * Test utilities for React components and services
 */

import React from 'react'
import { render } from '@testing-library/react'
import { vi } from 'vitest'

// Mock data generators
export const createMockLocation = (overrides = {}) => ({
  lat: 37.5665,
  lng: 126.9780,
  accuracy: 100,
  fallback: false,
  ...overrides
})

export const createMockToilet = (overrides = {}) => ({
  id: 'test-toilet-1',
  name: '테스트 화장실',
  type: 'public',
  category: 'public',
  quality_score: 2,
  distance: 150,
  is_free: true,
  coordinates: { lat: 37.5670, lng: 126.9785 },
  address: '서울시 중구 테스트동 123',
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
  icon: '🚽',
  ...overrides
})

export const createMockCafe = (overrides = {}) => ({
  id: 'test-cafe-1',
  name: '스타벅스 테스트점',
  type: 'cafe',
  category: 'cafe',
  quality_score: 3,
  distance: 200,
  is_free: false,
  coordinates: { lat: 37.5675, lng: 126.9790 },
  address: '서울시 중구 테스트로 456',
  phone: '02-123-4567',
  hours: '06:00-22:00',
  rating: 4.5,
  price_level: 2,
  facilities: {
    disabled_access: true,
    baby_changing: true,
    separate_gender: true,
    wifi: true,
    parking: false
  },
  urgency_match: 'high',
  source: 'google_places',
  color: '#00704A',
  icon: '☕',
  ...overrides
})

export const createMockSearchResult = (toilets = [], overrides = {}) => ({
  success: true,
  data: {
    toilets: toilets.length > 0 ? toilets : [createMockToilet(), createMockCafe()],
    total_count: toilets.length || 2,
    sources: {
      public: toilets.filter(t => t.source === 'seoul_api').length || 1,
      commercial: toilets.filter(t => t.source === 'google_places').length || 1
    }
  },
  ...overrides
})

// Mock services
export const createMockLocationService = () => ({
  getCurrentPosition: vi.fn(),
  calculateDistance: vi.fn(() => 150),
  calculateWalkTime: vi.fn(() => 2),
  openKakaoNavigation: vi.fn()
})

export const createMockToiletService = () => ({
  searchNearbyToilets: vi.fn(),
  searchPublicToilets: vi.fn(),
  searchCommercialPlaces: vi.fn(),
  calculateUrgencyScore: vi.fn(() => 85),
  getUrgencyConfig: vi.fn(() => ({
    label: '🟡 좀 급해요',
    radius: 500,
    color: 'warning',
    description: '거리와 품질 균형',
    placeTypes: ['starbucks', 'twosome', 'ediya']
  })),
  getQualityDescription: vi.fn(() => ({ level: '⭐⭐ 표준', color: 'warning' })),
  getCommercialPlaceTypes: vi.fn(() => []),
  getSearchStats: vi.fn(() => ({
    total: 2,
    by_type: { public: 1, cafe: 1 },
    by_urgency: { high: 1, medium: 1, low: 0 },
    by_source: { seoul_api: 1, google_places: 1 },
    average_distance: 175,
    quality_distribution: { high: 1, medium: 1, low: 0 }
  }))
})

export const createMockPlacesService = () => ({
  initialize: vi.fn(() => Promise.resolve(true)),
  searchCommercialPlaces: vi.fn(() => Promise.resolve([createMockCafe()])),
  getAvailablePlaceTypes: vi.fn(() => [
    { key: 'starbucks', query: 'Starbucks', quality_score: 3, category: 'cafe' }
  ]),
  getPlaceTypeConfig: vi.fn(() => null)
})

// Custom render function with providers
export const renderWithProviders = (ui, options = {}) => {
  const { initialState = {}, ...renderOptions } = options

  // You can add context providers here if needed in the future
  const Wrapper = ({ children }) => {
    return children // For now, just return children
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Mock API responses
export const mockApiResponse = (data, options = {}) => {
  const { success = true, delay = 0, error = null } = options
  
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (success && !error) {
        resolve({ data })
      } else {
        reject(error || new Error('Mock API error'))
      }
    }, delay)
  })
}

// Geolocation mocks
export const mockGeolocationSuccess = (location = createMockLocation()) => {
  const mockImplementation = (successCallback) => {
    setTimeout(() => {
      successCallback({
        coords: {
          latitude: location.lat,
          longitude: location.lng,
          accuracy: location.accuracy
        }
      })
    }, 100)
  }
  
  global.navigator.geolocation.getCurrentPosition.mockImplementation(mockImplementation)
}

export const mockGeolocationError = (error = { code: 1, message: 'Permission denied' }) => {
  const mockImplementation = (successCallback, errorCallback) => {
    setTimeout(() => {
      errorCallback(error)
    }, 100)
  }
  
  global.navigator.geolocation.getCurrentPosition.mockImplementation(mockImplementation)
}

// Google Maps API mocks
export const mockGoogleMapsLoad = () => {
  // Google Maps is already mocked in setup.js, but this can be used for specific test cases
  return Promise.resolve()
}

// Wait for async operations
export const waitFor = (condition, timeout = 1000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    const check = () => {
      if (condition()) {
        resolve()
      } else if (Date.now() - startTime >= timeout) {
        reject(new Error('Timeout waiting for condition'))
      } else {
        setTimeout(check, 50)
      }
    }
    check()
  })
}

export default {
  renderWithProviders,
  createMockLocation,
  createMockToilet,
  createMockCafe,
  createMockSearchResult,
  createMockLocationService,
  createMockToiletService,
  createMockPlacesService,
  mockApiResponse,
  mockGeolocationSuccess,
  mockGeolocationError,
  mockGoogleMapsLoad,
  waitFor
}