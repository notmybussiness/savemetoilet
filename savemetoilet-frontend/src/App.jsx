import { useState, useEffect } from 'react'
import { Container, Row, Col, Alert, Spinner, Button, Navbar, Nav } from 'react-bootstrap'
import UrgencySelector from './components/UrgencySelector'
import KakaoMap from './components/KakaoMap'
import ToiletCard from './components/ToiletCard'
import { locationService } from './services/locationService'
import { toiletService } from './services/toiletService'
import './App.css'

function App() {
  const [userLocation, setUserLocation] = useState(null)
  const [toilets, setToilets] = useState([])
  const [selectedUrgency, setSelectedUrgency] = useState('moderate')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedToilet, setSelectedToilet] = useState(null)
  const [viewMode, setViewMode] = useState('map') // 'map' or 'list'

  // Get user location on app load
  useEffect(() => {
    initializeLocation()
  }, [])

  // Search toilets when location or urgency changes
  useEffect(() => {
    if (userLocation) {
      searchToilets()
    }
  }, [userLocation, selectedUrgency])

  const initializeLocation = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const location = await locationService.getCurrentPosition()
      setUserLocation(location)
      
      if (location.fallback) {
        setError('위치 권한이 거부되었습니다. 서울시청 기준으로 검색합니다.')
      }
    } catch (err) {
      setError('위치를 가져올 수 없습니다: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const searchToilets = async () => {
    if (!userLocation) return
    
    setLoading(true)
    setError(null)
    
    try {
      const urgencyConfig = toiletService.getUrgencyConfig(selectedUrgency)
      const result = await toiletService.searchNearbyToilets(
        userLocation.lat,
        userLocation.lng,
        selectedUrgency,
        urgencyConfig.radius
      )
      
      if (result.success) {
        // Calculate distances and sort
        const toiletsWithDistance = result.data.toilets.map(toilet => ({
          ...toilet,
          distance: locationService.calculateDistance(
            userLocation.lat,
            userLocation.lng,
            toilet.coordinates.lat,
            toilet.coordinates.lng
          )
        }))
        
        // Sort by urgency score
        toiletsWithDistance.sort((a, b) => {
          const scoreA = toiletService.calculateUrgencyScore(a, userLocation.lat, userLocation.lng, selectedUrgency)
          const scoreB = toiletService.calculateUrgencyScore(b, userLocation.lat, userLocation.lng, selectedUrgency)
          return scoreB - scoreA
        })
        
        setToilets(toiletsWithDistance)
      } else {
        setError('화장실 검색에 실패했습니다.')
      }
    } catch (err) {
      // For development, show mock data if API is not available
      setError('API 서버에 연결할 수 없습니다. 임시 데이터를 표시합니다.')
      setMockData()
    } finally {
      setLoading(false)
    }
  }

  // Mock data for development
  const setMockData = () => {
    const mockToilets = [
      {
        id: 'mock_1',
        name: '스타벅스 강남역점',
        type: 'starbucks',
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
          separate_gender: true
        },
        urgency_match: 'high'
      },
      {
        id: 'mock_2', 
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
        urgency_match: 'medium'
      }
    ]
    
    setToilets(mockToilets)
  }

  const handleUrgencyChange = (urgency) => {
    setSelectedUrgency(urgency)
  }

  const handleToiletSelect = (toilet) => {
    setSelectedToilet(toilet)
  }

  return (
    <div className="App">
      <Navbar bg="primary" variant="dark" className="mb-3">
        <Container>
          <Navbar.Brand href="#home">
            🚽 SaveMeToilet
          </Navbar.Brand>
          <Nav className="me-auto">
            <Button
              variant={viewMode === 'map' ? 'light' : 'outline-light'}
              size="sm"
              className="me-2"
              onClick={() => setViewMode('map')}
            >
              🗺️ 지도
            </Button>
            <Button
              variant={viewMode === 'list' ? 'light' : 'outline-light'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              📋 목록
            </Button>
          </Nav>
        </Container>
      </Navbar>

      <Container>
        {error && (
          <Alert variant="warning" className="mb-3">
            {error}
          </Alert>
        )}

        <Row>
          <Col xs={12}>
            <UrgencySelector
              selectedUrgency={selectedUrgency}
              onUrgencyChange={handleUrgencyChange}
              className="mb-4"
            />
          </Col>
        </Row>

        {loading && (
          <div className="text-center my-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">검색중...</span>
            </Spinner>
            <p className="mt-2">화장실을 찾고 있습니다...</p>
          </div>
        )}

        {!loading && userLocation && (
          <>
            {viewMode === 'map' ? (
              <Row>
                <Col xs={12}>
                  <KakaoMap
                    userLocation={userLocation}
                    toilets={toilets}
                    onToiletSelect={handleToiletSelect}
                    selectedUrgency={selectedUrgency}
                  />
                </Col>
              </Row>
            ) : (
              <Row>
                <Col xs={12}>
                  <h5 className="mb-3">
                    📍 내 근처 화장실 ({toilets.length}개)
                  </h5>
                  {toilets.length === 0 ? (
                    <Alert variant="info">
                      근처에 화장실을 찾을 수 없습니다. 검색 범위를 넓혀보세요.
                    </Alert>
                  ) : (
                    toilets.map(toilet => (
                      <ToiletCard
                        key={toilet.id}
                        toilet={toilet}
                        userLocation={userLocation}
                      />
                    ))
                  )}
                </Col>
              </Row>
            )}

            {toilets.length > 0 && (
              <Row className="mt-3">
                <Col xs={12} className="text-center">
                  <Button
                    variant="outline-primary"
                    onClick={searchToilets}
                    disabled={loading}
                  >
                    🔄 새로고침
                  </Button>
                </Col>
              </Row>
            )}
          </>
        )}
      </Container>
    </div>
  )
}

export default App
