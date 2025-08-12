/**
 * Unit tests for LocationService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { locationService } from '../locationService'
import { mockGeolocationSuccess, mockGeolocationError, createMockLocation } from '../../test/utils'

describe('LocationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCurrentPosition', () => {
    it('should return user location when geolocation is successful', async () => {
      const mockLocation = createMockLocation({ lat: 37.5665, lng: 126.9780 })
      mockGeolocationSuccess(mockLocation)

      const result = await locationService.getCurrentPosition()

      expect(result).toEqual({
        lat: mockLocation.lat,
        lng: mockLocation.lng,
        accuracy: mockLocation.accuracy
      })
      expect(result.fallback).toBeUndefined()
    })

    it('should return fallback location when geolocation fails', async () => {
      mockGeolocationError({ code: 1, message: 'Permission denied' })

      const result = await locationService.getCurrentPosition()

      expect(result).toEqual({
        lat: 37.5665, // Default Seoul coordinates
        lng: 126.9780,
        accuracy: null,
        fallback: true
      })
    })

    it('should reject when geolocation is not supported', async () => {
      const originalGeolocation = global.navigator.geolocation
      delete global.navigator.geolocation

      try {
        await expect(locationService.getCurrentPosition()).rejects.toThrow('Geolocation is not supported')
      } finally {
        global.navigator.geolocation = originalGeolocation
      }
    })

    it('should use correct options for geolocation API', async () => {
      const mockLocation = createMockLocation()
      mockGeolocationSuccess(mockLocation)

      await locationService.getCurrentPosition()

      expect(global.navigator.geolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes cache
        }
      )
    })
  })

  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // Seoul City Hall to Gangnam Station (approximately 7.5km)
      const distance = locationService.calculateDistance(
        37.5665, 126.9780, // Seoul City Hall
        37.4979, 127.0276  // Gangnam Station
      )

      expect(distance).toBeCloseTo(7500, -2) // Within 100m accuracy
    })

    it('should return 0 for identical coordinates', () => {
      const distance = locationService.calculateDistance(
        37.5665, 126.9780,
        37.5665, 126.9780
      )

      expect(distance).toBe(0)
    })

    it('should handle edge cases correctly', () => {
      // Test with very small differences
      const distance = locationService.calculateDistance(
        37.5665, 126.9780,
        37.5666, 126.9781
      )

      expect(distance).toBeGreaterThan(0)
      expect(distance).toBeLessThan(200) // Should be less than 200m
    })
  })

  describe('calculateWalkTime', () => {
    it('should calculate walking time correctly for various distances', () => {
      expect(locationService.calculateWalkTime(450)).toBe(1) // ~450m = 1 minute
      expect(locationService.calculateWalkTime(900)).toBe(2) // ~900m = 2 minutes
      expect(locationService.calculateWalkTime(2250)).toBe(5) // ~2250m = 5 minutes
    })

    it('should return minimum 1 minute for very short distances', () => {
      expect(locationService.calculateWalkTime(50)).toBe(0) // Very short distance
    })

    it('should handle zero distance', () => {
      expect(locationService.calculateWalkTime(0)).toBe(0)
    })

    it('should round to nearest minute', () => {
      expect(locationService.calculateWalkTime(675)).toBe(1) // Should round to 1 minute
      expect(locationService.calculateWalkTime(1125)).toBe(2) // Should round to 2 minutes
    })
  })

  describe('openKakaoNavigation', () => {
    it('should open Kakao Map with correct URL', () => {
      const mockOpen = vi.fn()
      global.window.open = mockOpen

      const lat = 37.5665
      const lng = 126.9780
      const name = '테스트 화장실'

      locationService.openKakaoNavigation(lat, lng, name)

      const expectedUrl = `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`
      expect(mockOpen).toHaveBeenCalledWith(expectedUrl, '_blank')
    })

    it('should handle special characters in location name', () => {
      const mockOpen = vi.fn()
      global.window.open = mockOpen

      const lat = 37.5665
      const lng = 126.9780
      const name = '스타벅스 강남역점 (2층)'

      locationService.openKakaoNavigation(lat, lng, name)

      const expectedUrl = `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`
      expect(mockOpen).toHaveBeenCalledWith(expectedUrl, '_blank')
    })
  })
})