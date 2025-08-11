# SaveMeToilet Frontend

응급 화장실 찾기 웹앱의 React 프론트엔드입니다.

## 🚀 Quick Start

### 1. 환경 설정
```bash
# 의존성 설치
npm install

# 환경 변수 설정 (.env 파일 생성)
VITE_KAKAO_API_KEY=your_kakao_api_key_here
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

### 2. 개발 서버 실행
```bash
npm run dev
```
서버가 `http://localhost:5173`에서 시작됩니다.

### 3. 빌드 및 배포
```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 🏗️ 프로젝트 구조

```
src/
├── components/           # 재사용 가능한 컴포넌트
│   ├── UrgencySelector.jsx  # 급함 정도 선택 컴포넌트
│   ├── ToiletCard.jsx       # 화장실 정보 카드
│   └── KakaoMap.jsx         # 카카오맵 컴포넌트
├── services/            # API 및 유틸리티 서비스
│   ├── locationService.js   # 위치 관련 서비스
│   └── toiletService.js     # 화장실 검색 서비스
├── App.jsx             # 메인 앱 컴포넌트
└── main.jsx           # 앱 진입점
```

## 🎯 주요 기능

### 📱 Emergency-First UI
- **급함 정도별 검색**: 🔴 진짜급해요 / 🟡 좀급해요 / 🟢 여유있어요
- **모바일 최적화**: 큰 터치 영역과 직관적인 인터페이스
- **빠른 접근**: 원클릭으로 가장 가까운 화장실 찾기

### 🗺️ 지도 기능
- **카카오맵 통합**: 실시간 위치 기반 지도 표시
- **색상 코딩**: 급함 정도에 따른 마커 색상 구분
- **네비게이션**: 카카오맵 길찾기 원클릭 연결

### 🚽 화장실 정보
- **통합 검색**: 공중화장실 + 카페(스타벅스, 투썸플레이스, 이디야)
- **상세 정보**: 거리, 도보시간, 비용, 편의시설
- **실시간 정렬**: 급함 정도와 거리를 고려한 스마트 정렬

## ⚙️ 개발 명령어

```bash
# 개발 서버 시작
npm run dev

# 코드 린팅
npm run lint

# 프로덕션 빌드
npm run build
```

## 🌐 API 연동

### 백엔드 API
- **Base URL**: `http://localhost:8080/api/v1`
- **주요 엔드포인트**:
  - `GET /toilets/nearby` - 주변 화장실 검색
  - `GET /locations/search` - 키워드 기반 위치 검색

### 외부 API
- **카카오맵 API**: 지도 표시 및 검색
- **Geolocation API**: 사용자 현재 위치 획득
