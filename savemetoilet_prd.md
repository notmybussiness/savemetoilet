# SaveMeToilet 서비스 PRD

## 1. 개요 및 목적

### 📋 **프로젝트 개요**
**SaveMeToilet**은 서울시 내 공중화장실 위치와 함께 스타벅스, 투썸플레이스, 이디야 등 주요 카페 프랜차이즈의 화장실 정보를 통합 제공하는 위치 기반 웹 서비스입니다.

### 🎯 **서비스 목적**
- **포괄적 솔루션**: 공공 화장실부터 카페 화장실까지 모든 이용 가능한 화장실 정보 제공
- **선택의 다양성**: 상황에 맞는 최적의 화장실 옵션 제시 (무료 vs 구매 필요)
- **실용성 극대화**: 실제 이용 가능한 모든 화장실 정보를 한 곳에서 확인

### 🔍 **해결하고자 하는 문제**
1. **제한된 선택지**: 공중화장실만으로는 커버리지 부족
2. **접근성 차이**: 지역별로 공중화장실 밀도가 다름
3. **시간대 제약**: 공중화장실 운영시간 제한
4. **품질 차이**: 깨끗하고 관리된 화장실에 대한 니즈

### 💡 **핵심 가치 제안**
- **통합 정보**: 공공 + 민간 화장실 정보를 한 번에 제공
- **다양한 옵션**: 무료(공중화장실) vs 구매조건(카페) 선택 가능
- **높은 커버리지**: 서울시 전 지역 촘촘한 화장실 네트워크
- **품질 보장**: 대형 프랜차이즈의 일정 수준 이상 시설

### 🎪 **서비스 범위**

#### **데이터 소스 및 수집 방법**

##### **1. 공중화장실 (정적 데이터)**
- **출처**: 서울시 공공데이터포털 API
- **수집 방식**: 정기 동기화 (일 1회)
- **저장**: 로컬 데이터베이스
- **포함 정보**: 위치, 주소, 운영시간, 연락처

```
API 키: [SEOUL_API_KEY - GitHub Secrets에서 관리]
엔드포인트: Seoul Open Data API - 공중화장실 현황
```

##### **2. 카페 프랜차이즈 (동적 데이터)**
- **출처**: 카카오맵 키워드 검색 API
- **수집 방식**: 실시간 검색 (사용자 위치 기반)
- **검색 키워드**:
  - 🟤 **스타벅스** (Starbucks)
  - 🟠 **투썸플레이스** (A Twosome Place)  
  - 🔵 **이디야커피** (EDIYA Coffee)

#### **화장실 분류 체계**
- 🟢 **무료 이용**: 공중화장실
- 🟡 **구매 조건**: 카페 (음료 구매 시 이용 가능)

#### **기술 구현 방식**
1. **공중화장실**: 서울시 API → 로컬 DB 저장 → 빠른 검색
2. **카페**: 사용자 위치 → 카카오맵 API 실시간 검색 → 결과 병합

```python
# 데이터 통합 로직 예시
def get_nearby_toilets(lat, lng, radius=1000):
    # 1. 로컬 DB에서 공중화장실 검색
    public_toilets = search_public_toilets(lat, lng, radius)
    
    # 2. 카카오맵에서 카페 검색  
    cafes = []
    for brand in ['스타벅스', '투썸플레이스', '이디야']:
        brand_cafes = kakao_search(brand, lat, lng, radius)
        cafes.extend(brand_cafes)
    
    # 3. 결과 통합 및 거리순 정렬
    return merge_and_sort(public_toilets, cafes)
```

### 🏢 **지역 및 플랫폼**
- **지역**: 서울시 전체 (25개 자치구)
- **플랫폼**: 웹 서비스 (모바일 웹 최적화)
- **언어**: 한국어

### ⚡ **성능 고려사항**
- **공중화장실**: 로컬 DB 캐시로 빠른 응답 (<100ms)
- **카페 정보**: 카카오맵 API 호출 (실시간, ~500ms)
- **총 응답시간**: 1초 이내 목표

## 2. 타겟 사용자

### 🎯 **주요 타겟**
**"급하게 화장실이 필요한 모든 사람"**

### 👥 **사용자 세분화**

#### **1차 타겟: 서울시 생활권 이용자**
- **직장인**: 업무 중 외근, 점심시간 이동
- **대학생**: 캠퍼스 밖 활동 시
- **관광객**: 서울 여행 중 
- **지역 주민**: 일상 생활 중

#### **2차 타겟: 특수 상황 사용자**
- **배달원/택시기사**: 업무 중 화장실 이용 제약
- **산책/조깅족**: 운동 중 급한 상황
- **쇼핑객**: 쇼핑몰/시장 이용 시
- **행사 참석자**: 야외 행사/축제 참가 시

### 📱 **사용 시나리오**
1. **긴급 상황**: "지금 당장 화장실 어디 있지?"
2. **사전 계획**: "이 지역 가기 전에 화장실 위치 확인"
3. **선택적 이용**: "깨끗한 화장실 vs 가까운 화장실"

### 🔍 **사용자 니즈**
- **속도**: 빠른 검색 결과
- **정확성**: 실제 이용 가능한 곳만
- **선택권**: 무료 vs 구매조건 옵션
- **편의성**: 별도 앱 설치 없이 웹으로

### 💭 **핵심 사용자 페르소나**
**"김직장 (32세, 회사원)"**
- 강남 직장인, 외근 중 급하게 화장실 필요
- 스마트폰으로 빠르게 검색하고 싶음
- 카페 이용도 괜찮지만 가까운 곳 우선

## 3. 핵심 기능

### 🚨 **급함 정도별 맞춤 추천**

#### **💥 급똥 모드 (Level 1)**
- **검색 반경**: 300m 이내
- **우선순위**: 거리 > 품질
- **필터**: 가장 가까운 곳 무조건
- **표시**: 🔴 "긴급!" 빨간 마커

#### **😰 조금 급함 (Level 2)**  
- **검색 반경**: 500m 이내
- **우선순위**: 거리 + 품질 균형
- **필터**: 가까우면서 괜찮은 곳
- **표시**: 🟡 "빠르게" 노란 마커

#### **🤔 여유 있음 (Level 3)**
- **검색 반경**: 1km 이내  
- **우선순위**: 품질 > 거리
- **필터**: 깨끗한 곳 위주 (스타벅스 등)
- **표시**: 🟢 "쾌적한" 초록 마커

### 🏪 **화장실 품질 등급**

#### **⭐⭐⭐ 프리미엄**
- **스타벅스, 투썸플레이스** (자주 청소, 깔끔)
- **특징**: 구매 필요하지만 깨끗함 보장
- **급함 60-80%일 때 추천**

#### **⭐⭐ 표준**
- **이디야, 일반 카페**
- **지하철역, 대형 공원 화장실**

#### **⭐ 기본**
- **일반 공중화장실**
- **특징**: 무료지만 품질 변동성 있음

### 🎯 **메인 기능**

```javascript
// 사용자 인터페이스 예시
function selectUrgencyLevel() {
    return `
    어느 정도 급하세요?
    
    🔴 [진짜 급해요!] → 300m 내 아무곳이나
    🟡 [좀 급해요] → 500m 내 괜찮은 곳  
    🟢 [여유있어요] → 1km 내 깨끗한 곳
    `;
}
```

### 📍 **검색 알고리즘**
1. **거리 계산**: 현재 위치 기준
2. **품질 스코어**: 브랜드별 가중치
3. **급함 가중치**: 사용자 선택에 따른 거리vs품질 비율

```python
def calculate_toilet_score(distance, quality, urgency_level):
    if urgency_level == "emergency":  # 급똥
        return (1000 - distance) * 0.9 + quality * 0.1
    elif urgency_level == "moderate":  # 조금 급함  
        return (1000 - distance) * 0.6 + quality * 0.4
    else:  # 여유있음
        return (1000 - distance) * 0.3 + quality * 0.7
```

## 4. 화면 설계

### 📱 **메인 화면 (지도 중심)**

```
┌─────────────────────────────────────┐
│ 🚽 SaveMeToilet          [☰ 메뉴]  │
├─────────────────────────────────────┤
│                                     │
│  🗺️         지도 영역               │
│     🔴 급똥 마커                    │
│        🟡 조금급함 마커             │
│           🟢 여유 마커              │
│                 📍현재위치           │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ 얼마나 급하세요?                    │
│ [🔴 진짜급해!] [🟡좀급해] [🟢여유] │
├─────────────────────────────────────┤
│ 📍 내 위치에서 가장 가까운 화장실     │
│ ⭐⭐⭐ 스타벅스 강남역점             │
│ 🚶‍♂️ 2분 거리 (150m) | 구매필요      │
│ [길찾기] [상세정보]                  │
└─────────────────────────────────────┘
```

### 🔍 **상세 정보 모달**

```
┌─────────────────────────────────────┐
│ ⭐⭐⭐ 스타벅스 강남역점      [✕]   │
├─────────────────────────────────────┤
│ 📍 서울시 강남구 강남대로 396       │
│ 🚶‍♂️ 도보 2분 (150m)                │
│ 💰 음료 구매 시 이용 가능           │
│ 🕐 06:00 - 22:00                   │
│ ☎️ 02-1234-5678                    │
├─────────────────────────────────────┤
│ 🏪 화장실 정보                      │
│ • 남성용/여성용 분리                │
│ • 장애인 접근 가능                  │
│ • 기저귀 교환대 있음                │
├─────────────────────────────────────┤
│ [🗺️ 카카오맵 길찾기]               │
│ [📞 전화걸기]                       │
└─────────────────────────────────────┘
```

### ⚙️ **필터/설정 화면**

```
┌─────────────────────────────────────┐
│ 검색 설정                    [뒤로] │
├─────────────────────────────────────┤
│ 🔍 검색 반경                        │
│ ○ 300m  ● 500m  ○ 1km  ○ 2km      │
│                                     │
│ 🏪 화장실 종류                      │
│ ☑️ 공중화장실 (무료)                │
│ ☑️ 스타벅스                         │
│ ☑️ 투썸플레이스                     │
│ ☑️ 이디야커피                       │
│                                     │
│ ⭐ 최소 품질 등급                   │
│ ○ 상관없음  ● 보통이상  ○ 깨끗한곳  │
│                                     │
│ [저장하기]                          │
└─────────────────────────────────────┘
```

### 📋 **목록 보기 (지도 대신)**

```
┌─────────────────────────────────────┐
│ 🚽 내 근처 화장실 (12개)     [지도] │
├─────────────────────────────────────┤
│ 🔴 스타벅스 강남역점               │
│    🚶‍♂️ 2분 · ⭐⭐⭐ · 구매필요     │
│    [길찾기]                         │
├─────────────────────────────────────┤
│ 🟡 강남구청 공중화장실              │
│    🚶‍♂️ 3분 · ⭐⭐ · 무료           │
│    [길찾기]                         │
├─────────────────────────────────────┤
│ 🟢 투썸플레이스 테헤란로점          │
│    🚶‍♂️ 5분 · ⭐⭐⭐ · 구매필요     │
│    [길찾기]                         │
├─────────────────────────────────────┤
│ ⋮ (더보기)                          │
└─────────────────────────────────────┘
```

### 🎨 **UI/UX 핵심 원칙**

#### **1. 원클릭 접근**
- 메인 화면에서 바로 급함 정도 선택
- 선택 즉시 지도에 필터링된 결과 표시

#### **2. 직관적 색상 코딩**
- 🔴 급똥 (빨강) - 긴급함, 위험
- 🟡 조금급함 (노랑) - 주의
- 🟢 여유 (초록) - 안전

#### **3. 정보 우선순위**
1. **거리/시간** (가장 중요)
2. **비용** (무료 vs 구매필요)
3. **품질** (별점)
4. **상세정보** (운영시간, 연락처)

## 5. API 명세

### 🌐 **API 엔드포인트 구조**

```
Base URL: https://api.savemetoilet.com/v1
```

### 📍 **1. 현재 위치 기반 화장실 검색**

#### `GET /toilets/nearby`
**급함 정도별 맞춤 화장실 검색**

```http
GET /toilets/nearby?lat=37.5665&lng=126.9780&urgency=emergency&radius=500
```

**Request Parameters:**
```json
{
  "lat": 37.5665,           // 위도 (required)
  "lng": 126.9780,          // 경도 (required)  
  "urgency": "emergency",   // 급함정도: emergency|moderate|relaxed
  "radius": 500,            // 검색반경(m): 300|500|1000|2000
  "types": ["public", "starbucks", "twosome", "ediya"],  // 화장실 종류 필터
  "min_quality": 1          // 최소 품질등급: 1|2|3
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "toilets": [
      {
        "id": "toilet_001",
        "name": "스타벅스 강남역점",
        "type": "starbucks",
        "category": "cafe",
        "quality_score": 3,
        "distance": 150,
        "walk_time": 2,
        "is_free": false,
        "coordinates": {
          "lat": 37.5665,
          "lng": 126.9780
        },
        "address": "서울시 강남구 강남대로 396",
        "phone": "02-1234-5678",
        "hours": "06:00-22:00",
        "facilities": {
          "disabled_access": true,
          "baby_changing": true,
          "separate_gender": true
        },
        "urgency_match": "high"  // 급함정도와 매칭도
      }
    ],
    "total_count": 12,
    "search_params": {
      "urgency": "emergency",
      "radius": 500
    }
  }
}
```

### 🔍 **2. 키워드 위치 검색**

#### `GET /locations/search`
**특정 장소 기반 주변 화장실 검색**

```http
GET /locations/search?query=강남역&urgency=moderate
```

**Request Parameters:**
```json
{
  "query": "강남역",         // 검색 키워드
  "urgency": "moderate",     // 급함정도
  "radius": 1000            // 검색반경
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "location": {
      "name": "강남역",
      "coordinates": {
        "lat": 37.4979,
        "lng": 127.0276
      }
    },
    "toilets": [/* 화장실 목록 */]
  }
}
```

### ⚙️ **3. 필터 설정**

#### `POST /user/preferences`
**사용자 검색 설정 저장**

```json
{
  "default_radius": 500,
  "preferred_types": ["starbucks", "public"],
  "min_quality": 2,
  "default_urgency": "moderate"
}
```

### 🗺️ **4. 외부 API 연동**

#### **4-1. 브라우저 Geolocation API**
```javascript
// 현재 위치 자동 획득
navigator.geolocation.getCurrentPosition(
  (position) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    searchNearbyToilets(lat, lng);
  },
  (error) => {
    // 위치 권한 거부 시 서울시청 좌표로 기본 설정
    searchNearbyToilets(37.5665, 126.9780);
  }
);
```

#### **4-2. 카카오맵 길찾기 연동**
```javascript
// 길찾기 버튼 클릭 시
function openKakaoNavigation(destLat, destLng, destName) {
  const url = `https://map.kakao.com/link/to/${destName},${destLat},${destLng}`;
  window.open(url, '_blank');
}
```

### 📊 **5. 데이터 소스별 처리**

#### **5-1. 공중화장실 (서울시 API)**
```python
# 백엔드에서 정기 동기화
def sync_public_toilets():
    seoul_api_url = f"http://openapi.seoul.go.kr:8088/{API_KEY}/json/SearchPublicToiletPOIService/1/1000/"
    response = requests.get(seoul_api_url)
    # DB 업데이트 로직
```

#### **5-2. 카페 정보 (카카오맵 API)**
```python
# 실시간 검색
def search_cafes_kakao(lat, lng, keyword, radius):
    headers = {"Authorization": f"KakaoAK {KAKAO_API_KEY}"}
    url = "https://dapi.kakao.com/v2/local/search/keyword.json"
    params = {
        "query": keyword,
        "x": lng,
        "y": lat,
        "radius": radius,
        "category_group_code": "CE7"  # 카페
    }
    return requests.get(url, headers=headers, params=params)
```

### 📝 **에러 코드**
```json
{
  "400": "잘못된 요청 파라미터",
  "404": "검색 결과 없음", 
  "429": "API 호출 한도 초과",
  "500": "서버 오류"
}
```

## 6. 데이터베이스 설계

### 🗄️ **핵심 테이블**

#### **1. 공중화장실 테이블 (public_toilets)**
```sql
CREATE TABLE public_toilets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    address VARCHAR(300),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    opening_hours VARCHAR(100),
    disabled_access BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_location (latitude, longitude)
);
```

#### **2. 사용자 세션 (user_sessions)**
```sql
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id VARCHAR(100) UNIQUE,
    last_lat DECIMAL(10, 8),
    last_lng DECIMAL(11, 8),
    preferred_urgency VARCHAR(20) DEFAULT 'moderate',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 🔄 **데이터 동기화**
```python
# 서울시 API 데이터 가져와서 DB 저장
def sync_seoul_toilets():
    api_url = f"http://openapi.seoul.go.kr:8088/65704b735163756935394e64506b75/json/SearchPublicToiletPOIService/1/1000/"
    response = requests.get(api_url)
    data = response.json()
    
    # DB에 저장
    for toilet in data['SearchPublicToiletPOIService']['row']:
        save_to_db(toilet)
```

## 7. 개발 일정

### 📅 **마일스톤**

#### **1주차: 기본 설정**
- Spring Boot 프로젝트 생성
- 데이터베이스 설정
- 서울시 API 연동 테스트

#### **2주차: 백엔드 API**
- 공중화장실 데이터 동기화
- 위치 기반 검색 API 개발
- 카카오맵 API 연동

#### **3주차: 프론트엔드**
- 지도 화면 구현
- 급함 정도 선택 UI
- 검색 결과 표시

#### **4주차: 완성 및 배포**
- 기능 테스트
- 도메인 연결
- 서비스 오픈

## 8. 기술 스택

### 🛠️ **백엔드**
- **Framework**: Spring Boot 3.x
- **Database**: SQLite (간단한 로컬 DB)
- **Build**: Gradle

### 🌐 **프론트엔드**
- **Map**: 카카오맵 JavaScript API
- **UI**: Bootstrap 5 + 바닐라 JavaScript
- **CSS**: 반응형 웹 디자인

### 🔗 **외부 API**
- 서울시 공중화장실 API
- 카카오맵 키워드 검색 API
- 브라우저 Geolocation API

### 🚀 **배포**
- **Domain**: savemebytoilet.com (GoDaddy 또는 가비아)
- **Hosting**: AWS EC2 또는 네이버 클라우드

---

*이 PRD는 SaveMeToilet 서비스의 핵심 기능에 집중한 최소 기능 제품(MVP) 기준으로 작성되었습니다.*