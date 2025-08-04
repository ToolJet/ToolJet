import '@testing-library/jest-dom';

// Mock global config that was previously provided by webpack externals
// This matches the global config in vite.config.js
global.config = {
  apiUrl: 'http://localhost:3000/api',
  ENVIRONMENT: 'test',
  SERVER_IP: 'localhost',
  COMMENT_FEATURE_ENABLE: true,
  TOOLJET_SERVER_URL: 'http://localhost:3000',
  ENABLE_MULTIPLAYER_EDITING: true,
  ENABLE_MARKETPLACE_DEV_MODE: false,
  TOOLJET_DB_BULK_UPLOAD_MAX_CSV_FILE_SIZE_MB: 5,
  TOOLJET_MARKETPLACE_URL: 'https://tooljet-plugins-production.s3.us-east-2.amazonaws.com',
  TOOLJET_EDITION: 'ce',
  ENABLE_WORKFLOW_SCHEDULING: false,
};

// Mock global object (equivalent to vite's define.global)
global.global = global.config;

// Mock environment variables that are accessed via process.env
process.env.ASSET_PATH = '';
process.env.SERVE_CLIENT = 'true';
process.env.TOOLJET_EDITION = 'ce';

// Mock console methods to reduce noise in tests
// Note: Setup happens in individual test files, not globally

// Mock IntersectionObserver for components that use it
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver for components that use it
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock URL.createObjectURL for file handling tests
global.URL = global.URL || {};
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Mock fetch for API tests
global.fetch = jest.fn();

// Setup cleanup - moved to individual test files