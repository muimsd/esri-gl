// Setup for mapbox-gl in Jest tests

// Add TextDecoder/TextEncoder for mapbox-gl
const { TextDecoder, TextEncoder } = require('util');
global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;

const mapboxgl = require('mapbox-gl');

// Set a test token for mapbox-gl
mapboxgl.accessToken = 'pk.test.token';

// Mock mapbox-gl worker to avoid issues in Jest environment
// @ts-ignore
mapboxgl.workerClass = class Worker {
  constructor() {
    // Mock worker
  }
  postMessage() {
    // Mock worker postMessage
  }
  terminate() {
    // Mock worker terminate
  }
};

// Global setup for browser APIs that mapbox-gl needs
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Mock fetch if not already mocked
if (!global.fetch) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    })
  );
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    // Mock implementation
  }
  observe() {
    // Mock observe
  }
  unobserve() {
    // Mock unobserve
  }
  disconnect() {
    // Mock disconnect
  }
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback, options) {
    // Mock implementation
  }
  observe() {
    // Mock observe
  }
  unobserve() {
    // Mock unobserve
  }
  disconnect() {
    // Mock disconnect
  }
  root = null;
  rootMargin = '';
  thresholds = [];
  takeRecords = () => [];
};

// Mock WebGL context
const mockWebGLContext = {
  getExtension: jest.fn(),
  getParameter: jest.fn(() => 'mock'),
  createBuffer: jest.fn(),
  createTexture: jest.fn(),
  createProgram: jest.fn(),
  createShader: jest.fn(),
  shaderSource: jest.fn(),
  compileShader: jest.fn(),
  attachShader: jest.fn(),
  linkProgram: jest.fn(),
  useProgram: jest.fn(),
  getAttribLocation: jest.fn(() => 0),
  getUniformLocation: jest.fn(() => 0),
  bindBuffer: jest.fn(),
  bufferData: jest.fn(),
  enableVertexAttribArray: jest.fn(),
  vertexAttribPointer: jest.fn(),
  drawArrays: jest.fn(),
  canvas: {
    width: 800,
    height: 600,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
};

// Mock canvas getContext
HTMLCanvasElement.prototype.getContext = jest.fn(contextType => {
  if (contextType === 'webgl' || contextType === 'webgl2') {
    return mockWebGLContext;
  }
  return null;
});

module.exports = mapboxgl;
