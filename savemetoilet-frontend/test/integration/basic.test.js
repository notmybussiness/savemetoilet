/**
 * Basic integration tests for SaveMeToilet application
 */

import { describe, it, expect } from 'vitest'
import { toiletService } from '../../src/services/toiletService'

describe('SaveMeToilet Basic Functionality', () => {
  const mockLocation = { lat: 37.5665, lng: 126.9780 } // Seoul City Hall

  it('should have toilet service available', () => {
    expect(toiletService).toBeDefined()
    expect(typeof toiletService.searchNearbyToilets).toBe('function')
    expect(typeof toiletService.calculateDistance).toBe('function')
    expect(typeof toiletService.calculateUrgencyScore).toBe('function')
  })

  it('should calculate distance correctly', () => {
    // Distance between Seoul City Hall (37.5665, 126.9780) and nearby point
    const distance = toiletService.calculateDistance(
      37.5665, 126.9780,  // Seoul City Hall
      37.5670, 126.9785   // ~60m northeast
    )
    
    expect(distance).toBeGreaterThan(0)
    expect(distance).toBeLessThan(100) // Should be less than 100 meters
  })

  it('should calculate urgency scores correctly', () => {
    const toilet = {
      distance: 100,
      quality_score: 3
    }

    const emergencyScore = toiletService.calculateUrgencyScore(toilet, mockLocation.lat, mockLocation.lng, 'emergency')
    const relaxedScore = toiletService.calculateUrgencyScore(toilet, mockLocation.lat, mockLocation.lng, 'relaxed')

    expect(emergencyScore).toBeGreaterThan(0)
    expect(relaxedScore).toBeGreaterThan(0)
    expect(typeof emergencyScore).toBe('number')
    expect(typeof relaxedScore).toBe('number')
  })

  it('should provide urgency configurations', () => {
    const emergency = toiletService.getUrgencyConfig('emergency')
    const moderate = toiletService.getUrgencyConfig('moderate')
    const relaxed = toiletService.getUrgencyConfig('relaxed')

    expect(emergency.radius).toBe(300)
    expect(moderate.radius).toBe(500)
    expect(relaxed.radius).toBe(1000)

    expect(emergency.label).toContain('급해요')
    expect(relaxed.label).toContain('여유있어요')
  })

  it('should provide quality descriptions', () => {
    const premium = toiletService.getQualityDescription(5)
    const standard = toiletService.getQualityDescription(2)
    const basic = toiletService.getQualityDescription(1)

    expect(premium.level).toContain('프리미엄')
    expect(standard.level).toContain('표준')
    expect(basic.level).toContain('기본')
  })

  it('should provide mock data for fallback', () => {
    const mockData = toiletService.getMockData(mockLocation.lat, mockLocation.lng)
    
    expect(Array.isArray(mockData)).toBe(true)
    expect(mockData.length).toBeGreaterThan(0)
    
    mockData.forEach(toilet => {
      expect(toilet).toHaveProperty('id')
      expect(toilet).toHaveProperty('name')
      expect(toilet).toHaveProperty('type')
      expect(toilet).toHaveProperty('coordinates')
      expect(toilet.source).toBe('mock')
    })
  })

  it('should handle preferences save/load functions', () => {
    const testPreferences = {
      urgency: 'moderate',
      radius: 500,
      includeCommercial: true
    }

    // Test save function returns success
    const saveResult = toiletService.savePreferences(testPreferences)
    expect(saveResult).toBeDefined()
    expect(saveResult.success).toBe(true)

    // Test load function exists and returns something
    const loadResult = toiletService.loadPreferences()
    // Just check that function exists and doesn't throw
    expect(typeof toiletService.loadPreferences).toBe('function')
  })

  it('should generate search statistics', () => {
    const mockToilets = [
      { type: 'public', distance: 100, quality_score: 2, source: 'seoul_api', urgency_match: 'high' },
      { type: 'cafe', distance: 200, quality_score: 3, source: 'google_places', urgency_match: 'medium' },
      { type: 'public', distance: 300, quality_score: 1, source: 'seoul_api', urgency_match: 'low' }
    ]

    const stats = toiletService.getSearchStats(mockToilets)

    expect(stats.total).toBe(3)
    expect(stats.by_type.public).toBe(2)
    expect(stats.by_type.cafe).toBe(1)
    expect(stats.average_distance).toBe(200)
    expect(stats.by_source.seoul_api).toBe(2)
    expect(stats.by_source.google_places).toBe(1)
  })
})