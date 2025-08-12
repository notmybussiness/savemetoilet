/**
 * Unit tests for ToiletService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import axios from 'axios'
import { toiletService } from '../../src/services/toiletService'
import { placesService } from '../../src/services/placesService'
import { 
  createMockToilet, 
  createMockCafe, 
  createMockSearchResult,
  mockApiResponse 
} from '../utils'

// Mock dependencies
vi.mock('axios')
vi.mock('../../src/services/placesService')

describe('ToiletService', () => {
  const mockLocation = { lat: 37.5665, lng: 126.9780 }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    axios.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          SearchPublicToiletPOIService: {
            row: [
              {
                POI_ID: 'test-1',
                FNAME: '테스트 공중화장실',
                ANAME: '공공',
                Y_WGS84: 37.5670,
                X_WGS84: 126.9785
              }
            ]
          }
        }
      }
    })

    placesService.searchCommercialPlaces.mockResolvedValue([createMockCafe()])
  })

  describe('searchNearbyToilets', () => {
    it('should search and combine public toilets and commercial places', async () => {
      const result = await toiletService.searchNearbyToilets(
        mockLocation.lat,
        mockLocation.lng,
        'moderate',
        500,
        { includeCommercial: true, includePublic: true },
        ['starbucks']
      )

      expect(result.success).toBe(true)
      expect(result.data.toilets).toBeDefined()
      expect(result.data.sources).toBeDefined()
      expect(placesService.searchCommercialPlaces).toHaveBeenCalledWith(
        mockLocation.lat,
        mockLocation.lng,
        ['starbucks'],
        500
      )
    })

    it('should handle API failures gracefully', async () => {
      axios.get.mockRejectedValue(new Error('API Error'))
      placesService.searchCommercialPlaces.mockRejectedValue(new Error('Places API Error'))

      const result = await toiletService.searchNearbyToilets(
        mockLocation.lat,
        mockLocation.lng,
        'moderate'
      )

      expect(result.success).toBe(false)
      expect(result.data.toilets).toBeDefined() // Should have fallback data
      expect(result.data.sources.mock).toBeDefined()
    })

    it('should skip commercial places when not requested', async () => {
      await toiletService.searchNearbyToilets(
        mockLocation.lat,
        mockLocation.lng,
        'moderate',
        500,
        {},
        [] // No place types
      )

      expect(placesService.searchCommercialPlaces).not.toHaveBeenCalled()
    })

    it('should filter results by distance', async () => {
      const result = await toiletService.searchNearbyToilets(
        mockLocation.lat,
        mockLocation.lng,
        'emergency',
        100 // Very small radius
      )

      expect(result.data.toilets.length).toBeGreaterThanOrEqual(0)
      result.data.toilets.forEach(toilet => {
        expect(toilet.distance).toBeLessThanOrEqual(100)
      })
    })
  })

  describe('searchPublicToilets', () => {
    it('should fetch and transform Seoul API data correctly', async () => {
      const toilets = await toiletService.searchPublicToilets(mockLocation.lat, mockLocation.lng, 1000)

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/test/toilets/sample'),
        { params: { limit: 20 } }
      )

      expect(toilets).toHaveLength(1)
      expect(toilets[0]).toMatchObject({
        id: expect.stringContaining('public_'),
        name: '테스트 공중화장실',
        type: 'public',
        source: 'seoul_api'
      })
    })

    it('should handle Seoul API errors gracefully', async () => {
      axios.get.mockRejectedValue(new Error('Seoul API Error'))

      const result = await toiletService.searchPublicToilets(mockLocation.lat, mockLocation.lng, 1000)

      expect(result).toEqual([])
    })

    it('should calculate urgency match based on distance', async () => {
      // Mock closer location
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: {
            SearchPublicToiletPOIService: {
              row: [
                {
                  POI_ID: 'close-toilet',
                  FNAME: '가까운 화장실',
                  ANAME: '공공',
                  Y_WGS84: mockLocation.lat + 0.001, // Very close
                  X_WGS84: mockLocation.lng + 0.001
                }
              ]
            }
          }
        }
      })

      const toilets = await toiletService.searchPublicToilets(mockLocation.lat, mockLocation.lng, 1000)

      expect(toilets[0].urgency_match).toBe('high') // Should be high urgency for close distance
    })
  })

  describe('calculateUrgencyScore', () => {
    it('should calculate correct score for emergency urgency', () => {
      const toilet = createMockToilet({ distance: 100, quality_score: 2 })
      const score = toiletService.calculateUrgencyScore(toilet, mockLocation.lat, mockLocation.lng, 'emergency')

      // Emergency prioritizes distance (90%) over quality (10%)
      expect(score).toBeGreaterThan(800) // High score for close distance
    })

    it('should calculate correct score for relaxed urgency', () => {
      const highQualityToilet = createMockToilet({ distance: 500, quality_score: 5 })
      const closeToilet = createMockToilet({ distance: 100, quality_score: 1 })

      const highQualityScore = toiletService.calculateUrgencyScore(highQualityToilet, mockLocation.lat, mockLocation.lng, 'relaxed')
      const closeScore = toiletService.calculateUrgencyScore(closeToilet, mockLocation.lat, mockLocation.lng, 'relaxed')

      // Relaxed prioritizes quality (70%) over distance (30%)
      expect(highQualityScore).toBeGreaterThan(closeScore)
    })

    it('should handle edge cases correctly', () => {
      const toilet = createMockToilet({ distance: 0, quality_score: 0 })
      const score = toiletService.calculateUrgencyScore(toilet, mockLocation.lat, mockLocation.lng, 'moderate')

      expect(score).toBeGreaterThanOrEqual(0)
      expect(typeof score).toBe('number')
    })
  })

  describe('sortToiletsByUrgency', () => {
    it('should sort toilets by urgency score', () => {
      const toilets = [
        createMockToilet({ id: 'far', distance: 500, quality_score: 1 }),
        createMockToilet({ id: 'close', distance: 100, quality_score: 2 }),
        createMockToilet({ id: 'quality', distance: 300, quality_score: 4 })
      ]

      const sorted = toiletService.sortToiletsByUrgency(toilets, mockLocation.lat, mockLocation.lng, 'moderate')

      expect(sorted).toHaveLength(3)
      expect(sorted[0].urgency_score).toBeGreaterThanOrEqual(sorted[1].urgency_score)
      expect(sorted[1].urgency_score).toBeGreaterThanOrEqual(sorted[2].urgency_score)
    })
  })

  describe('getUrgencyConfig', () => {
    it('should return correct config for each urgency level', () => {
      const emergency = toiletService.getUrgencyConfig('emergency')
      const moderate = toiletService.getUrgencyConfig('moderate')
      const relaxed = toiletService.getUrgencyConfig('relaxed')

      expect(emergency.radius).toBe(300)
      expect(moderate.radius).toBe(500)
      expect(relaxed.radius).toBe(1000)

      expect(emergency.placeTypes).toContain('starbucks')
      expect(relaxed.placeTypes).toContain('department_store')
    })

    it('should return default config for unknown urgency', () => {
      const config = toiletService.getUrgencyConfig('unknown')
      const defaultConfig = toiletService.getUrgencyConfig('moderate')

      expect(config).toEqual(defaultConfig)
    })
  })

  describe('getQualityDescription', () => {
    it('should return correct quality descriptions', () => {
      expect(toiletService.getQualityDescription(5)).toEqual({
        level: '⭐⭐⭐ 프리미엄',
        color: 'success'
      })

      expect(toiletService.getQualityDescription(2)).toEqual({
        level: '⭐⭐ 표준',
        color: 'warning'
      })

      expect(toiletService.getQualityDescription(1)).toEqual({
        level: '⭐ 기본',
        color: 'secondary'
      })
    })
  })

  describe('getSearchStats', () => {
    it('should calculate correct statistics', () => {
      const toilets = [
        createMockToilet({ type: 'public', distance: 100, quality_score: 2, source: 'seoul_api', urgency_match: 'high' }),
        createMockCafe({ type: 'cafe', distance: 200, quality_score: 3, source: 'google_places', urgency_match: 'medium' }),
        createMockToilet({ type: 'public', distance: 300, quality_score: 1, source: 'seoul_api', urgency_match: 'low' })
      ]

      const stats = toiletService.getSearchStats(toilets)

      expect(stats.total).toBe(3)
      expect(stats.by_type.public).toBe(2)
      expect(stats.by_type.cafe).toBe(1)
      expect(stats.by_urgency.high).toBe(1)
      expect(stats.by_urgency.medium).toBe(1)
      expect(stats.by_urgency.low).toBe(1)
      expect(stats.by_source.seoul_api).toBe(2)
      expect(stats.by_source.google_places).toBe(1)
      expect(stats.average_distance).toBe(200) // (100 + 200 + 300) / 3
    })

    it('should handle empty toilet array', () => {
      const stats = toiletService.getSearchStats([])

      expect(stats.total).toBe(0)
      expect(stats.average_distance).toBe(0)
      expect(Object.keys(stats.by_type)).toHaveLength(0)
    })
  })

  describe('getMockData', () => {
    it('should return mock data with correct structure', () => {
      const mockData = toiletService.getMockData(mockLocation.lat, mockLocation.lng)

      expect(mockData).toHaveLength(2)
      expect(mockData[0]).toMatchObject({
        source: 'mock',
        coordinates: expect.objectContaining({
          lat: expect.any(Number),
          lng: expect.any(Number)
        })
      })
    })
  })
})