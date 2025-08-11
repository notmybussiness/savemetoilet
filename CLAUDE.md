# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SaveMeToilet is a location-based web service that provides comprehensive toilet location information in Seoul, integrating both public restrooms (via Seoul Open Data API) and commercial facilities (via Kakao Map API). The service categorizes toilets by urgency levels and quality ratings to help users find the most appropriate option for their situation.

### Key Business Logic
- **Urgency-based recommendations**: Emergency (300m radius), Moderate (500m), Relaxed (1km)
- **Dual data sources**: Public toilets (cached locally) + Real-time cafe search
- **Quality scoring**: Weighted algorithm combining distance and facility quality based on urgency level
- **Target franchise cafes**: Starbucks, A Twosome Place, EDIYA Coffee

## Technology Stack

### Backend
- **Framework**: Spring Boot 3.x
- **Database**: SQLite for local caching of public toilet data
- **Build Tool**: Gradle
- **APIs**: Seoul Open Data API, Kakao Map/Local APIs

### Frontend
- **Map Service**: Kakao Map JavaScript API
- **UI Framework**: Bootstrap 5 + Vanilla JavaScript
- **Architecture**: Server-side rendered with AJAX for dynamic content

## Common Development Commands

### Project Setup
```bash
# Create Spring Boot project structure
./gradlew init

# Run development server
./gradlew bootRun

# Build for production
./gradlew build

# Run tests
./gradlew test

# Run specific test class
./gradlew test --tests com.savemetoilet.service.ToiletSearchServiceTest
```

### Database Operations
```bash
# Initialize SQLite database with schema
./gradlew flywayMigrate

# Reset database (development only)
./gradlew flywayClean flywayMigrate
```

## Core System Architecture

### Data Flow Architecture
1. **Public Toilet Data**: Seoul API → Daily Sync Job → SQLite → Fast Local Queries
2. **Cafe Data**: User Request → Real-time Kakao API → Response Aggregation
3. **Search Algorithm**: Combine both sources → Apply urgency weights → Distance-based sorting

### Key Components

#### ToiletSearchService
- **Primary responsibility**: Orchestrates search across both data sources
- **Key method**: `findNearbyToilets(lat, lng, urgency, radius)`
- **Performance target**: <1 second total response time (<100ms local DB + ~500ms Kakao API)

#### DataSyncService
- **Scheduled job**: Daily at 2:00 AM KST
- **API endpoint**: `http://openapi.seoul.go.kr:8088/{API_KEY}/json/SearchPublicToiletPOIService/`
- **Error handling**: Retry logic with exponential backoff for API failures

#### UrgencyCalculator
- **Algorithm**: `score = (1000 - distance) * distance_weight + quality * quality_weight`
- **Weights by urgency**:
  - Emergency: 90% distance, 10% quality
  - Moderate: 60% distance, 40% quality  
  - Relaxed: 30% distance, 70% quality

### API Design Patterns

#### RESTful Endpoints
- `GET /api/v1/toilets/nearby` - Main search endpoint
- `GET /api/v1/locations/search` - Keyword-based location search
- `POST /api/v1/user/preferences` - User settings persistence

#### Response Structure
All API responses follow consistent format:
```json
{
  "success": boolean,
  "data": { ... },
  "error": { "code": string, "message": string }
}
```

### Database Schema

#### public_toilets table
- **Geospatial indexing**: Required on (latitude, longitude) for performance
- **Update strategy**: TRUNCATE and bulk insert daily (small dataset ~1000 records)
- **Required fields**: name, address, latitude, longitude, phone, opening_hours

#### user_sessions table
- **Session management**: Store preferences without user accounts
- **Location caching**: last_lat, last_lng for improved UX
- **Cleanup**: Auto-delete sessions older than 30 days

### External API Integration

#### Seoul Open Data API
- **API Key**: Stored in application.properties as `seoul.api.key`
- **Rate limits**: 1000 calls/day, implement caching to stay within limits
- **Data format**: JSON with nested structure `SearchPublicToiletPOIService.row[]`

#### Kakao API Integration
- **Authentication**: Bearer token in Authorization header
- **Endpoints**: 
  - Local Search: `/v2/local/search/keyword.json`
  - Category Search: Use `category_group_code=CE7` for cafes
- **Rate limits**: 300,000/day per app, implement request batching

### Frontend Architecture

#### Map Integration
- **Kakao Map SDK**: Load via CDN in HTML template
- **Marker system**: Color-coded by urgency level (🔴🟡🟢)
- **Event handling**: Click markers for details, tap urgency buttons for re-filtering

#### Mobile-First Design
- **Viewport**: Responsive breakpoints for mobile/desktop
- **Touch targets**: Minimum 44px for accessibility
- **Performance**: Lazy load non-critical JavaScript

## Development Guidelines

### API Error Handling
- **Kakao API failures**: Graceful degradation to public toilets only
- **Location services**: Fallback to Seoul City Hall coordinates (37.5665, 126.9780)
- **Database errors**: Return cached results with appropriate error status

### Performance Considerations
- **Response time targets**: Total <1s, Local DB <100ms, Kakao API ~500ms
- **Caching strategy**: Redis for frequently accessed locations (if scaling needed)
- **Database queries**: Use prepared statements and connection pooling

### Security Requirements
- **API keys**: Environment variables only, never commit to repository
- **Input validation**: Sanitize all geographic coordinates and user inputs
- **Rate limiting**: Implement per-IP limits to prevent abuse

### Testing Strategy
- **Unit tests**: Service layer business logic, especially UrgencyCalculator
- **Integration tests**: External API mocks for reliable testing
- **Performance tests**: Load testing for concurrent user scenarios

## Configuration Management

### Environment Variables
```properties
# Required API keys
SEOUL_API_KEY=your_seoul_api_key
KAKAO_API_KEY=your_kakao_api_key

# Database
SQLITE_DB_PATH=/data/savemetoilet.db

# Application settings
SYNC_SCHEDULE_CRON=0 0 2 * * *
DEFAULT_SEARCH_RADIUS=500
MAX_RESULTS_PER_REQUEST=50
```

### Profile-specific Settings
- **development**: H2 in-memory database, mock external APIs
- **production**: SQLite file-based, real API endpoints with retry logic

## Deployment Architecture

### Infrastructure Requirements
- **Memory**: 512MB minimum for SQLite + Spring Boot
- **Storage**: 50MB for database, 200MB for application
- **Network**: Stable connection for real-time Kakao API calls

### Monitoring Points
- **API response times**: Track both Seoul API and Kakao API latencies  
- **Search success rate**: Monitor failed searches by location
- **Database sync status**: Alert on failed daily sync jobs
- **Error rates**: Track 4xx/5xx responses by endpoint

## Business Logic Implementation Notes

### Urgency Level Processing
The core differentiator is the urgency-based algorithm. Implementation requires:
1. Distance calculation using Haversine formula for accuracy
2. Quality scoring based on facility type (Starbucks=3, EDIYA=2, Public=1)
3. Dynamic weighting that prioritizes speed for emergency requests

### Data Freshness Strategy
- **Public toilets**: Daily sync acceptable (facilities rarely change)
- **Commercial locations**: Real-time required (store hours, temporary closures)
- **User preferences**: Session-based storage without persistent accounts

### Geolocation Handling
- **Permission flow**: Request → Granted → Search | Denied → Default location
- **Accuracy requirements**: ~100m precision sufficient for toilet finding
- **Fallback strategy**: Manual location entry if geolocation unavailable