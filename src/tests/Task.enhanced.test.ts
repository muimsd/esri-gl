import { Task, TaskOptions } from '@/Task';

// Mock utils
jest.mock('@/utils', () => ({
  cleanTrailingSlash: jest.fn((url: string) => url.replace(/\/$/, '')),
}));

// Create testable Task subclass
class TestableTask extends Task {
  constructor(endpoint: string | TaskOptions) {
    super(endpoint);
    this.path = 'test';
    this.setters = {
      testSetter: 'testParam',
      anotherSetter: 'anotherParam',
    };

    // Regenerate setters after setting them
    if (this.setters) {
      for (const setter in this.setters) {
        const param = this.setters[setter];
        (this as Record<string, unknown>)[setter] = this.generateSetter(param, this);
      }
    }
  }
}

describe('Task', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create Task instance with string URL', () => {
      const task = new Task('https://example.com/MapServer/');

      expect(task).toBeInstanceOf(Task);
      expect((task as any).options.url).toBe('https://example.com/MapServer');
    });

    it('should create Task instance with options object', () => {
      const options: TaskOptions = {
        url: 'https://example.com/MapServer/',
        token: 'test-token',
        proxy: true,
        useCors: true,
      };

      const task = new Task(options);

      expect(task).toBeInstanceOf(Task);
      expect((task as any).options).toEqual({
        url: 'https://example.com/MapServer',
        token: 'test-token',
        proxy: true,
        useCors: true,
      });
    });

    it('should handle options without URL', () => {
      const options: TaskOptions = {
        token: 'test-token',
        proxy: true,
      };

      const task = new Task(options);

      expect((task as any).options).toEqual({
        token: 'test-token',
        proxy: true,
      });
    });

    it('should initialize params if not set', () => {
      const task = new Task('https://example.com/MapServer');

      expect((task as any).params).toEqual({});
    });

    it('should generate setter methods from setters object', () => {
      const task = new TestableTask('https://example.com/MapServer');

      expect(typeof (task as any).testSetter).toBe('function');
      expect(typeof (task as any).anotherSetter).toBe('function');
    });
  });

  describe('generateSetter method', () => {
    it('should generate a setter function that sets params', () => {
      const task = new TestableTask('https://example.com/MapServer');

      const result = (task as any).testSetter('test-value');

      expect(result).toBe(task);
      expect((task as any).params.testParam).toBe('test-value');
    });

    it('should handle multiple setters', () => {
      const task = new TestableTask('https://example.com/MapServer');

      (task as any).testSetter('value1');
      (task as any).anotherSetter('value2');

      expect((task as any).params.testParam).toBe('value1');
      expect((task as any).params.anotherParam).toBe('value2');
    });
  });

  describe('chainable methods', () => {
    let task: Task;

    beforeEach(() => {
      task = new Task('https://example.com/MapServer');
    });

    it('should set token and return task instance', () => {
      const result = task.token('test-token');

      expect(result).toBe(task);
      expect((task as any).params.token).toBe('test-token');
    });

    it('should set apikey and return task instance', () => {
      const result = task.apikey('test-apikey');

      expect(result).toBe(task);
      expect((task as any).params.token).toBe('test-apikey'); // apikey is alias for token
    });

    it('should set format and return task instance', () => {
      const result = task.format(true);

      expect(result).toBe(task);
      expect((task as any).params.returnUnformattedValues).toBe(false);
    });

    it('should set format false and return task instance', () => {
      const result = task.format(false);

      expect(result).toBe(task);
      expect((task as any).params.returnUnformattedValues).toBe(true);
    });
  });

  describe('request method', () => {
    let mockFetch: jest.MockedFunction<typeof fetch>;
    let task: TestableTask;

    beforeEach(() => {
      mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      task = new TestableTask('https://example.com/MapServer');
    });

    it('should throw error when URL is not provided', async () => {
      const taskWithoutUrl = new Task({});

      await expect(taskWithoutUrl.request()).rejects.toThrow('URL is required for task execution');
    });

    it('should make successful request with basic parameters', async () => {
      const mockResponse = { success: true, data: 'test' };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await task.request();

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/MapServer/test?');
      expect(result).toEqual(mockResponse);
    });

    it('should include task parameters in request URL', async () => {
      const mockResponse = { success: true };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      (task as any).params = {
        param1: 'value1',
        param2: 42,
        param3: true,
      };

      await task.request();

      const expectedUrl = 'https://example.com/MapServer/test?param1=value1&param2=42&param3=true';
      expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
    });

    it('should merge requestParams from options', async () => {
      const mockResponse = { success: true };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      task = new TestableTask({
        url: 'https://example.com/MapServer',
        requestParams: {
          globalParam: 'globalValue',
        },
      });

      (task as any).params = {
        localParam: 'localValue',
      };

      await task.request();

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('globalParam=globalValue');
      expect(callUrl).toContain('localParam=localValue');
    });

    it('should handle array parameters', async () => {
      const mockResponse = { success: true };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      (task as any).params = {
        arrayParam: [1, 2, 3],
        stringParam: 'test',
      };

      await task.request();

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('arrayParam=1%2C2%2C3'); // URL encoded comma
      expect(callUrl).toContain('stringParam=test');
    });

    it('should handle object parameters', async () => {
      const mockResponse = { success: true };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const objectParam = { key: 'value', num: 42 };
      (task as any).params = {
        objectParam,
        stringParam: 'test',
      };

      await task.request();

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain(`objectParam=${encodeURIComponent(JSON.stringify(objectParam))}`);
      expect(callUrl).toContain('stringParam=test');
    });

    it('should skip null and undefined parameters', async () => {
      const mockResponse = { success: true };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      (task as any).params = {
        validParam: 'value',
        nullParam: null,
        undefinedParam: undefined,
        zeroParam: 0,
        falseParam: false,
      };

      await task.request();

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('validParam=value');
      expect(callUrl).toContain('zeroParam=0');
      expect(callUrl).toContain('falseParam=false');
      expect(callUrl).not.toContain('nullParam');
      expect(callUrl).not.toContain('undefinedParam');
    });

    it('should use proxy when configured', async () => {
      const mockResponse = { success: true };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      task = new TestableTask({
        url: 'https://example.com/MapServer',
        proxy: 'https://proxy.example.com/', // proxy is now a string URL
      });

      await task.request();

      // We expect the proxy URL to prefix the request URL
      expect(mockFetch).toHaveBeenCalledWith('https://proxy.example.com/https://example.com/MapServer/test?');
    });

    it('should handle path without leading slash', async () => {
      const mockResponse = { success: true };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      (task as any).path = 'noSlashPath';

      await task.request();

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/MapServer/noSlashPath?');
    });

    it('should handle path with leading slash', async () => {
      const mockResponse = { success: true };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      (task as any).path = '/slashPath';

      await task.request();

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/MapServer/slashPath?');
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      await expect(task.request()).rejects.toThrow('HTTP error! status: 404');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(task.request()).rejects.toThrow('Network error');
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as Response);

      await expect(task.request()).rejects.toThrow('Invalid JSON');
    });

    it('should handle empty path', async () => {
      const mockResponse = { success: true };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      (task as any).path = '';

      await task.request();

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/MapServer/?');
    });
  });

  describe('URL handling edge cases', () => {
    it('should handle URLs with existing trailing slash', () => {
      const task = new Task('https://example.com/MapServer/');

      expect((task as any).options.url).toBe('https://example.com/MapServer');
    });

    it('should handle URLs without trailing slash', () => {
      const task = new Task('https://example.com/MapServer');

      expect((task as any).options.url).toBe('https://example.com/MapServer');
    });

    it('should handle empty string URL in options', () => {
      const task = new Task({ url: '' });

      expect((task as any).options.url).toBe('');
    });
  });

  describe('method chaining', () => {
    it('should support method chaining', () => {
      const task = new Task('https://example.com/MapServer');

      const result = task.token('test-token').apikey('test-key').format(true);

      expect(result).toBe(task);
      expect((task as any).params.token).toBe('test-key'); // apikey overwrites token
      expect((task as any).params.returnUnformattedValues).toBe(false);
    });
  });

  describe('integration with different option types', () => {
    it('should handle all TaskOptions properties', () => {
      const options: TaskOptions = {
        url: 'https://example.com/MapServer/',
        proxy: true,
        useCors: true,
        requestParams: {
          defaultParam: 'defaultValue',
        },
        token: 'initial-token',
        apikey: 'initial-apikey',
      };

      const task = new Task(options);

      expect((task as any).options).toEqual({
        url: 'https://example.com/MapServer',
        proxy: true,
        useCors: true,
        requestParams: {
          defaultParam: 'defaultValue',
        },
        token: 'initial-token',
        apikey: 'initial-apikey',
      });
    });
  });
});
