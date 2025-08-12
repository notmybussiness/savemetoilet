import React from 'react';
import { locationService } from '../services/locationService';
import { toiletService } from '../services/toiletService';

/**
 * 🚽 ToiletCard Component - Tailwind 버전
 * Bootstrap 의존성 없는 순수 Tailwind 기반 화장실 카드
 */
const ToiletCard = ({ toilet, userLocation }) => {
  const qualityInfo = toiletService.getQualityDescription(toilet.quality_score);
  const walkTime = locationService.calculateWalkTime(toilet.distance);

  const handleGoogleNavigation = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${toilet.coordinates.lat},${toilet.coordinates.lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleNaverNavigation = () => {
    const url = `https://map.naver.com/v5/directions/-/-,${toilet.coordinates.lng},${toilet.coordinates.lat},name=${encodeURIComponent(toilet.name)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getUrgencyStyles = (urgencyMatch) => {
    switch (urgencyMatch) {
      case 'high': 
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-200'
        };
      case 'medium': 
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-200'
        };
      case 'low': 
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-200'
        };
      default: 
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200'
        };
    }
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'cafe':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          icon: '☕'
        };
      case 'public':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          icon: '🏢'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          icon: '🚽'
        };
    }
  };

  const urgencyStyles = getUrgencyStyles(toilet.urgency_match);
  const typeStyles = getTypeStyles(toilet.type);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center text-xl
            ${typeStyles.bg}
          `}>
            {toilet.icon || typeStyles.icon}
          </div>
          
          {/* Title & Info */}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg leading-tight">
              {toilet.name}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {toilet.address}
            </p>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-2">
              {/* Type Badge */}
              <span className={`
                inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                ${typeStyles.bg} ${typeStyles.text}
              `}>
                {toilet.type === 'cafe' ? '상업시설' : '공중화장실'}
              </span>
              
              {/* Urgency Badge */}
              <span className={`
                inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                ${urgencyStyles.bg} ${urgencyStyles.text}
              `}>
                {toilet.urgency_match === 'high' ? '높음' : 
                 toilet.urgency_match === 'medium' ? '보통' : '낮음'}
              </span>
              
              {/* Free Badge */}
              {toilet.is_free && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  🆓 무료
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {Math.round(toilet.distance)}m
          </div>
          <div className="text-xs text-gray-600">거리</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {walkTime}분
          </div>
          <div className="text-xs text-gray-600">도보</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {'★'.repeat(toilet.quality_score)}
          </div>
          <div className="text-xs text-gray-600">품질</div>
        </div>
      </div>

      {/* Facilities */}
      {toilet.facilities && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {toilet.facilities.disabled_access && (
              <span className="inline-flex items-center text-xs text-gray-600">
                ♿ 장애인 접근
              </span>
            )}
            {toilet.facilities.baby_changing && (
              <span className="inline-flex items-center text-xs text-gray-600">
                👶 기저귀 교환
              </span>
            )}
            {toilet.facilities.separate_gender && (
              <span className="inline-flex items-center text-xs text-gray-600">
                🚹🚺 남녀 구분
              </span>
            )}
            {toilet.facilities.wifi && (
              <span className="inline-flex items-center text-xs text-gray-600">
                📶 Wi-Fi
              </span>
            )}
            {toilet.facilities.parking && (
              <span className="inline-flex items-center text-xs text-gray-600">
                🅿️ 주차
              </span>
            )}
          </div>
        </div>
      )}

      {/* Hours */}
      {toilet.hours && (
        <div className="mb-4 text-sm text-gray-600">
          <span className="font-medium">🕒 운영시간:</span> {toilet.hours}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleGoogleNavigation}
          className="
            flex-1 bg-blue-600 hover:bg-blue-700 text-white 
            px-4 py-2 rounded-lg text-sm font-medium
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          "
        >
          Google 길찾기
        </button>
        
        <button
          onClick={handleNaverNavigation}
          className="
            flex-1 bg-green-600 hover:bg-green-700 text-white 
            px-4 py-2 rounded-lg text-sm font-medium
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
          "
        >
          네이버 길찾기
        </button>
      </div>
    </div>
  );
};

export default React.memo(ToiletCard);