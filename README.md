# SaveMeToilet 🚽

서울시 화장실 찾기 서비스 - 순수 프론트엔드 웹 애플리케이션

## 🌟 주요 기능

- **긴급도 기반 추천**: 급함 정도에 따라 최적의 화장실 추천
- **실시간 검색**: Seoul Open Data API + Google Places API 연동
- **지도 통합**: Google Maps로 위치 확인 및 길찾기
- **모바일 최적화**: 반응형 디자인으로 모든 기기 지원

## 🚀 기술 스택

- **Frontend**: React 19 + Vite 5.4.8 + Tailwind CSS
- **Maps**: Google Maps JavaScript API
- **Testing**: Vitest for unit/integration tests
- **Deployment**: Vercel

## 📦 설치 및 실행

### 1. 저장소 클론
```bash
git clone https://github.com/notmybussiness/savemetoilet.git
cd savemetoilet/savemetoilet-frontend
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env` 파일을 생성하고 API 키를 설정하세요:

```env
# Google Maps JavaScript API Key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Seoul Open Data API Key
VITE_SEOUL_API_KEY=your_seoul_api_key

# Default coordinates (Seoul City Hall)
VITE_DEFAULT_LAT=37.5665
VITE_DEFAULT_LNG=126.9780
```

### 4. 개발 서버 실행
```bash
npm run dev
```

### 5. 프로덕션 빌드
```bash
npm run build
npm run preview
```

## 🧪 테스트

```bash
# 모든 테스트 실행
npm test

# 특정 테스트 실행
npx vitest run test/integration/basic.test.js

# 커버리지 리포트
npm run test:coverage
```

## 🔑 API 키 발급

### Google Maps JavaScript API
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. Maps JavaScript API 활성화
4. API 키 생성

### Seoul Open Data API
1. [서울 열린데이터 광장](https://data.seoul.go.kr/) 접속
2. 회원가입 및 로그인
3. 공공화장실 현황 API 신청
4. 인증키 발급

## 📱 사용법

1. **위치 권한 허용**: 브라우저에서 위치 권한을 허용하세요
2. **긴급도 선택**: 🔴 급해요 / 🟡 좀 급해요 / 🟢 여유있어요
3. **화장실 검색**: 주변 공중화장실과 카페가 표시됩니다
4. **상세 정보**: 마커를 클릭하면 상세 정보를 확인할 수 있습니다

## 🏗️ 프로젝트 구조

```
savemetoilet-frontend/
├── src/
│   ├── components/         # React 컴포넌트
│   │   ├── GoogleMap.jsx   # 지도 컴포넌트
│   │   ├── ToiletCard.jsx  # 화장실 카드
│   │   └── ui/             # 재사용 가능한 UI 컴포넌트
│   ├── services/           # API 서비스
│   │   ├── toiletService.js    # 화장실 검색 로직
│   │   ├── placesService.js    # Google Places API
│   │   └── locationService.js  # 위치 서비스
│   ├── hooks/              # Custom React 훅
│   └── utils/              # 유틸리티 함수
├── test/                   # 테스트 파일
│   ├── unit/               # 단위 테스트
│   ├── integration/        # 통합 테스트
│   └── e2e/                # E2E 테스트
└── public/                 # 정적 파일
```

## 🌐 배포

현재 Vercel에서 호스팅되고 있습니다:
[https://savemetoilet-frontend-qt2vaviyg-notmybussiness-projects.vercel.app](https://savemetoilet-frontend-qt2vaviyg-notmybussiness-projects.vercel.app)

### 배포하기
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel --prod
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 🔧 문제 해결

### Google Maps API 오류
- API 키가 올바르게 설정되었는지 확인
- Maps JavaScript API가 활성화되었는지 확인
- API 키의 사용량 제한을 확인

### Seoul API 오류  
- API 키가 유효한지 확인
- 일일 호출 한도를 확인
- 네트워크 연결 상태를 확인

## 📞 지원

문제가 있거나 제안사항이 있으시면 [GitHub Issues](https://github.com/notmybussiness/savemetoilet/issues)에 등록해 주세요.