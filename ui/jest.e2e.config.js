module.exports = {
  testMatch: ['**/__tests__/e2e/**/*.test.js'],
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/jest.e2e.setup.js'],
  globalSetup: '<rootDir>/jest.e2e.global-setup.js',
  globalTeardown: '<rootDir>/jest.e2e.global-teardown.js',
  forceExit: true,
  detectOpenHandles: true
}