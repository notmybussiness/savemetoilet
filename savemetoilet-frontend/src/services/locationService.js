// Location service for geolocation and coordinates handling
export const locationService = {
  // Get current user location
  getCurrentPosition: () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes cache
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Fallback to Seoul City Hall coordinates
          resolve({
            lat: parseFloat(import.meta.env.VITE_DEFAULT_LAT),
            lng: parseFloat(import.meta.env.VITE_DEFAULT_LNG),
            accuracy: null,
            fallback: true
          });
        },
        options
      );
    });
  },

  // Calculate distance between two points (Haversine formula)
  calculateDistance: (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1000; // Distance in meters
  },

  // Calculate walking time estimate (average 4.5 km/h)
  calculateWalkTime: (distanceMeters) => {
    const walkingSpeedKmh = 4.5;
    const walkingSpeedMs = walkingSpeedKmh * 1000 / 3600; // m/s
    return Math.round(distanceMeters / walkingSpeedMs / 60); // minutes
  },

  // Open Kakao Map navigation
  openKakaoNavigation: (lat, lng, name) => {
    const url = `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`;
    window.open(url, '_blank');
  }
};