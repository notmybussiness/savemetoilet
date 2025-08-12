/**
 * Integration tests for the main App component
 * Tests complete user workflows and component interactions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { toiletService } from '../services/toiletService'
import { locationService } from '../services/locationService'
import { 
  mockGeolocationSuccess, 
  mockGeolocationError,
  createMockToilet, 
  createMockCafe,
  createMockSearchResult
} from '../test/utils'

// Mock services
vi.mock('../services/toiletService')
vi.mock('../services/locationService')

describe('App Integration Tests', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    locationService.getCurrentPosition.mockResolvedValue({
      lat: 37.5665,
      lng: 126.9780,
      accuracy: 100
    })

    locationService.calculateDistance.mockImplementation((lat1, lng1, lat2, lng2) => {
      return Math.abs((lat1 - lat2) + (lng1 - lng2)) * 111000 // Rough approximation
    })

    locationService.calculateWalkTime.mockReturnValue(3)
    locationService.openKakaoNavigation.mockImplementation(() => {})

    const mockToilets = [
      createMockToilet({ id: 'toilet-1', name: '공중화장실 1', distance: 150 }),
      createMockCafe({ id: 'cafe-1', name: '스타벅스 테스트점', distance: 200 })
    ]

    toiletService.searchNearbyToilets.mockResolvedValue(
      createMockSearchResult(mockToilets)
    )

    toiletService.getUrgencyConfig.mockImplementation((urgency) => ({
      emergency: { label: '🔴 진짜 급해요!', radius: 300, placeTypes: ['starbucks'] },
      moderate: { label: '🟡 좀 급해요', radius: 500, placeTypes: ['starbucks', 'cafe'] },
      relaxed: { label: '🟢 여유있어요', radius: 1000, placeTypes: ['starbucks', 'cafe', 'department_store'] }
    })[urgency] || { label: '🟡 좀 급해요', radius: 500, placeTypes: ['starbucks', 'cafe'] })

    toiletService.calculateUrgencyScore.mockReturnValue(85)
    
    toiletService.getSearchStats.mockReturnValue({
      total: 2,
      by_type: { public: 1, cafe: 1 },
      by_urgency: { high: 1, medium: 1, low: 0 },
      by_source: { seoul_api: 1, google_places: 1 },
      average_distance: 175
    })

    mockGeolocationSuccess()
  })

  describe('App Initialization', () => {
    it('should render app title and loading state initially', async () => {
      render(<App />)

      expect(screen.getByText('SaveMeToilet')).toBeInTheDocument()
      expect(screen.getByText(/현재 위치를.*찾는 중/)).toBeInTheDocument()
    })

    it('should initialize location and search toilets on startup', async () => {
      render(<App />)

      await waitFor(() => {
        expect(locationService.getCurrentPosition).toHaveBeenCalled()
      }, { timeout: 3000 })

      await waitFor(() => {
        expect(toiletService.searchNearbyToilets).toHaveBeenCalledWith(
          37.5665,
          126.9780,
          'moderate',
          expect.any(Number),
          expect.any(Object),
          expect.any(Array)
        )
      }, { timeout: 5000 })
    })
  })

  describe('Location Handling', () => {
    it('should show fallback location warning when geolocation fails', async () => {
      locationService.getCurrentPosition.mockResolvedValue({
        lat: 37.5665,
        lng: 126.9780,
        accuracy: null,
        fallback: true
      })

      render(<App />)

      await waitFor(() => {
        expect(screen.getByText(/위치 권한이 거부되었습니다/)).toBeInTheDocument()
      })
    })

    it('should allow manual location refresh', async () => {
      render(<App />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.queryByText(/현재 위치를.*찾는 중/)).not.toBeInTheDocument()
      })

      // Click refresh button
      const refreshButton = screen.getByRole('button', { name: /새로고침/ })
      await user.click(refreshButton)

      expect(toiletService.searchNearbyToilets).toHaveBeenCalledTimes(2)
    })
  })

  describe('Search Functionality', () => {
    it('should display search results after loading', async () => {
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('공중화장실 1')).toBeInTheDocument()
        expect(screen.getByText('스타벅스 테스트점')).toBeInTheDocument()
      })
    })

    it('should update search when urgency changes', async () => {
      render(<App />)

      // Wait for initial search
      await waitFor(() => {
        expect(toiletService.searchNearbyToilets).toHaveBeenCalledWith(
          expect.any(Number),
          expect.any(Number),
          'moderate',
          expect.any(Number),
          expect.any(Object),
          expect.any(Array)
        )
      })

      // Change urgency to emergency
      const emergencyButton = screen.getByText(/🔴 진짜 급해요!/)
      await user.click(emergencyButton)

      await waitFor(() => {
        expect(toiletService.searchNearbyToilets).toHaveBeenCalledWith(
          expect.any(Number),
          expect.any(Number),
          'emergency',
          expect.any(Number),
          expect.any(Object),
          expect.any(Array)
        )
      })
    })
  })

  describe('View Mode Toggle', () => {
    it('should toggle between map and list view', async () => {
      render(<App />)

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('공중화장실 1')).toBeInTheDocument()
      })

      // Should start in map view
      expect(screen.getByRole('button', { name: /지도/ })).toHaveClass('bg-white')

      // Switch to list view
      const listButton = screen.getByRole('button', { name: /목록/ })
      await user.click(listButton)

      expect(listButton).toHaveClass('bg-white')

      // Should show list view content
      expect(screen.getByText(/내 근처 화장실 \(2개\)/)).toBeInTheDocument()
    })
  })

  describe('Hamburger Menu', () => {
    it('should open and close side menu', async () => {
      render(<App />)

      // Menu should be closed initially
      expect(screen.queryByText(/현재 상태/)).not.toBeInTheDocument()

      // Open menu
      const hamburgerButton = screen.getByRole('button', { name: /메뉴 열기/ })
      await user.click(hamburgerButton)

      // Menu should be open
      await waitFor(() => {
        expect(screen.getByText(/현재 상태/)).toBeInTheDocument()
      })

      // Close menu by clicking close button
      const closeButton = screen.getByRole('button', { name: /닫기|close/i })
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByText(/현재 상태/)).not.toBeInTheDocument()
      })
    })

    it('should show location information in sidebar', async () => {
      render(<App />)

      // Open sidebar
      await user.click(screen.getByRole('button', { name: /메뉴 열기/ }))

      await waitFor(() => {
        expect(screen.getByText(/📍 현재 위치/)).toBeInTheDocument()
        expect(screen.getByText(/좌표: 37.5665, 126.9780/)).toBeInTheDocument()
      })
    })

    it('should show search statistics in sidebar', async () => {
      render(<App />)

      // Wait for search results
      await waitFor(() => {
        expect(screen.getByText('공중화장실 1')).toBeInTheDocument()
      })

      // Open sidebar
      await user.click(screen.getByRole('button', { name: /메뉴 열기/ }))

      await waitFor(() => {
        expect(screen.getByText(/📊 검색 결과/)).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument() // Total count
        expect(screen.getByText('175m')).toBeInTheDocument() // Average distance
      })
    })
  })

  describe('Error Handling', () => {
    it('should show error when search fails', async () => {
      toiletService.searchNearbyToilets.mockRejectedValue(new Error('Network error'))

      render(<App />)

      await waitFor(() => {
        expect(screen.getByText(/검색 중 오류가 발생했습니다/)).toBeInTheDocument()
      })

      // Should show fallback mock data
      await waitFor(() => {
        expect(screen.getByText(/스타벅스 강남역점/)).toBeInTheDocument()
      })
    })

    it('should handle geolocation errors gracefully', async () => {
      mockGeolocationError({ code: 1, message: 'Permission denied' })

      render(<App />)

      await waitFor(() => {
        expect(locationService.getCurrentPosition).toHaveBeenCalled()
      })

      // Should still show UI with fallback location
      await waitFor(() => {
        expect(screen.getByText('SaveMeToilet')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<App />)

      expect(screen.getByRole('button', { name: /메뉴 열기/ })).toBeInTheDocument()
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('header')).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      render(<App />)

      // Tab through interactive elements
      await user.tab()
      expect(screen.getByRole('button', { name: /메뉴 열기/ })).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('button', { name: /지도/ })).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('button', { name: /목록/ })).toHaveFocus()
    })
  })

  describe('Responsive Behavior', () => {
    it('should work on mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('SaveMeToilet')).toBeInTheDocument()
      })

      // Menu should still be functional on mobile
      const hamburgerButton = screen.getByRole('button', { name: /메뉴 열기/ })
      await user.click(hamburgerButton)

      await waitFor(() => {
        expect(screen.getByText(/현재 상태/)).toBeInTheDocument()
      })
    })
  })

  describe('Data Persistence', () => {
    it('should maintain urgency selection across searches', async () => {
      render(<App />)

      // Change to emergency urgency
      await user.click(screen.getByText(/🔴 진짜 급해요!/))

      // Refresh search
      await waitFor(() => {
        expect(screen.queryByText(/현재 위치를.*찾는 중/)).not.toBeInTheDocument()
      })

      const refreshButton = screen.getByRole('button', { name: /새로고침/ })
      await user.click(refreshButton)

      // Should still use emergency urgency
      await waitFor(() => {
        expect(toiletService.searchNearbyToilets).toHaveBeenLastCalledWith(
          expect.any(Number),
          expect.any(Number),
          'emergency',
          expect.any(Number),
          expect.any(Object),
          expect.any(Array)
        )
      })
    })
  })
})