# Release Notes - June 5, 2025

## Statistics Component and Testing Infrastructure

This release includes substantial improvements to the statistics component and introduces comprehensive testing infrastructure across the project.

### 🐛 Bug Fixes

- Fixed React hydration errors in statistics component causing client/server mismatch
- Corrected API URL construction in tRPC client
- Added proper error handling for API requests
- Improved Redis connection handling with timeouts and graceful fallbacks

### ✨ New Features

- Enhanced statistics component with real-time data updates
- Added formatted number display with proper locale formatting
- Improved loading states and error feedback for better UX

### 🧪 Testing Infrastructure

- Added Jest configuration for frontend unit and integration testing
- Implemented Playwright for E2E testing
- Created comprehensive test coverage for:
  - API client (tRPC)
  - Statistics component
  - Frontend/backend integration

### 📚 Documentation

- Added Testing Strategy documentation (docs/TESTING.md)
- Updated README.md with testing information
- Added PR template and commit message guidelines
- Created .env.example with testing configuration

### 🔧 Performance Improvements

- Reduced unnecessary re-renders in statistics component
- Improved error recovery for better UX
- Added graceful fallbacks for Redis connection issues

### 📋 Test Coverage

- Unit tests: 80%+ for critical components
- E2E test scenarios:
  - Display of real-time statistics data
  - Real-time updates and data refresh
  - Error handling and loading states
  - Responsive design on mobile devices

### 🤝 Contributors

- @gang-gpt-team

### 📦 Dependencies

- Added Jest and React Testing Library for frontend tests
- Added Playwright for E2E testing
