# Testing Framework Documentation

This document describes the comprehensive testing framework implemented for the TableTidier systematic review application.

## Overview

The testing framework includes:
- **Unit Tests**: Jest + React Testing Library for component and API testing
- **End-to-End Tests**: Puppeteer for full user workflow testing
- **Test Utilities**: Reusable mocks, fixtures, and helper functions
- **Coverage Reporting**: Automated test coverage tracking

## Test Structure

```
src/__tests__/
├── api/                    # API endpoint tests
│   ├── projects.test.js
│   ├── documents.test.js
│   └── users.test.js
├── components/             # React component tests
│   ├── UploadDocumentModal.test.js
│   ├── ProjectPage.test.js
│   └── AdminPage.test.js
├── e2e/                   # End-to-end tests
│   ├── project-workflow.test.js
│   ├── user-management.test.js
│   └── document-upload.test.js
└── utils/                 # Test utilities and fixtures
    ├── test-utils.js
    ├── mock-data.js
    └── test-helpers.js
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### End-to-End Tests
```bash
# Run E2E tests
npm run test:e2e

# Run all tests (unit + E2E)
npm run test:all
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- Uses Next.js Jest configuration
- JSdom environment for React testing
- Module path mapping for `@/` imports
- Coverage thresholds: 70% for all metrics

### E2E Configuration (`jest.e2e.config.js`)
- Separate configuration for Puppeteer tests
- 30-second timeout for E2E operations
- Global setup/teardown for server management

## Test Utilities

### `test-utils.js`
Provides reusable utilities:
- `mockProject`, `mockDocument`, `mockUser` - Test data fixtures
- `renderWithProviders` - Custom render function with providers
- `mockFetch` - Mock API responses
- `createMockFile` - Create test files for upload testing
- `waitFor` - Async operation helper

### Mock Data
Comprehensive mock data for:
- Projects with statistics and team members
- Documents with metadata and tables
- Users with roles and departments
- API responses for all endpoints

## Test Categories

### 1. API Tests
Tests for all API endpoints:
- Authentication and authorization
- CRUD operations
- Error handling
- Data validation

**Example:**
```javascript
it('should create a new project', async () => {
  const response = await POST(request)
  expect(response.status).toBe(201)
  expect(data.name).toBe('New Project')
})
```

### 2. Component Tests
Tests for React components:
- Rendering and props
- User interactions
- State management
- Error states

**Example:**
```javascript
it('should upload file successfully', async () => {
  const file = createMockFile('test.html')
  await user.upload(fileInput, file)
  await user.click(uploadButton)
  expect(mockProps.onUpload).toHaveBeenCalled()
})
```

### 3. E2E Tests
Full user workflow tests:
- Project creation and management
- Document upload and processing
- Screening decisions
- User authentication flows

**Example:**
```javascript
it('should create a new project successfully', async () => {
  await page.goto('http://localhost:3001/projects')
  await page.click('button:has-text("New Project")')
  await page.type('input[placeholder="Enter project name"]', 'Test Project')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/projects\/test-project-1/)
})
```

## Test Data Management

### Fixtures
- `mockProject` - Complete project object with all fields
- `mockDocument` - Document with metadata, tables, and screening data
- `mockUser` - User with roles and department assignments
- `mockDepartment` - Department with user counts

### API Mocking
- `mockFetch` - Intercept and mock fetch requests
- Response mocking for success and error cases
- Authentication state mocking

## Coverage Requirements

The test suite enforces 70% coverage across:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Best Practices

### Unit Tests
1. **Isolation**: Each test should be independent
2. **Mocking**: Mock external dependencies
3. **Descriptive Names**: Use clear, descriptive test names
4. **Arrange-Act-Assert**: Structure tests clearly

### E2E Tests
1. **Page Objects**: Consider using page object pattern for complex UIs
2. **Wait Strategies**: Use proper wait strategies instead of fixed delays
3. **Data Cleanup**: Clean up test data after each test
4. **Screenshots**: Take screenshots on test failures

### Test Organization
1. **Group Related Tests**: Use `describe` blocks for related tests
2. **Setup/Teardown**: Use `beforeEach`/`afterEach` for common setup
3. **Test Data**: Use consistent test data across tests
4. **Error Testing**: Test both success and error scenarios

## Debugging Tests

### Unit Tests
```bash
# Run specific test file
npm test -- UploadDocumentModal.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should upload file"

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### E2E Tests
```bash
# Run with visible browser
npm run test:e2e -- --headless=false

# Run specific E2E test
npm run test:e2e -- --testNamePattern="should create project"

# Debug mode
npm run test:e2e -- --detectOpenHandles
```

## Continuous Integration

The test suite is designed to run in CI environments:
- Headless browser mode for E2E tests
- Coverage reporting
- Parallel test execution
- Proper cleanup and teardown

## Adding New Tests

### For New Components
1. Create test file in `src/__tests__/components/`
2. Import component and test utilities
3. Write tests for rendering, interactions, and edge cases
4. Ensure 70% coverage

### For New API Endpoints
1. Create test file in `src/__tests__/api/`
2. Mock database models and authentication
3. Test success and error scenarios
4. Verify response format and status codes

### For New E2E Workflows
1. Create test file in `src/__tests__/e2e/`
2. Mock API responses appropriately
3. Test complete user workflows
4. Include error scenarios and edge cases

## Troubleshooting

### Common Issues
1. **Port Conflicts**: Ensure test server runs on different port
2. **Async Operations**: Use proper wait strategies
3. **Mock Data**: Ensure mock data matches expected format
4. **Browser Issues**: Update Puppeteer if browser compatibility issues

### Performance
1. **Parallel Execution**: Tests run in parallel by default
2. **Test Isolation**: Each test should be independent
3. **Resource Cleanup**: Properly close browsers and clear state
4. **Mock Optimization**: Use efficient mocking strategies

This testing framework ensures the systematic review application is robust, reliable, and maintainable.
