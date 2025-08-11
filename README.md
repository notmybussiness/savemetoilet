# 🚽 SaveMeToilet

급한 상황에서 서울시 공중화장실을 빠르게 찾아주는 웹 애플리케이션입니다.

## ✨ 주요 기능

- 🔴 **긴급도별 화장실 추천**: 상황에 맞는 최적의 화장실 찾기
- 🗺️ **카카오맵 연동**: 실시간 위치 기반 지도 서비스
- 📍 **서울시 공식 데이터**: 4,949개 공중화장실 실시간 정보
- 📱 **반응형 디자인**: 모바일/데스크톱 최적화

## 🛠️ 기술 스택

### Frontend
- React 19 + Vite 7
- Bootstrap 5
- Kakao Map API
- Axios

### Backend  
- Java HTTP Server
- Seoul Open Data API
- CORS 지원

## 🚀 로컬 실행

### 1. 저장소 클론
```bash
git clone https://github.com/notmybussiness/savemetoilet.git
cd savemetoilet
```

### 2. 환경 변수 설정
```bash
# Frontend 환경변수
cp savemetoilet-frontend/.env.example savemetoilet-frontend/.env
# .env 파일에서 VITE_KAKAO_API_KEY 설정
```

### 3. Frontend 실행
```bash
cd savemetoilet-frontend
npm install
npm run dev
```

### 4. Backend 실행
```bash
cd savemetoilet-backend
# 환경변수 설정
export SEOUL_API_KEY=your_seoul_api_key_here
javac SimpleApiTest.java
java SimpleApiTest
```

## 🌐 배포

- **Frontend**: Vercel (https://savemetoilet.vercel.app)
- **Backend**: Railway
- **API Keys**: GitHub Secrets 관리

## 🔑 API 키 발급

### 카카오 Map API
1. [카카오 개발자 콘솔](https://developers.kakao.com/) 접속
2. 앱 생성 후 JavaScript 키 발급
3. 플랫폼 설정에서 도메인 등록

### 서울 공공데이터 API  
1. [서울 열린데이터광장](https://data.seoul.go.kr/) 접속
2. 회원가입 후 API 키 발급
3. SearchPublicToiletPOIService 신청

## 📁 프로젝트 구조

```
savemetoilet/
├── savemetoilet-frontend/    # React 프론트엔드
│   ├── src/
│   │   ├── components/       # React 컴포넌트
│   │   ├── services/         # API 서비스
│   │   └── utils/           # 유틸리티 함수
│   └── public/              # 정적 파일
├── savemetoilet-backend/     # Java 백엔드  
│   ├── SimpleApiTest.java   # HTTP 서버
│   └── Dockerfile           # 컨테이너 설정
└── README.md
```

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch
3. Commit your changes  
4. Push to the branch
5. Open a Pull Request

## 📜 라이센스

MIT License

---

🤖 **Generated with [Claude Code](https://claude.ai/code)**