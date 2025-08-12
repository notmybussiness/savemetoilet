/**
 * Unit tests for PlacesService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { placesService, PLACE_TYPES } from '../placesService'
import { createMockLocation } from '../../test/utils'

describe('PlacesService', () => {
  const mockLocation = createMockLocation()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset service state
    placesService.initialized = false
    placesService.service = null
    placesService.map = null
  })

  describe('initialize', () => {
    it('should initialize successfully when Google Maps is available', async () => {
      const result = await placesService.initialize()

      expect(result).toBe(true)
      expect(placesService.initialized).toBe(true)
      expect(global.google.maps.Map).toHaveBeenCalled()
    })

    it('should handle initialization failure gracefully', async () => {
      // Mock Google Maps not being available
      const originalGoogle = global.google
      global.google = undefined

      const result = await placesService.initialize()

      expect(result).toBe(false)
      expect(placesService.initialized).toBe(false)

      // Restore Google Maps mock
      global.google = originalGoogle
    })

    it('should not reinitialize if already initialized', async () => {
      placesService.initialized = true

      const result = await placesService.initialize()

      expect(result).toBe(true)
      expect(global.google.maps.Map).not.toHaveBeenCalled()
    })
  })

  describe('searchCommercialPlaces', () => {
    beforeEach(async () => {
      await placesService.initialize()
    })

    it('should search for Starbucks locations successfully', async () => {
      // Mock Places API response
      const mockResults = [
        {
          place_id: 'starbucks_1',
          name: '스타벅스 강남점',
          formatted_address: '서울시 강남구 강남대로 123',
          geometry: {
            location: {
              lat: () => 37.5670,
              lng: () => 126.9785
            }
          },
          rating: 4.5,
          price_level: 2,
          photos: [{ getUrl: () => 'https://example.com/photo.jpg' }],
          business_status: 'OPERATIONAL'
        }
      ]

      placesService.service.textSearch = vi.fn((request, callback) => {
        callback(mockResults, global.google.maps.places.PlacesServiceStatus.OK)
      })

      const result = await placesService.searchCommercialPlaces(
        mockLocation.lat,
        mockLocation.lng,
        ['starbucks']
      )

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        name: '스타벅스 강남점',
        type: 'cafe',
        category: 'cafe',
        source: 'google_places',
        quality_score: expect.any(Number),
        distance: expect.any(Number)
      })
    })

    it('should handle multiple place types', async () => {
      placesService.service.textSearch = vi.fn((request, callback) => {
        const results = request.query.includes('Starbucks') ? 
          [{ place_id: 'sb1', name: 'Starbucks', geometry: { location: { lat: () => 37.567, lng: () => 126.978 } } }] :
          [{ place_id: 'tw1', name: 'A Twosome Place', geometry: { location: { lat: () => 37.568, lng: () => 126.979 } } }]
        
        callback(results, global.google.maps.places.PlacesServiceStatus.OK)
      })

      const result = await placesService.searchCommercialPlaces(
        mockLocation.lat,
        mockLocation.lng,
        ['starbucks', 'twosome']
      )

      expect(result).toHaveLength(2)
      expect(placesService.service.textSearch).toHaveBeenCalledTimes(2)
    })

    it('should handle API errors gracefully', async () => {
      placesService.service.textSearch = vi.fn((request, callback) => {
        callback([], global.google.maps.places.PlacesServiceStatus.ERROR)
      })

      await expect(
        placesService.searchCommercialPlaces(mockLocation.lat, mockLocation.lng, ['starbucks'])
      ).rejects.toThrow()
    })

    it('should handle zero results', async () => {
      placesService.service.textSearch = vi.fn((request, callback) => {
        callback([], global.google.maps.places.PlacesServiceStatus.ZERO_RESULTS)
      })

      const result = await placesService.searchCommercialPlaces(
        mockLocation.lat,
        mockLocation.lng,
        ['starbucks']
      )

      expect(result).toEqual([])
    })

    it('should throw error when not initialized', async () => {
      placesService.initialized = false

      // Mock initialization failure
      placesService.initialize = vi.fn().mockResolvedValue(false)

      await expect(
        placesService.searchCommercialPlaces(mockLocation.lat, mockLocation.lng, ['starbucks'])
      ).rejects.toThrow('Places service not initialized')
    })
  })

  describe('formatPlace', () => {
    it('should format Google Places result correctly', () => {
      const mockPlace = {
        place_id: 'test_id',
        name: '테스트 스타벅스',
        formatted_address: '서울시 강남구 테스트로 123',
        geometry: {
          location: {
            lat: () => 37.5670,
            lng: () => 126.9785
          }
        },
        rating: 4.5,
        price_level: 2,
        photos: [{ getUrl: vi.fn(() => 'https://example.com/photo.jpg') }],
        formatted_phone_number: '02-123-4567',
        opening_hours: {
          weekday_text: ['월요일: 06:00~22:00', '화요일: 06:00~22:00']
        }
      }

      const config = PLACE_TYPES.starbucks
      const formatted = placesService.formatPlace(mockPlace, config, mockLocation.lat, mockLocation.lng)

      expect(formatted).toMatchObject({
        id: 'cafe_test_id',
        name: '테스트 스타벅스',
        type: 'cafe',
        category: 'cafe',
        quality_score: expect.any(Number),
        distance: expect.any(Number),
        is_free: false,
        coordinates: {
          lat: 37.5670,
          lng: 126.9785
        },
        address: '서울시 강남구 테스트로 123',
        phone: '02-123-4567',
        hours: '월요일: 06:00~22:00, 화요일: 06:00~22:00',
        rating: 4.5,
        price_level: 2,
        photo_url: 'https://example.com/photo.jpg',
        source: 'google_places',
        urgency_match: expect.any(String)
      })
    })
  })

  describe('calculateQualityScore', () => {
    const config = PLACE_TYPES.starbucks

    it('should calculate quality score based on rating', () => {
      const highRatedPlace = { rating: 4.7, price_level: 2 }
      const lowRatedPlace = { rating: 2.5, price_level: 2 }

      const highScore = placesService.calculateQualityScore(highRatedPlace, config)
      const lowScore = placesService.calculateQualityScore(lowRatedPlace, config)

      expect(highScore).toBeGreaterThan(lowScore)
    })

    it('should adjust score based on price level', () => {
      const expensivePlace = { rating: 4.0, price_level: 4 }
      const cheapPlace = { rating: 4.0, price_level: 1 }

      const expensiveScore = placesService.calculateQualityScore(expensivePlace, config)
      const cheapScore = placesService.calculateQualityScore(cheapPlace, config)

      expect(cheapScore).toBeGreaterThan(expensiveScore)
    })

    it('should not exceed maximum score', () => {
      const perfectPlace = { rating: 5.0, price_level: 0 }
      const score = placesService.calculateQualityScore(perfectPlace, config)

      expect(score).toBeLessThanOrEqual(5)
    })
  })

  describe('removeDuplicates', () => {
    it('should remove exact name duplicates', () => {
      const places = [
        { name: 'Starbucks Gangnam', coordinates: { lat: 37.567, lng: 126.978 } },
        { name: 'Starbucks Gangnam', coordinates: { lat: 37.568, lng: 126.979 } }
      ]

      const unique = placesService.removeDuplicates(places)

      expect(unique).toHaveLength(1)
    })

    it('should remove proximity duplicates', () => {
      const places = [
        { name: 'Starbucks Store A', coordinates: { lat: 37.5670, lng: 126.9780 } },
        { name: 'Starbucks Store B', coordinates: { lat: 37.5671, lng: 126.9781 } } // Very close
      ]

      const unique = placesService.removeDuplicates(places)

      expect(unique).toHaveLength(1)
    })

    it('should keep genuinely different places', () => {
      const places = [
        { name: 'Starbucks Gangnam', coordinates: { lat: 37.567, lng: 126.978 } },
        { name: 'Starbucks Hongdae', coordinates: { lat: 37.556, lng: 126.922 } }
      ]

      const unique = placesService.removeDuplicates(places)

      expect(unique).toHaveLength(2)
    })
  })

  describe('sortPlacesByQuality', () => {
    it('should sort by urgency match first', () => {
      const places = [
        { urgency_match: 'low', quality_score: 5, distance: 100 },
        { urgency_match: 'high', quality_score: 2, distance: 200 },
        { urgency_match: 'medium', quality_score: 3, distance: 150 }
      ]

      const sorted = placesService.sortPlacesByQuality(places, mockLocation.lat, mockLocation.lng)

      expect(sorted[0].urgency_match).toBe('high')
      expect(sorted[1].urgency_match).toBe('medium')
      expect(sorted[2].urgency_match).toBe('low')
    })

    it('should sort by quality when urgency is same', () => {
      const places = [
        { urgency_match: 'medium', quality_score: 2, distance: 100 },
        { urgency_match: 'medium', quality_score: 4, distance: 200 }
      ]

      const sorted = placesService.sortPlacesByQuality(places, mockLocation.lat, mockLocation.lng)

      expect(sorted[0].quality_score).toBe(4)
      expect(sorted[1].quality_score).toBe(2)
    })
  })

  describe('getAvailablePlaceTypes', () => {
    it('should return all available place types with metadata', () => {
      const types = placesService.getAvailablePlaceTypes()

      expect(types).toBeInstanceOf(Array)
      expect(types.length).toBeGreaterThan(0)
      
      types.forEach(type => {
        expect(type).toHaveProperty('key')
        expect(type).toHaveProperty('query')
        expect(type).toHaveProperty('quality_score')
        expect(type).toHaveProperty('category')
      })
    })
  })

  describe('getPlaceTypeConfig', () => {
    it('should return correct config for valid type', () => {
      const config = placesService.getPlaceTypeConfig('starbucks')

      expect(config).toEqual(PLACE_TYPES.starbucks)
    })

    it('should return null for invalid type', () => {
      const config = placesService.getPlaceTypeConfig('invalid_type')

      expect(config).toBeNull()
    })
  })

  describe('PLACE_TYPES configuration', () => {
    it('should have all required properties for each place type', () => {
      Object.values(PLACE_TYPES).forEach(config => {
        expect(config).toHaveProperty('query')
        expect(config).toHaveProperty('type')
        expect(config).toHaveProperty('quality_score')
        expect(config).toHaveProperty('category')
        expect(config).toHaveProperty('color')
        expect(config).toHaveProperty('icon')
        expect(config).toHaveProperty('is_free')
        expect(typeof config.quality_score).toBe('number')
        expect(typeof config.is_free).toBe('boolean')
      })
    })

    it('should have different quality scores for different place types', () => {
      expect(PLACE_TYPES.starbucks.quality_score).toBeGreaterThan(PLACE_TYPES.ediya.quality_score)
      expect(PLACE_TYPES.department_store.quality_score).toBeGreaterThan(PLACE_TYPES.cafe.quality_score)
    })
  })
})