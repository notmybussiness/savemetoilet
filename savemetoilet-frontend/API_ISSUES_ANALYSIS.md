# SaveMeToilet API Issues Analysis & Solutions

## 🧪 Testing Results

### Environment Status ✅
- **Seoul API Key**: ✅ Configured (30 characters)
- **Google Maps API Key**: ✅ Configured (39 characters)
- **Development Server**: ✅ Running on http://localhost:5173

### API Testing Results ❌

## 🏛️ Issue 1: Seoul Open Data API SSL Error

### **Problem**
```
SSL routines:ssl3_get_record:wrong version number
```

### **Root Cause**
Seoul Open Data API의 HTTPS 엔드포인트에서 SSL 프로토콜 버전 호환성 문제

### **Solutions (우선순위 순)**

#### ✅ 해결책 1: HTTP 엔드포인트 사용
```javascript
// 현재 (문제)
const url = `https://openapi.seoul.go.kr:8088/${API_KEY}/json/SearchPublicToiletPOIService/1/1000/`;

// 수정 (권장)
const url = `http://openapi.seoul.go.kr:8088/${API_KEY}/json/SearchPublicToiletPOIService/1/1000/`;
```

#### ✅ 해결책 2: 다중 URL 패턴 (현재 구현됨)
`toiletService.js`에서 이미 구현된 fallback 패턴:
1. HTTPS with port (현재 실패)
2. HTTPS without port 
3. **HTTP with port** ← 이것이 작동할 가능성 높음
4. 축소 요청

#### ✅ 해결책 3: Proxy 서버 구성
```javascript
// vite.config.js에 추가
export default defineConfig({
  server: {
    proxy: {
      '/api/seoul': {
        target: 'http://openapi.seoul.go.kr:8088',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/seoul/, '')
      }
    }
  }
})
```

## 🗺️ Issue 2: Google Maps API 권한 오류

### **Problem**
```
REQUEST_DENIED - This API key is not authorized to use this service or API
```

### **Root Cause Analysis**
API 키에 필요한 서비스들이 활성화되지 않음

### **Required Google Cloud Services**
1. **Maps JavaScript API** ✅ (지도 렌더링용)
2. **Places API** ❌ (카페/상점 검색용)
3. **Geocoding API** ❌ (주소-좌표 변환용)

### **Solutions**

#### ✅ 해결책 1: Google Cloud Console에서 API 활성화
```bash
1. https://console.cloud.google.com/ 접속
2. API 및 서비스 > 라이브러리
3. 다음 API들 활성화:
   - Maps JavaScript API
   - Places API (New)
   - Geocoding API
```

#### ✅ 해결책 2: API 키 권한 설정
```bash
1. API 및 서비스 > 사용자 인증 정보
2. API 키 선택
3. "API 제한사항"에서 다음 추가:
   - Maps JavaScript API
   - Places API
   - Geocoding API
```

#### ✅ 해결책 3: 결제 계정 연결 (필수)
Google Maps Platform은 결제 계정 없이는 사용할 수 없음
- Google Cloud Console > 결제 > 계정 연결

## 🔧 즉시 적용 가능한 수정 사항

### 1. Seoul API URL 수정
```javascript
// src/services/toiletService.js Line 117 수정
const urlPatterns = [
  {
    name: 'HTTP+포트 (권장)',
    url: `http://openapi.seoul.go.kr:8088/${SEOUL_API_KEY}/json/SearchPublicToiletPOIService/1/1000/`
  },
  {
    name: '표준 HTTPS+포트',
    url: `https://openapi.seoul.go.kr:8088/${SEOUL_API_KEY}/json/SearchPublicToiletPOIService/1/1000/`
  },
  // ... 기존 패턴들
];
```

### 2. Google API Fallback 강화
```javascript
// src/services/placesService.js에 추가
const FALLBACK_PLACES = [
  {
    name: 'Starbucks 강남역점 (모의)',
    coordinates: { lat: 37.5665 + 0.001, lng: 126.9780 + 0.001 },
    quality_score: 3,
    distance: 150,
    source: 'fallback'
  }
  // ... 더 많은 모의 데이터
];
```

### 3. Error Boundary 추가
```javascript
// src/components/ErrorBoundary.jsx (새 파일)
class APIErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasAPIError: false, apiErrors: [] };
  }

  static getDerivedStateFromError(error) {
    return { hasAPIError: true };
  }

  render() {
    if (this.state.hasAPIError) {
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3>🔧 API 설정이 필요합니다</h3>
          <p>Google Maps API 키 권한을 확인해주세요.</p>
          <button onClick={() => window.location.reload()}>
            다시 시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

## 📊 테스트 전략

### Phase 1: 기본 기능 테스트
1. ✅ 개발 서버 실행
2. ✅ 위치 권한 요청
3. ❌ Seoul API 연결 (HTTP로 수정 필요)
4. ❌ Google Places API (권한 설정 필요)

### Phase 2: Fallback 테스트
1. Mock 데이터로 UI 테스트
2. 지도 렌더링 테스트
3. 거리 계산 알고리즘 테스트

### Phase 3: 전체 통합 테스트
1. API 수정 후 재테스트
2. 실제 사용자 플로우 테스트
3. 성능 최적화

## 🚀 권장 진행 순서

### 1. 즉시 수정 (10분)
- [ ] Seoul API URL을 HTTP로 변경
- [ ] Error handling 강화

### 2. Google Cloud 설정 (20분)
- [ ] Places API 활성화
- [ ] Geocoding API 활성화
- [ ] 결제 계정 연결

### 3. 테스트 및 검증 (15분)
- [ ] 수정된 API 테스트
- [ ] 전체 기능 검증
- [ ] Git 커밋 및 배포

## 📝 참고 링크

- [Seoul Open Data API 문서](https://data.seoul.go.kr/)
- [Google Maps Platform 가이드](https://developers.google.com/maps/documentation)
- [Places API (New) 문서](https://developers.google.com/maps/documentation/places/web-service/overview)