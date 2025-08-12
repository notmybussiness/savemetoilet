import React from 'react';
import ToiletCard from '../ToiletCard';
import { Alert } from '../ui';

/**
 * 🚽 ToiletList Component
 * 화장실 목록을 표시하는 컴포넌트
 */
const ToiletList = ({ 
  toilets = [], 
  userLocation, 
  loading = false,
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Skeleton loading */}
        {[...Array(3)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (toilets.length === 0) {
    return (
      <div className={className}>
        <Alert type="info">
          <div className="text-center space-y-3">
            <div className="text-4xl">🔍</div>
            <div>
              <p className="font-medium mb-2">근처에 화장실을 찾을 수 없습니다.</p>
              <div className="text-sm text-gray-600">
                <p>다음을 시도해보세요:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-left">
                  <li>검색 범위를 늘려보세요</li>
                  <li>다른 긴급도로 검색해보세요</li>
                  <li>상업시설 검색을 활성화해보세요</li>
                  <li>위치 권한을 확인해보세요</li>
                </ul>
              </div>
            </div>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* List Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <span>📍</span>
          <span>내 근처 화장실</span>
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {toilets.length}개
          </span>
        </h2>
      </div>
      
      {/* Toilet List */}
      <div className="grid gap-4">
        {toilets.map((toilet, index) => (
          <div 
            key={toilet.id} 
            className="animate-fade-in"
            style={{ 
              animationDelay: `${index * 0.1}s`,
              animationFillMode: 'both'
            }}
          >
            <ToiletCard
              toilet={toilet}
              userLocation={userLocation}
            />
          </div>
        ))}
      </div>

      {/* List Footer Stats */}
      {toilets.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 justify-center">
            <div className="flex items-center gap-1">
              <span>🏢</span>
              <span>공중화장실: {toilets.filter(t => t.type === 'public').length}개</span>
            </div>
            <div className="flex items-center gap-1">
              <span>☕</span>
              <span>상업시설: {toilets.filter(t => t.type === 'cafe').length}개</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🆓</span>
              <span>무료: {toilets.filter(t => t.is_free).length}개</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(ToiletList);