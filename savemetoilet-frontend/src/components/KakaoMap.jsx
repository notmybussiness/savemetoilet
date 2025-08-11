import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-bootstrap';

const KakaoMap = ({ userLocation, toilets, onToiletSelect, selectedUrgency }) => {
  const mapContainer = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [error, setError] = useState(null);

  // Initialize Kakao Map
  useEffect(() => {
    const initializeMap = () => {
      if (!window.kakao || !window.kakao.maps) {
        setError('카카오맵을 불러올 수 없습니다. API 키를 확인해주세요.');
        return;
      }

      const { lat, lng } = userLocation;
      const center = new window.kakao.maps.LatLng(lat, lng);
      
      const mapOptions = {
        center,
        level: 3 // Zoom level (1-14, smaller = more zoomed in)
      };

      const kakaoMap = new window.kakao.maps.Map(mapContainer.current, mapOptions);
      setMap(kakaoMap);

      // Add user location marker
      const userMarkerPosition = new window.kakao.maps.LatLng(lat, lng);
      const userMarker = new window.kakao.maps.Marker({
        position: userMarkerPosition,
        image: new window.kakao.maps.MarkerImage(
          'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
              <circle cx="12" cy="12" r="8" fill="#007bff" stroke="white" stroke-width="2"/>
              <circle cx="12" cy="12" r="3" fill="white"/>
            </svg>
          `),
          new window.kakao.maps.Size(32, 32),
          { offset: new window.kakao.maps.Point(16, 16) }
        )
      });
      
      userMarker.setMap(kakaoMap);
    };

    // Load Kakao Map script if not already loaded
    if (!window.kakao) {
      const script = document.createElement('script');
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${import.meta.env.VITE_KAKAO_API_KEY}&autoload=false`;
      script.onload = () => {
        window.kakao.maps.load(initializeMap);
      };
      script.onerror = () => {
        setError('카카오맵 스크립트를 불러올 수 없습니다.');
      };
      document.head.appendChild(script);
    } else {
      initializeMap();
    }
  }, [userLocation]);

  // Update toilet markers when toilets change
  useEffect(() => {
    if (!map || !toilets) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    const newMarkers = toilets.map(toilet => {
      const position = new window.kakao.maps.LatLng(
        toilet.coordinates.lat,
        toilet.coordinates.lng
      );

      // Get urgency color for marker
      const getMarkerColor = (urgencyMatch) => {
        switch (urgencyMatch) {
          case 'high': return '#dc3545'; // Red
          case 'medium': return '#ffc107'; // Yellow
          case 'low': return '#28a745'; // Green
          default: return '#6c757d'; // Gray
        }
      };

      const color = getMarkerColor(toilet.urgency_match);
      
      const marker = new window.kakao.maps.Marker({
        position,
        image: new window.kakao.maps.MarkerImage(
          'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28">
              <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
              <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">🚽</text>
            </svg>
          `),
          new window.kakao.maps.Size(28, 28),
          { offset: new window.kakao.maps.Point(14, 14) }
        )
      });

      marker.setMap(map);

      // Add click event to marker
      window.kakao.maps.event.addListener(marker, 'click', () => {
        onToiletSelect(toilet);
        
        // Create info window
        const infoContent = `
          <div style="padding: 10px; min-width: 200px;">
            <h6 style="margin: 0 0 5px 0;">${toilet.name}</h6>
            <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">
              🚶‍♂️ ${Math.round(toilet.distance)}m
              ${toilet.is_free ? ' | 무료' : ' | 구매필요'}
            </p>
            <button onclick="window.open('https://map.kakao.com/link/to/${encodeURIComponent(toilet.name)},${toilet.coordinates.lat},${toilet.coordinates.lng}', '_blank')" 
                    style="padding: 4px 8px; font-size: 12px; background: #007bff; color: white; border: none; border-radius: 4px;">
              길찾기
            </button>
          </div>
        `;

        const infoWindow = new window.kakao.maps.InfoWindow({
          content: infoContent
        });

        infoWindow.open(map, marker);
      });

      return marker;
    });

    setMarkers(newMarkers);

    // Adjust map bounds to show all markers
    if (toilets.length > 0) {
      const bounds = new window.kakao.maps.LatLngBounds();
      
      // Add user location to bounds
      bounds.extend(new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng));
      
      // Add toilet locations to bounds
      toilets.forEach(toilet => {
        bounds.extend(new window.kakao.maps.LatLng(
          toilet.coordinates.lat,
          toilet.coordinates.lng
        ));
      });

      map.setBounds(bounds);
    }
  }, [map, toilets, userLocation, onToiletSelect]);

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>지도 로드 오류</Alert.Heading>
        <p>{error}</p>
      </Alert>
    );
  }

  return (
    <div 
      ref={mapContainer} 
      style={{ 
        width: '100%', 
        height: '400px',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}
    />
  );
};

export default KakaoMap;