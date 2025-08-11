import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-bootstrap';

const GoogleMap = ({ userLocation, toilets, onToiletSelect, selectedUrgency }) => {
  const mapContainer = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [error, setError] = useState(null);
  const [infoWindow, setInfoWindow] = useState(null);

  // Initialize Google Map
  useEffect(() => {
    const initializeMap = () => {
      // Check if API key is valid
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey || apiKey === 'your_google_maps_api_key_here' || apiKey === '받으신API키를여기에넣어주세요') {
        setError('Google Maps API 키가 설정되지 않았습니다. .env 파일의 VITE_GOOGLE_MAPS_API_KEY를 확인해주세요.');
        return;
      }
      
      if (!window.google || !window.google.maps) {
        setError('Google Maps를 불러올 수 없습니다. API 키를 확인해주세요.');
        return;
      }
      
      // Check if map container exists
      if (!mapContainer.current) {
        setError('지도 컨테이너를 찾을 수 없습니다.');
        return;
      }

      const { lat, lng } = userLocation;
      
      const mapOptions = {
        center: { lat, lng },
        zoom: 15,
        mapTypeId: 'roadmap',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ]
      };

      const googleMap = new window.google.maps.Map(mapContainer.current, mapOptions);
      setMap(googleMap);

      // Create info window instance
      const infoWindowInstance = new window.google.maps.InfoWindow();
      setInfoWindow(infoWindowInstance);

      // Add user location marker using AdvancedMarkerElement
      if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
        // Create user location icon element
        const userLocationIcon = document.createElement('div');
        userLocationIcon.innerHTML = `
          <div style="
            width: 32px; height: 32px;
            background: #007bff;
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">
            <div style="
              width: 6px; height: 6px;
              background: white;
              border-radius: 50%;
            "></div>
          </div>
        `;
        
        new window.google.maps.marker.AdvancedMarkerElement({
          position: { lat, lng },
          map: googleMap,
          title: '내 위치',
          content: userLocationIcon
        });
      } else {
        // Fallback to legacy Marker for older API versions
        new window.google.maps.Marker({
          position: { lat, lng },
          map: googleMap,
          title: '내 위치',
          icon: {
            url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
                <circle cx="12" cy="12" r="8" fill="#007bff" stroke="white" stroke-width="3"/>
                <circle cx="12" cy="12" r="3" fill="white"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 16)
          }
        });
      }
    };

    // Check API key before loading script
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'your_google_maps_api_key_here' || apiKey === '받으신API키를여기에넣어주세요') {
      setError('Google Maps API 키가 설정되지 않았습니다. .env 파일에서 VITE_GOOGLE_MAPS_API_KEY를 설정해주세요.');
      return;
    }
    
    // Load Google Maps script if not already loaded
    if (!window.google) {
      // Check if script is already loading to prevent duplicate loads
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        existingScript.addEventListener('load', initializeMap);
        return;
      }
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      script.onerror = () => {
        setError('Google Maps 스크립트를 불러올 수 없습니다. API 키가 유효한지 확인해주세요.');
      };
      document.head.appendChild(script);
    } else {
      initializeMap();
    }
  }, [userLocation]);

  // Update toilet markers when toilets change
  useEffect(() => {
    if (!map || !toilets || !infoWindow) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    const newMarkers = toilets.map(toilet => {
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
      
      let marker;
      
      if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
        // Create toilet marker icon element using AdvancedMarkerElement
        const toiletIcon = document.createElement('div');
        toiletIcon.innerHTML = `
          <div style="
            width: 28px; height: 28px;
            background: ${color};
            border: 2px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            cursor: pointer;
          ">🚽</div>
        `;
        
        marker = new window.google.maps.marker.AdvancedMarkerElement({
          position: { 
            lat: toilet.coordinates.lat, 
            lng: toilet.coordinates.lng 
          },
          map: map,
          title: toilet.name,
          content: toiletIcon
        });
      } else {
        // Fallback to legacy Marker for older API versions
        marker = new window.google.maps.Marker({
          position: { 
            lat: toilet.coordinates.lat, 
            lng: toilet.coordinates.lng 
          },
          map: map,
          title: toilet.name,
          icon: {
            url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28">
                <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
                <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">🚽</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(28, 28),
            anchor: new window.google.maps.Point(14, 14)
          }
        });
      }

      // Add click event to marker
      marker.addListener('click', () => {
        onToiletSelect(toilet);
        
        const infoContent = `
          <div style="padding: 10px; min-width: 200px; font-family: Arial, sans-serif;">
            <h6 style="margin: 0 0 8px 0; color: #333;">${toilet.name}</h6>
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #666;">
              🚶‍♂️ ${Math.round(toilet.distance)}m 
              ${toilet.is_free ? ' | 🆓 무료' : ' | 💰 구매필요'}
            </p>
            <div style="display: flex; gap: 8px;">
              <a href="https://www.google.com/maps/dir/?api=1&destination=${toilet.coordinates.lat},${toilet.coordinates.lng}" 
                 target="_blank" 
                 style="padding: 6px 12px; font-size: 12px; background: #4285f4; color: white; text-decoration: none; border-radius: 4px; display: inline-block;">
                Google 길찾기
              </a>
              <a href="https://map.naver.com/v5/directions/-/-,${toilet.coordinates.lng},${toilet.coordinates.lat},name=${encodeURIComponent(toilet.name)}" 
                 target="_blank"
                 style="padding: 6px 12px; font-size: 12px; background: #00c73c; color: white; text-decoration: none; border-radius: 4px; display: inline-block;">
                네이버 길찾기
              </a>
            </div>
          </div>
        `;

        infoWindow.setContent(infoContent);
        infoWindow.open(map, marker);
      });

      return marker;
    });

    setMarkers(newMarkers);

    // Adjust map bounds to show all markers
    if (toilets.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      
      // Add user location to bounds
      bounds.extend(new window.google.maps.LatLng(userLocation.lat, userLocation.lng));
      
      // Add toilet locations to bounds
      toilets.forEach(toilet => {
        bounds.extend(new window.google.maps.LatLng(
          toilet.coordinates.lat,
          toilet.coordinates.lng
        ));
      });

      map.fitBounds(bounds);
      
      // Set minimum zoom level
      const listener = window.google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom() > 18) map.setZoom(18);
        window.google.maps.event.removeListener(listener);
      });
    }
  }, [map, toilets, userLocation, onToiletSelect, infoWindow]);

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>지도 로드 오류</Alert.Heading>
        <p>{error}</p>
        <p style={{ fontSize: '14px', marginTop: '10px' }}>
          Google Maps API 키가 필요합니다. 
          <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">
            Google Cloud Console
          </a>에서 Maps JavaScript API를 활성화하고 API 키를 생성해주세요.
        </p>
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

export default GoogleMap;