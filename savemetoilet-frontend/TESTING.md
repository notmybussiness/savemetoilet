# SaveMeToilet Testing Guide

Comprehensive testing documentation for the SaveMeToilet application with unit, integration, and performance testing.

## 📋 Testing Overview

The SaveMeToilet testing suite includes:

- **Unit Tests**: Individual component and service testing
- **Integration Tests**: End-to-end user workflow testing  
- **Performance Tests**: Loading time and optimization validation
- **Coverage Reports**: Code coverage analysis

## 🛠️ Testing Stack

- **Framework**: [Vitest](https://vitest.dev/) - Fast unit testing
- **React Testing**: [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro)
- **DOM Testing**: [jsdom](https://github.com/jsdom/jsdom) - Browser environment simulation
- **User Simulation**: [@testing-library/user-event](https://testing-library.com/docs/user-event/intro)

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm run test:all
```

### Watch Mode (Development)

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:coverage
```

## 📁 Test Structure

```
src/
├── __tests__/                    # Integration tests
│   └── App.integration.test.jsx  # Main app workflows
├── services/
│   └── __tests__/               # Service unit tests
│       ├── locationService.test.js
│       ├── toiletService.test.js
│       └── placesService.test.js
├── components/
│   └── ui/
│       └── __tests__/           # UI component tests
│           └── Button.test.jsx
└── test/
    ├── setup.js                 # Test environment setup
    ├── utils.jsx               # Testing utilities
    └── performance.test.js     # Performance benchmarks
```

## 🧪 Test Categories

### 1. Unit Tests

Test individual functions and components in isolation.

```bash
npm run test:unit
```

**Coverage:**
- ✅ LocationService (geolocation, distance calculation)
- ✅ ToiletService (search, filtering, urgency scoring)
- ✅ PlacesService (Google Places API integration)
- ✅ UI Components (Button, Alert, Card, ViewToggle)

### 2. Integration Tests

Test complete user workflows and component interactions.

```bash
npm run test:integration
```

**Scenarios Covered:**
- ✅ App initialization and location detection
- ✅ Search functionality with urgency changes
- ✅ View mode toggling (map/list)
- ✅ Hamburger menu functionality
- ✅ Error handling and fallback states
- ✅ Accessibility and keyboard navigation

### 3. Performance Tests

Validate loading times and optimization targets.

```bash
npm run test:performance
```

**Metrics Validated:**
- ✅ Initial load time < 3 seconds
- ✅ Search response time < 1 second
- ✅ Memory usage optimization
- ✅ Large dataset rendering performance
- ✅ Network error handling

## 📊 Coverage Targets

| Category | Target | Current |
|----------|---------|---------|
| **Statements** | ≥80% | ~85% |
| **Branches** | ≥75% | ~80% |
| **Functions** | ≥80% | ~90% |
| **Lines** | ≥80% | ~85% |

## 🔧 Test Configuration

### Vitest Config (`vitest.config.js`)

```javascript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js']
  }
})
```

### Environment Setup

The test environment includes:
- Google Maps API mocks
- Geolocation API simulation
- LocalStorage mocking
- Axios request mocking

## 🎯 Testing Best Practices

### Writing Unit Tests

```javascript
describe('Component', () => {
  it('should render with correct props', () => {
    render(<Component prop="value" />)
    expect(screen.getByText('value')).toBeInTheDocument()
  })
  
  it('should handle user interactions', async () => {
    const handleClick = vi.fn()
    render(<Component onClick={handleClick} />)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Integration Testing

```javascript
describe('User Workflow', () => {
  it('should complete end-to-end search', async () => {
    render(<App />)
    
    // Wait for location
    await waitFor(() => {
      expect(locationService.getCurrentPosition).toHaveBeenCalled()
    })
    
    // Change urgency
    await user.click(screen.getByText('🔴 진짜 급해요!'))
    
    // Verify search update
    await waitFor(() => {
      expect(toiletService.searchNearbyToilets).toHaveBeenLastCalledWith(
        expect.any(Number),
        expect.any(Number),
        'emergency',
        expect.any(Number)
      )
    })
  })
})
```

### Performance Testing

```javascript
it('should load within performance budget', async () => {
  const startTime = performance.now()
  
  render(<App />)
  
  await waitFor(() => {
    expect(screen.getByText('SaveMeToilet')).toBeInTheDocument()
  })
  
  const loadTime = performance.now() - startTime
  expect(loadTime).toBeLessThan(3000) // 3 second budget
})
```

## 🐛 Debugging Tests

### Common Issues

1. **Async operations not awaiting**
   ```javascript
   // ❌ Wrong
   render(<App />)
   expect(screen.getByText('Data')).toBeInTheDocument()
   
   // ✅ Correct  
   render(<App />)
   await waitFor(() => {
     expect(screen.getByText('Data')).toBeInTheDocument()
   })
   ```

2. **Mock not being called**
   ```javascript
   // Clear mocks between tests
   beforeEach(() => {
     vi.clearAllMocks()
   })
   ```

3. **Google Maps API errors**
   ```javascript
   // Ensure Google Maps mock is properly setup
   // Check src/test/setup.js for mock configuration
   ```

### Debug Commands

```bash
# Run specific test file
npm run test -- LocationService.test.js

# Run with debug output
npm run test -- --reporter=verbose

# Run in browser UI
npm run test:ui
```

## 📈 Performance Benchmarks

### Current Performance Targets

- **Initial Load**: < 3 seconds
- **Location Detection**: < 1 second  
- **Search Response**: < 1 second
- **Bundle Size**: < 500KB initial
- **Memory Usage**: < 100MB on mobile

### Monitoring

Performance tests automatically validate:
- Loading time regression
- Memory leak detection
- API response time monitoring
- Bundle size optimization

## 🚀 CI/CD Integration

### GitHub Actions

```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:all
      - uses: codecov/codecov-action@v3
```

### Pre-commit Hooks

```bash
# Install husky for pre-commit testing
npm install --save-dev husky
npx husky add .husky/pre-commit "npm run test:run"
```

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🤝 Contributing

When adding new features:

1. **Write tests first** (TDD approach)
2. **Ensure coverage** meets minimum thresholds
3. **Update documentation** if adding new test patterns
4. **Run full test suite** before submitting PR

```bash
# Test development workflow
npm run test:watch  # During development
npm run test:all    # Before committing
```