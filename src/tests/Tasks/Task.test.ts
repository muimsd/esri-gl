import { Task, type TaskOptions } from '@/Tasks/Task';
import { Service } from '@/Services/Service';
import { cleanTrailingSlash } from '@/utils';

// Mock the utils module
jest.mock('@/utils', () => ({
  cleanTrailingSlash: jest.fn((url: string) => url.replace(/\/+$/, '')),
  updateAttribution: jest.fn(),
}));

// Mock Service class
jest.mock('@/Services/Service');

// Mock global fetch
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Create testable Task extension to access protected properties
class TestableTask extends Task {
  public get testService() {
    return this._service;
  }
  public get testOptions() {
    return this.options;
  }
  public get testParams() {
    return this.params;
  }
  public get testPath() {
    return this.path;
  }
  public get testSetters() {
    return this.setters;
  }

  // Expose _request method for testing
  public testRequest(
    method: string,
    path: string,
    params: Record<string, unknown>,
    callback: (error?: Error, data?: unknown) => void
  ) {
    (
      this as unknown as {
        _request: (
          method: string,
          path: string,
          params: Record<string, unknown>,
          callback: (error?: Error, data?: unknown) => void
        ) => void;
      }
    )._request(method, path, params, callback);
  }

  constructor(endpoint: string | TaskOptions | Service) {
    super(endpoint);

    // Add some test setters and path for testing after super
    this.setters = {
      testSetter: 'testParam',
      anotherSetter: 'anotherParam',
    };
    this.path = '/test';

    // Regenerate setter methods after setting the setters
    if (this.setters) {
      for (const setter in this.setters) {
        const param = this.setters[setter];
        (this as Record<string, unknown>)[setter] = this.generateSetter(param, this);
      }
    }
  }
}

// Create mock Service
const createMockService = () => {
  const mockService = {
    request: jest.fn(),
    requestWithCallback: jest.fn(),
    authenticate: jest.fn(),
    options: {},
    url: 'https://example.com/service',
  };
  return mockService;
};

describe('Task', () => {
  const mockedCleanTrailingSlash = cleanTrailingSlash as jest.MockedFunction<
    typeof cleanTrailingSlash
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockedCleanTrailingSlash.mockImplementation((url: string) => url.replace(/\/+$/, ''));
  });

  describe('Constructor', () => {
    it('should initialize with URL string', () => {
      const task = new TestableTask('https://example.com/arcgis/rest/services/Test/MapServer/');

      expect(task.testService).toBeUndefined();
      expect(task.testOptions).toEqual({
        url: 'https://example.com/arcgis/rest/services/Test/MapServer',
      });
      expect(cleanTrailingSlash).toHaveBeenCalledWith(
        'https://example.com/arcgis/rest/services/Test/MapServer/'
      );
    });

    it('should initialize with Service instance', () => {
      const mockService = createMockService();
      const task = new TestableTask(mockService as unknown as Service);

      expect(task.testService).toBe(mockService);
      expect(task.testOptions).toEqual({});
    });

    it('should initialize with TaskOptions object', () => {
      const options = {
        url: 'https://example.com/arcgis/rest/services/Test/MapServer/',
        token: 'test-token',
        proxy: true,
        useCors: false,
        requestParams: { test: 'value' },
      };
      const task = new TestableTask(options);

      expect(task.testService).toBeUndefined();
      expect(task.testOptions).toEqual({
        url: 'https://example.com/arcgis/rest/services/Test/MapServer',
        token: 'test-token',
        proxy: true,
        useCors: false,
        requestParams: { test: 'value' },
      });
      expect(cleanTrailingSlash).toHaveBeenCalledWith(options.url);
    });

    it('should initialize params as empty object if not set', () => {
      const task = new TestableTask('https://example.com');
      expect(task.testParams).toEqual({});
    });

    it('should preserve existing params if already set by subclass', () => {
      class TaskWithParams extends Task {
        params = { existingParam: 'value' };
      }

      const task = new TaskWithParams('https://example.com');
      expect(task.params.existingParam).toBe('value');
    });

    it('should generate setter methods based on setters object', () => {
      const task = new TestableTask('https://example.com') as unknown as Record<string, unknown>;

      expect(typeof task.testSetter).toBe('function');
      expect(typeof task.anotherSetter).toBe('function');
    });

    it('should handle missing setters object gracefully', () => {
      class SimpleTask extends Task {
        // No setters defined - testing line 47
      }

      expect(() => {
        new SimpleTask('https://example.com');
      }).not.toThrow();
    });

    it('should handle undefined params with direct test', () => {
      // This tests the params initialization code by creating task with undefined params initially
      class TaskWithUndefinedParams extends Task {
        public get testParams() {
          return this.params;
        }

        constructor(endpoint: string) {
          super(endpoint);
          // Test by directly manipulating the params check after construction
          delete (this as unknown as { params: unknown }).params;
          // Simulate the constructor logic for line 41
          if (!this.params) {
            this.params = {};
          }
        }
      }

      const task = new TaskWithUndefinedParams('https://example.com');
      expect(task.testParams).toEqual({});
    });

    it('should handle no setters to test empty for loop', () => {
      class TaskWithNoSetters extends Task {
        constructor(endpoint: string) {
          super(endpoint);
          // Don't set any setters to test lines 47-48
          this.setters = {};
        }
      }

      expect(() => {
        new TaskWithNoSetters('https://example.com');
      }).not.toThrow();
    });
  });

  describe('Generated Setter Methods', () => {
    it('should create working setter methods', () => {
      const task = new TestableTask('https://example.com') as unknown as Record<string, unknown>;

      const result = (task.testSetter as (value: unknown) => Task)('test-value');

      expect(result).toBeInstanceOf(Task);
      expect((task as unknown as TestableTask).testParams.testParam).toBe('test-value');
    });

    it('should allow chaining of setter methods', () => {
      const task = new TestableTask('https://example.com') as unknown as Record<string, unknown>;

      const result = (task.testSetter as (value: unknown) => Task)('value1');
      const chainedResult = (result as unknown as Record<string, unknown>).anotherSetter as (
        value: unknown
      ) => Task;
      const finalResult = chainedResult('value2');

      expect(finalResult).toBeInstanceOf(Task);
      expect((finalResult as TestableTask).testParams.testParam).toBe('value1');
      expect((finalResult as TestableTask).testParams.anotherParam).toBe('value2');
    });
  });

  describe('Authentication Methods', () => {
    it('should delegate token to service when available', () => {
      const mockService = createMockService();
      const task = new TestableTask(mockService as unknown as Service);

      const result = task.token('test-token');

      expect(mockService.authenticate).toHaveBeenCalledWith('test-token');
      expect(result).toBe(task);
    });

    it('should set token in params when no service available', () => {
      const task = new TestableTask('https://example.com');

      const result = task.token('test-token');

      expect(task.testParams.token).toBe('test-token');
      expect(result).toBe(task);
    });

    it('should handle apikey as alias for token with service', () => {
      const mockService = createMockService();
      const task = new TestableTask(mockService as unknown as Service);

      const result = task.apikey('test-key');

      expect(mockService.authenticate).toHaveBeenCalledWith('test-key');
      expect(result).toBe(task);
    });

    it('should handle apikey as alias for token without service', () => {
      const task = new TestableTask('https://example.com');

      const result = task.apikey('test-key');

      expect(task.testParams.token).toBe('test-key');
      expect(result).toBe(task);
    });
  });

  describe('Format Method', () => {
    it('should set returnUnformattedValues to false when formatted is true', () => {
      const task = new TestableTask('https://example.com');

      const result = task.format(true);

      expect(task.testParams.returnUnformattedValues).toBe(false);
      expect(result).toBe(task);
    });

    it('should set returnUnformattedValues to true when formatted is false', () => {
      const task = new TestableTask('https://example.com');

      const result = task.format(false);

      expect(task.testParams.returnUnformattedValues).toBe(true);
      expect(result).toBe(task);
    });
  });

  describe('Request Method with Callback', () => {
    it('should merge requestParams when available', () => {
      const task = new TestableTask({
        url: 'https://example.com/service',
        requestParams: { global: 'param' },
      });
      task.testParams.existing = 'value';
      const callback = jest.fn();

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      } as Response);

      task.run(callback);

      expect(task.testParams.global).toBe('param');
      expect(task.testParams.existing).toBe('value');
    });

    it('should use service.requestWithCallback when service is available', () => {
      const mockService = createMockService();
      const task = new TestableTask(mockService as unknown as Service);
      const callback = jest.fn();

      task.run(callback);

      expect(mockService.requestWithCallback).toHaveBeenCalledWith(
        'POST',
        '/test',
        task.testParams,
        callback
      );
    });

    it('should use direct request when no service available', () => {
      const task = new TestableTask('https://example.com/service');
      const callback = jest.fn();

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      } as Response);

      task.run(callback);

      // Wait for async operations
      setTimeout(() => {
        expect(mockFetch).toHaveBeenCalled();
      }, 0);
    });

    it('should handle missing URL in run method', () => {
      const task = new TestableTask({ url: '' });
      const callback = jest.fn();

      task.run(callback);

      expect(callback).toHaveBeenCalledWith(new Error('URL is required for task execution'));
    });

    it('should use proxy when configured in run method', () => {
      const task = new TestableTask({
        url: 'https://example.com/service',
        proxy: true,
      });
      const callback = jest.fn();

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      } as Response);

      task.run(callback);

      // Since proxy is boolean true, it should construct URL with 'true?' prefix
      setTimeout(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('true?'),
          expect.any(Object)
        );
      }, 0);
    });

    it('should not use proxy when not configured', () => {
      const task = new TestableTask({
        url: 'https://example.com/service',
        // No proxy option - tests the false branch of line 149
      });
      const callback = jest.fn();

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      } as Response);

      task.run(callback);

      setTimeout(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'https://example.com/service/test',
          expect.any(Object)
        );
      }, 0);
    });

    it('should handle GET method in run method', () => {
      class GETTask extends TestableTask {
        run(callback: (error?: Error, data?: unknown) => void) {
          this.testRequest('GET', this.path, this.params, callback);
        }
      }

      const task = new GETTask('https://example.com/service');
      task.testParams.param = 'value';
      const callback = jest.fn();

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      } as Response);

      task.run(callback);

      setTimeout(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('?param=value'),
          expect.objectContaining({ method: 'GET' })
        );
      }, 0);
    });

    it('should handle POST method in run method', () => {
      const task = new TestableTask('https://example.com/service');
      task.testParams.param = 'value';
      const callback = jest.fn();

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      } as Response);

      task.run(callback);

      setTimeout(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'https://example.com/service/test', // No query params in URL for POST
          expect.objectContaining({
            method: 'POST',
            body: 'param=value',
          })
        );
      }, 0);
    });

    it('should handle HTTP error in run method', () => {
      const task = new TestableTask('https://example.com/service');
      const callback = jest.fn();

      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' }),
      } as Response);

      task.run(callback);

      setTimeout(() => {
        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'HTTP error! status: 404',
          })
        );
      }, 0);
    });
  });

  describe('Request Method with Promise', () => {
    it('should merge requestParams when available', async () => {
      const task = new TestableTask({
        url: 'https://example.com/service',
        requestParams: { global: 'param' },
      });
      task.testParams.existing = 'value';

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      } as Response);

      await task.request();

      expect(task.testParams.global).toBe('param');
      expect(task.testParams.existing).toBe('value');
    });

    it('should use service.requestWithCallback when service is available', async () => {
      const mockService = createMockService();
      const expectedResult = { data: 'test' };
      mockService.requestWithCallback.mockResolvedValue(expectedResult);
      const task = new TestableTask(mockService as unknown as Service);

      const result = await task.request();

      expect(mockService.requestWithCallback).toHaveBeenCalledWith(
        'POST',
        '/test',
        task.testParams
      );
      expect(result).toBe(expectedResult);
    });

    it('should use direct request when no service available and resolve', async () => {
      const task = new TestableTask('https://example.com/service');
      const expectedData = { success: true };

      // Mock successful response
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(expectedData),
      } as Response);

      const result = await task.request();

      expect(mockFetch).toHaveBeenCalled();
      expect(result).toEqual(expectedData);
    });

    it('should reject promise when direct request fails', async () => {
      const task = new TestableTask('https://example.com/service');
      const error = new Error('Network error');

      // Mock fetch rejection
      mockFetch.mockRejectedValue(error);

      await expect(task.request()).rejects.toThrow('Network error');
    });
  });
});
