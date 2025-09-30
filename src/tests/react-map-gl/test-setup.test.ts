import { describe, it, expect, jest } from '@jest/globals';

// Simple test to check Jest is working
describe('React Map GL Test Setup', () => {
  it('should run basic test', () => {
    expect(true).toBe(true);
  });

  it('should have jest mock functions', () => {
    const mockFn = jest.fn();
    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
  });
});
