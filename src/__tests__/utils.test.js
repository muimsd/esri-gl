import { cleanTrailingSlash } from '../utils';

describe('utils', () => {
  describe('cleanTrailingSlash', () => {
    it('should remove trailing slash from URL', () => {
      expect(cleanTrailingSlash('https://example.com/')).toBe('https://example.com');
    });

    it('should leave URL without trailing slash unchanged', () => {
      expect(cleanTrailingSlash('https://example.com')).toBe('https://example.com');
    });

    it('should handle multiple trailing slashes', () => {
      expect(cleanTrailingSlash('https://example.com///')).toBe('https://example.com//');
    });
  });
});
