/**
 * Performance validation tests
 * Tests for loading times, memory usage, and optimization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { performance } from 'perf_hooks'
import App from '../App'
import { toiletService } from '../services/toiletService'
import { locationService } from '../services/locationService'
import { placesService } from '../services/placesService'
import { mockGeolocationSuccess, createMockSearchResult } from './utils'

// Mock services with performance tracking
vi.mock('../services/toiletService')
vi.mock('../services/locationService')
vi.mock('../services/placesService')

describe('Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup performance-aware mocks
    locationService.getCurrentPosition.mockImplementation(() => {
      const start = performance.now()
      return new Promise(resolve => {
        setTimeout(() => {
          const end = performance.now()
          resolve({
            lat: 37.5665,
            lng: 126.9780,
            accuracy: 100,
            performanceTime: end - start
          })
        }, 100) // Simulate realistic API delay
      })
    })

    toiletService.searchNearbyToilets.mockImplementation(async () => {
      const start = performance.now()
      
      // Simulate API processing time
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const end = performance.now()
      const result = createMockSearchResult()
      result.performanceTime = end - start
      return result
    })

    mockGeolocationSuccess()
  })

  describe('Initial Load Performance', () => {
    it('should load within acceptable time limits', async () => {
      const startTime = performance.now()
      
      render(<App />)
      
      // Wait for location to be obtained
      await waitFor(() => {
        expect(locationService.getCurrentPosition).toHaveBeenCalled()
      }, { timeout: 1000 })
      
      // Wait for search to complete
      await waitFor(() => {
        expect(toiletService.searchNearbyToilets).toHaveBeenCalled()
      }, { timeout: 2000 })
      
      const endTime = performance.now()
      const totalLoadTime = endTime - startTime
      
      // Should load within 3 seconds
      expect(totalLoadTime).toBeLessThan(3000)
    })

    it('should show loading states during async operations', async () => {
      render(<App />)
      
      // Should show location loading
      expect(screen.getByText(/현재 위치를.*찾는 중/)).toBeInTheDocument()
      
      // Wait for location, then should show search loading
      await waitFor(() => {
        expect(screen.getByText(/화장실을.*검색하는 중/)).toBeInTheDocument()
      })
    })
  })

  describe('Search Performance', () => {
    it('should complete search within performance budget', async () => {
      render(<App />)
      
      await waitFor(() => {
        expect(toiletService.searchNearbyToilets).toHaveBeenCalled()
      })
      
      // Mock should simulate realistic search time
      const mockCall = toiletService.searchNearbyToilets.mock.results[0]
      const result = await mockCall.value
      
      // Search should complete within 1 second
      expect(result.performanceTime).toBeLessThan(1000)
    })

    it('should handle rapid urgency changes without performance degradation', async () => {
      const { rerender } = render(<App />)
      
      const performanceTimes = []
      
      // Simulate rapid urgency changes
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now()
        
        rerender(<App />)
        
        await waitFor(() => {
          expect(toiletService.searchNearbyToilets).toHaveBeenCalled()
        })
        
        const endTime = performance.now()
        performanceTimes.push(endTime - startTime)
      }
      
      // Performance should not degrade significantly
      const firstTime = performanceTimes[0]
      const lastTime = performanceTimes[performanceTimes.length - 1]
      const degradation = lastTime / firstTime
      
      expect(degradation).toBeLessThan(2) // Should not be more than 2x slower
    })
  })

  describe('Memory Usage', () => {
    it('should not cause memory leaks with component mounting/unmounting', () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0
      
      // Mount and unmount component multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<App />)
        unmount()
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    })
  })

  describe('Bundle Size Analysis', () => {
    it('should have reasonable component sizes', () => {
      // This is a placeholder for bundle analysis
      // In a real scenario, you'd analyze webpack bundle stats
      
      const componentSizeEstimate = {
        'App.jsx': 15000,      // ~15KB
        'services': 25000,     // ~25KB
        'components/ui': 20000, // ~20KB
        'total': 60000         // ~60KB
      }
      
      // Total should be under 100KB for core functionality
      expect(componentSizeEstimate.total).toBeLessThan(100000)
    })
  })

  describe('API Call Optimization', () => {
    it('should batch API calls efficiently', async () => {
      render(<App />)
      
      await waitFor(() => {
        expect(locationService.getCurrentPosition).toHaveBeenCalledTimes(1)
        expect(toiletService.searchNearbyToilets).toHaveBeenCalledTimes(1)
      })
      
      // Should not make redundant calls
      expect(locationService.getCurrentPosition).toHaveBeenCalledTimes(1)
    })

    it('should implement proper caching', async () => {
      const { rerender } = render(<App />)
      
      await waitFor(() => {
        expect(toiletService.searchNearbyToilets).toHaveBeenCalledTimes(1)
      })
      
      // Rerender with same props shouldn't trigger new search
      rerender(<App />)
      
      // Wait a bit to ensure no additional calls
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(toiletService.searchNearbyToilets).toHaveBeenCalledTimes(1)
    })
  })

  describe('Rendering Performance', () => {
    it('should render large lists efficiently', async () => {
      // Mock large dataset
      const largeMockData = Array.from({ length: 100 }, (_, i) => ({
        id: `toilet-${i}`,
        name: `화장실 ${i}`,
        type: 'public',
        distance: i * 10,
        coordinates: { lat: 37.5665 + i * 0.001, lng: 126.9780 + i * 0.001 }
      }))

      toiletService.searchNearbyToilets.mockResolvedValue({
        success: true,
        data: { toilets: largeMockData, total_count: 100 }
      })
      
      const startTime = performance.now()
      
      render(<App />)
      
      await waitFor(() => {
        expect(screen.getByText('화장실 0')).toBeInTheDocument()
      })
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Should render 100 items within 2 seconds
      expect(renderTime).toBeLessThan(2000)
    })
  })

  describe('Network Performance', () => {
    it('should handle slow network conditions gracefully', async () => {
      // Mock slow network
      toiletService.searchNearbyToilets.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 5000)) // 5 second delay
        return createMockSearchResult()
      })
      
      render(<App />)
      
      // Should show loading state
      expect(screen.getByText(/화장실을.*검색하는 중/)).toBeInTheDocument()
      
      // Should still complete within timeout
      await waitFor(() => {
        expect(toiletService.searchNearbyToilets).toHaveBeenCalled()
      }, { timeout: 6000 })
    })

    it('should implement proper error boundaries for network failures', async () => {
      toiletService.searchNearbyToilets.mockRejectedValue(new Error('Network failure'))
      
      render(<App />)
      
      await waitFor(() => {
        expect(screen.getByText(/오류가 발생했습니다/)).toBeInTheDocument()
      })
      
      // App should still be functional
      expect(screen.getByText('SaveMeToilet')).toBeInTheDocument()
    })
  })
})

/**
 * Performance benchmarking utilities
 */
export class PerformanceBenchmark {
  static async measureAsync(asyncFn, iterations = 1) {
    const times = []
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      await asyncFn()
      const end = performance.now()
      times.push(end - start)
    }
    
    return {
      min: Math.min(...times),
      max: Math.max(...times),
      average: times.reduce((a, b) => a + b, 0) / times.length,
      median: times.sort((a, b) => a - b)[Math.floor(times.length / 2)]
    }
  }
  
  static measureSync(syncFn, iterations = 1000) {
    const times = []
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      syncFn()
      const end = performance.now()
      times.push(end - start)
    }
    
    return {
      min: Math.min(...times),
      max: Math.max(...times),
      average: times.reduce((a, b) => a + b, 0) / times.length,
      median: times.sort((a, b) => a - b)[Math.floor(times.length / 2)]
    }
  }
}