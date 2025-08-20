module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/integration/**/*.test.ts'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup.ts'
  ],
  testTimeout: 30000, // 30秒超时，适用于集成测试
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/__tests__/**'
  ],
  coverageDirectory: 'coverage/integration',
  coverageReporters: ['text', 'lcov', 'html'],
  globalSetup: '<rootDir>/src/__tests__/integration/globalSetup.ts',
  globalTeardown: '<rootDir>/src/__tests__/integration/globalTeardown.ts'
};