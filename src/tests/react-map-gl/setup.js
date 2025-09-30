// Jest setup for react-map-gl tests
// Mock browser APIs that MapLibre/Mapbox GL need

// Mock window.URL.createObjectURL and revokeObjectURL
global.URL = {
  createObjectURL: jest.fn(() => 'mock-blob-url'),
  revokeObjectURL: jest.fn(),
  ...global.URL,
};

// Mock Blob
global.Blob = jest.fn(() => ({ type: 'text/javascript' }));

// Mock Worker
global.Worker = jest.fn(() => ({
  terminate: jest.fn(),
  postMessage: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock performance
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  navigation: {
    type: 'navigate',
  },
};

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock Image
global.Image = jest.fn(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  src: '',
  onload: null,
  onerror: null,
  width: 256,
  height: 256,
}));

// Mock canvas and WebGL context
const mockCanvas = {
  getContext: jest.fn(() => ({
    clearColor: jest.fn(),
    clear: jest.fn(),
    viewport: jest.fn(),
    createProgram: jest.fn(),
    createShader: jest.fn(),
    attachShader: jest.fn(),
    linkProgram: jest.fn(),
    useProgram: jest.fn(),
    getAttribLocation: jest.fn(() => 0),
    getUniformLocation: jest.fn(() => ({})),
    enableVertexAttribArray: jest.fn(),
    vertexAttribPointer: jest.fn(),
    createBuffer: jest.fn(() => ({})),
    bindBuffer: jest.fn(),
    bufferData: jest.fn(),
    drawArrays: jest.fn(),
    enable: jest.fn(),
    disable: jest.fn(),
    blendFunc: jest.fn(),
    depthFunc: jest.fn(),
    clearDepth: jest.fn(),
    clearStencil: jest.fn(),
    colorMask: jest.fn(),
    depthMask: jest.fn(),
    stencilMask: jest.fn(),
    uniform1f: jest.fn(),
    uniform2f: jest.fn(),
    uniform3f: jest.fn(),
    uniform4f: jest.fn(),
    uniform1i: jest.fn(),
    uniformMatrix4fv: jest.fn(),
    createTexture: jest.fn(() => ({})),
    bindTexture: jest.fn(),
    texImage2D: jest.fn(),
    texParameteri: jest.fn(),
    generateMipmap: jest.fn(),
    activeTexture: jest.fn(),
    deleteTexture: jest.fn(),
    deleteBuffer: jest.fn(),
    deleteProgram: jest.fn(),
    deleteShader: jest.fn(),
    canvas: {
      width: 512,
      height: 512,
      style: {},
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      getBoundingClientRect: jest.fn(() => ({
        left: 0,
        top: 0,
        right: 512,
        bottom: 512,
        width: 512,
        height: 512,
      })),
    },
    drawingBufferWidth: 512,
    drawingBufferHeight: 512,
    MAX_TEXTURE_SIZE: 4096,
    MAX_VERTEX_ATTRIBS: 16,
    MAX_VERTEX_UNIFORM_VECTORS: 128,
    MAX_FRAGMENT_UNIFORM_VECTORS: 16,
    MAX_VARYING_VECTORS: 8,
    getParameter: jest.fn(param => {
      const GL = {
        MAX_TEXTURE_SIZE: 0x0d33,
        MAX_VERTEX_ATTRIBS: 0x8869,
        MAX_VERTEX_UNIFORM_VECTORS: 0x8dfb,
        MAX_FRAGMENT_UNIFORM_VECTORS: 0x8dfd,
        MAX_VARYING_VECTORS: 0x8dfc,
        VERSION: 0x1f02,
        VENDOR: 0x1f00,
        RENDERER: 0x1f01,
      };

      switch (param) {
        case GL.MAX_TEXTURE_SIZE:
          return 4096;
        case GL.MAX_VERTEX_ATTRIBS:
          return 16;
        case GL.MAX_VERTEX_UNIFORM_VECTORS:
          return 128;
        case GL.MAX_FRAGMENT_UNIFORM_VECTORS:
          return 16;
        case GL.MAX_VARYING_VECTORS:
          return 8;
        case GL.VERSION:
          return 'WebGL 1.0';
        case GL.VENDOR:
          return 'Jest';
        case GL.RENDERER:
          return 'Mock WebGL';
        default:
          return null;
      }
    }),
    getExtension: jest.fn(() => null),
    getSupportedExtensions: jest.fn(() => []),
  })),
  width: 512,
  height: 512,
  style: {},
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  getBoundingClientRect: jest.fn(() => ({
    left: 0,
    top: 0,
    right: 512,
    bottom: 512,
    width: 512,
    height: 512,
  })),
};

global.HTMLCanvasElement = jest.fn(() => mockCanvas);

// Mock document.createElement for canvas
const originalCreateElement = document.createElement;
document.createElement = jest.fn(tagName => {
  if (tagName === 'canvas') {
    return mockCanvas;
  }
  return originalCreateElement.call(document, tagName);
});

// Suppress MapLibre/Mapbox console warnings in tests
global.console = {
  ...global.console,
  warn: jest.fn(),
  error: jest.fn(),
};
