# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SaveMeToilet is a **pure frontend** location-based web service that provides comprehensive toilet location information in Seoul. The app directly integrates public restrooms (via Seoul Open Data API) and commercial facilities (via Google Places API), eliminating the need for a backend server.

### Key Business Logic
- **Urgency-based recommendations**: Emergency (300m radius), Moderate (500m), Relaxed (1km)
- **Dual data sources**: Public toilets (Seoul API) + Real-time Google Places search
- **Quality scoring**: Weighted algorithm combining distance and facility quality based on urgency level
- **Target franchise cafes**: Starbucks, A Twosome Place, EDIYA Coffee
- **Local storage**: User preferences saved in browser localStorage

## Technology Stack

### Frontend (Pure Client-Side Application)
- **Map Service**: Google Maps JavaScript API
- **UI Framework**: React 19 + Vite 5.4.8 + Tailwind CSS
- **Architecture**: Single-page application with component-based architecture
- **APIs**: Direct Seoul Open Data API + Google Places API integration
- **Storage**: Browser localStorage for user preferences
- **Deployment**: Vercel (frontend hosting)
- **Testing**: Vitest for unit and integration tests

## Common Development Commands

### Project Setup
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests with coverage
npm run test:coverage
```

### Testing Commands
```bash
# Run specific test file
npx vitest run test/integration/basic.test.js

# Run tests in watch mode
npm run test:watch

# Generate test coverage report
npm run test:coverage
```

### Deployment Commands
```bash
# Deploy to Vercel
vercel --prod

# Check deployment status
vercel list
```

## Core System Architecture

### Data Flow Architecture (Pure Frontend)
1. **Public Toilet Data**: Direct Seoul API calls → Real-time response → Client-side processing
2. **Commercial Places**: Direct Google Places API calls → Real-time cafe search
3. **User Preferences**: Browser localStorage → Client-side persistence
4. **Search Algorithm**: Combine both sources → Apply urgency weights → Distance-based sorting

### Key Components

#### ToiletService (`src/services/toiletService.js`)
- **Primary responsibility**: Orchestrates search across both data sources
- **Key method**: `searchNearbyToilets(lat, lng, urgency, radius)`
- **API Integration**: Direct Seoul API + Google Places API calls
- **Performance target**: <2 seconds total response time
- **Error handling**: Graceful fallback to mock data

#### PlacesService (`src/services/placesService.js`)
- **Responsibility**: Google Places API integration for commercial locations
- **Key methods**: `searchCommercialPlaces()`, `searchLocation()`
- **Place types**: Cafes, restaurants, department stores

#### LocationService (`src/services/locationService.js`)
- **Responsibility**: Geolocation handling and location utilities
- **Features**: Browser geolocation, coordinate validation, fallback locations

#### UrgencyCalculator (within ToiletService)
- **Algorithm**: `score = (1000 - distance) * distance_weight + quality * quality_weight`
- **Weights by urgency**:
  - Emergency: 90% distance, 10% quality
  - Moderate: 60% distance, 40% quality  
  - Relaxed: 30% distance, 70% quality

### API Integration Patterns

#### Direct API Calls (Client-Side)
- **Seoul Open Data API**: `http://openapi.seoul.go.kr:8088/{API_KEY}/json/SearchPublicToiletPOIService/`
- **Google Places API**: Text Search and Nearby Search for commercial locations
- **Google Maps JavaScript API**: Map rendering and geocoding services

#### Response Structure
ToiletService returns consistent format:
```json
{
  "success": boolean,
  "data": {
    "toilets": [...],
    "total_count": number,
    "sources": {
      "public": number,
      "commercial": number
    }
  },
  "error": string
}
```

### Client-Side Data Management

#### Local Storage Schema
- **Key**: `toiletapp_preferences`
- **Data**: User preferences (urgency, radius, place types)
- **Format**: JSON with lastUpdated timestamp
- **Expiration**: Client-side management, no automatic cleanup

#### In-Memory Caching
- **Mock Data**: Fallback toilet locations for error cases
- **Place Types**: Available commercial place categories
- **Urgency Configs**: Predefined urgency level settings

### External API Integration

#### Seoul Open Data API
- **API Key**: Stored in `.env` as `VITE_SEOUL_API_KEY`
- **Rate limits**: 1000 calls/day, real-time calls without caching
- **Data format**: JSON with nested structure `SearchPublicToiletPOIService.row[]`
- **CORS**: Publicly accessible, direct frontend calls supported

#### Google Places API Integration
- **Authentication**: API key in environment variables
- **Endpoints**: 
  - Text Search: For location queries and commercial places
  - Nearby Search: For proximity-based commercial location discovery
- **Rate limits**: Per-request billing, optimized for cost efficiency

### Frontend Architecture

#### Map Integration
- **Google Maps JavaScript API**: Modern map rendering with clustering
- **Marker system**: Color-coded by urgency level and toilet type
- **Event handling**: Interactive markers with info windows, responsive urgency selection

#### Component Structure
```
src/
├── components/
│   ├── GoogleMap.jsx          # Main map component
│   ├── ToiletCard.jsx         # Toilet detail cards
│   ├── UrgencySelector.jsx    # Urgency level selector
│   ├── layout/                # Layout components
│   ├── toilet/                # Toilet-specific components
│   └── ui/                    # Reusable UI components
├── services/
│   ├── toiletService.js       # Main business logic
│   ├── placesService.js       # Google Places integration
│   └── locationService.js     # Geolocation utilities
├── hooks/
│   ├── useGeolocation.js      # Location management
│   ├── useGoogleMaps.js       # Maps API integration
│   └── useToiletSearch.js     # Search state management
└── test/
    ├── unit/                  # Component and service tests
    ├── integration/           # Feature integration tests
    └── e2e/                   # End-to-end tests
```

#### Mobile-First Design
- **Responsive**: Tailwind CSS with mobile-first breakpoints
- **Touch targets**: Optimized for mobile interaction
- **Performance**: Vite optimization and code splitting

## Development Guidelines

### API Error Handling
- **Seoul API failures**: Graceful degradation with mock data fallback
- **Google Places failures**: Continue with public toilets only
- **Location services**: Fallback to Seoul City Hall coordinates (37.5665, 126.9780)
- **Network errors**: User-friendly error messages with retry options

### Performance Considerations
- **Response time targets**: Total <2s, API calls optimized for mobile networks
- **Caching strategy**: Browser localStorage for user preferences
- **Bundle optimization**: Vite code splitting and tree shaking
- **API efficiency**: Batched requests where possible

### Security Requirements
- **API keys**: Environment variables only, never commit to repository
- **Input validation**: Sanitize all geographic coordinates and user inputs
- **CORS handling**: Proper cross-origin configuration for API calls

### Testing Strategy
- **Unit tests**: Service layer business logic, utility functions
- **Integration tests**: Component integration and API interaction
- **Basic functionality**: Core features tested with Vitest
- **Test coverage**: Focus on critical business logic paths

## Testing Framework

### Test Structure
```
test/
├── unit/                    # Unit tests for individual components/services
│   ├── Button.test.jsx      # UI component tests
│   ├── toiletService.test.js # Business logic tests
│   ├── placesService.test.js # API integration tests
│   └── locationService.test.js # Utility function tests
├── integration/             # Integration tests for features
│   ├── basic.test.js        # Core functionality tests
│   └── App.integration.test.jsx # Full app integration
└── e2e/                     # End-to-end tests
    └── performance.test.js   # Performance and user flow tests
```

### Test Commands
- `npm test` - Run all tests
- `npx vitest run test/integration/basic.test.js` - Run specific test
- `npm run test:coverage` - Generate coverage reports

### Current Test Status
✅ **8/8 basic functionality tests passing**
- ToiletService core functions
- Distance calculations
- Urgency scoring
- Quality descriptions
- Search statistics
- Preferences handling

## Configuration Management

### Environment Variables
```properties
# Required API keys
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
VITE_SEOUL_API_KEY=your_seoul_api_key_here

# Default coordinates (Seoul City Hall)
VITE_DEFAULT_LAT=37.5665
VITE_DEFAULT_LNG=126.9780

# Search Configuration
VITE_DEFAULT_RADIUS=500
VITE_MAX_RESULTS=50
```

### Development vs Production
- **development**: Local development server with hot reloading
- **production**: Optimized build deployed to Vercel

## Deployment Architecture

### Current Deployment Status
- **Frontend**: ✅ Deployed on Vercel
- **URL**: https://savemetoilet-frontend-qt2vaviyg-notmybussiness-projects.vercel.app
- **Build Status**: ✅ Successful (Vite 5.4.8)
- **Backend**: ❌ Removed (Pure frontend application)

### Infrastructure Requirements
- **Hosting**: Static site hosting (Vercel)
- **Storage**: Browser localStorage (no server-side storage)
- **Network**: Reliable connection for real-time API calls

### Monitoring Points
- **API response times**: Track Seoul API and Google Places API latencies
- **Search success rate**: Monitor failed searches and fallback usage
- **Error rates**: Client-side error tracking and user experience metrics
- **Performance**: Core Web Vitals and loading times

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

## Recent Updates (2025-08-12)

### ✅ Major Architecture Migration Completed
**Migration**: Backend removal and pure frontend implementation
- **Before**: Java backend + React frontend (dual deployment)
- **After**: Pure React frontend with direct API integration
- **Benefits**: Simplified architecture, reduced costs, easier maintenance

### 🏗️ Backend Removal (2025-08-12)
**Removed Components**:
- Java Spring Boot backend server
- Fly.io deployment configuration
- Database layer and data synchronization
- Server-side API endpoints

**Replaced With**:
- Direct Seoul Open Data API integration
- Google Places API for commercial locations
- Browser localStorage for user preferences
- Client-side business logic and state management

### 🧪 Testing Infrastructure Setup (2025-08-12)
**Test Organization**:
- ✅ Organized tests in `test/` folder structure
- ✅ Unit tests for services and components
- ✅ Integration tests for core functionality
- ✅ All 8 basic functionality tests passing

**Test Coverage**:
- ToiletService business logic
- Distance calculations and urgency scoring
- Quality descriptions and statistics
- Error handling and fallback mechanisms

### 🚀 Current Deployment Status
- **Frontend**: ✅ Successfully deployed on Vercel
- **URL**: https://savemetoilet-frontend-qt2vaviyg-notmybussiness-projects.vercel.app
- **Build**: ✅ Vite 5.4.8 (fixed Rollup compatibility issues)
- **Backend**: ❌ Removed (no longer needed)

### 🔐 Security Status
- ✅ All API keys properly managed in environment variables
- ✅ No sensitive data in repository
- ✅ Direct API calls with proper CORS handling
- ✅ Client-side input validation

### 📱 Application Features
- **Map Integration**: Google Maps with interactive markers
- **Location Services**: Browser geolocation with fallbacks
- **Search Types**: Public toilets + commercial locations
- **Urgency Levels**: Emergency, Moderate, Relaxed with custom algorithms
- **Data Sources**: Seoul Open Data + Google Places
- **Offline Capability**: Mock data fallback for network issues
- to memorize
- to memorize
- to memorize
- to memorize