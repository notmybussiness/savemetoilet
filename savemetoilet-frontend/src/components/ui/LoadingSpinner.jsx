// =================================================================
// 🔄 LoadingSpinner - 모던 로딩 컴포넌트
// =================================================================

const LoadingSpinner = ({ message = "현재 위치를\n찾는 중..." }) => (
  <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="text-center">
      {/* 스피너 */}
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent absolute inset-0"></div>
      </div>
      
      {/* 메시지 */}
      <div className="mt-6">
        <p className="text-gray-600 font-medium whitespace-pre-line">
          {message}
        </p>
        <div className="mt-2 flex justify-center space-x-1">
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  </div>
);

export default LoadingSpinner;