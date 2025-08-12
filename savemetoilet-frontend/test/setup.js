/**
 * Test setup file for Vitest
 * Configures testing environment and mocks
 */

import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test case
afterEach(() => {
  cleanup()
})

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_BASE_URL: 'http://localhost:3001',
    VITE_GOOGLE_MAPS_API_KEY: 'test_google_maps_key',
    VITE_DEFAULT_LAT: '37.5665',
    VITE_DEFAULT_LNG: '126.9780'
  },
  writable: true
})

// Mock Google Maps API
global.google = {
  maps: {
    Map: vi.fn(() => ({
      setCenter: vi.fn(),
      setZoom: vi.fn(),
      fitBounds: vi.fn(),
      getZoom: vi.fn(() => 15),
      addListener: vi.fn(),
      removeListener: vi.fn()
    })),
    Marker: vi.fn(() => ({
      setMap: vi.fn(),
      setPosition: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn()
    })),
    InfoWindow: vi.fn(() => ({
      setContent: vi.fn(),
      open: vi.fn(),
      close: vi.fn(),
      setPosition: vi.fn()
    })),
    LatLng: vi.fn((lat, lng) => ({ lat, lng })),
    LatLngBounds: vi.fn(() => ({
      extend: vi.fn(),
      getCenter: vi.fn(),
      getNorthEast: vi.fn(),
      getSouthWest: vi.fn()
    })),
    Size: vi.fn((width, height) => ({ width, height })),
    Point: vi.fn((x, y) => ({ x, y })),
    event: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    },
    places: {
      PlacesService: vi.fn(() => ({
        textSearch: vi.fn(),
        nearbySearch: vi.fn(),
        getDetails: vi.fn()
      })),
      PlacesServiceStatus: {
        OK: 'OK',
        ZERO_RESULTS: 'ZERO_RESULTS',
        ERROR: 'ERROR'
      }
    }
  }
}

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn()
}

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// Mock window methods
Object.defineProperty(global, 'window', {
  value: {
    ...global.window,
    open: vi.fn(),
    location: {
      href: 'http://localhost:3000'
    }
  },
  writable: true
})

// Mock intersection observer
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn()
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn()
}))

export { vi }