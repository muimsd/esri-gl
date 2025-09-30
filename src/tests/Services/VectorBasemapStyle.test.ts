import { VectorBasemapStyle } from '@/Services/VectorBasemapStyle';

describe('VectorBasemapStyle', () => {
  describe('Constructor', () => {
    it('should create VectorBasemapStyle instance with API key', () => {
      const service = new VectorBasemapStyle('arcgis/streets', 'test-api-key');

      expect(service).toBeInstanceOf(VectorBasemapStyle);
      expect(service.styleName).toBe('arcgis/streets');
    });

    it('should throw error if API key is not provided', () => {
      expect(() => {
        new VectorBasemapStyle('arcgis/streets');
      }).toThrow('An Esri API Key must be supplied to consume vector basemap styles');
    });

    it('should throw error if API key is empty string', () => {
      expect(() => {
        new VectorBasemapStyle('arcgis/streets', '');
      }).toThrow('An Esri API Key must be supplied to consume vector basemap styles');
    });

    it('should use default style name if not provided', () => {
      const service = new VectorBasemapStyle(undefined, 'test-api-key');

      expect(service.styleName).toBe('arcgis/streets');
    });

    it('should accept custom style name', () => {
      const service = new VectorBasemapStyle('arcgis/topographic', 'test-api-key');

      expect(service.styleName).toBe('arcgis/topographic');
    });
  });

  describe('styleUrl Generation', () => {
    it('should generate correct style URL', () => {
      const service = new VectorBasemapStyle('arcgis/streets', 'test-api-key');

      expect(service.styleUrl).toBe(
        'https://basemaps-api.arcgis.com/arcgis/rest/services/styles/v1/styles/arcgis/streets?type=style&apiKey=test-api-key'
      );
    });

    it('should generate URL with different style names', () => {
      const streetService = new VectorBasemapStyle('arcgis/streets', 'test-api-key');
      const topoService = new VectorBasemapStyle('arcgis/topographic', 'test-api-key');
      const imageryService = new VectorBasemapStyle('arcgis/imagery', 'test-api-key');

      expect(streetService.styleUrl).toContain('arcgis/streets');
      expect(topoService.styleUrl).toContain('arcgis/topographic');
      expect(imageryService.styleUrl).toContain('arcgis/imagery');
    });

    it('should include API key in URL', () => {
      const service = new VectorBasemapStyle('arcgis/streets', 'my-secret-api-key');

      expect(service.styleUrl).toContain('apiKey=my-secret-api-key');
    });
  });

  describe('Style Management', () => {
    it('should allow changing style name', () => {
      const service = new VectorBasemapStyle('arcgis/streets', 'test-api-key');

      service.setStyle('arcgis/imagery');

      expect(service.styleName).toBe('arcgis/imagery');
      expect(service.styleUrl).toContain('arcgis/imagery');
    });

    it('should update styleUrl when style name changes', () => {
      const service = new VectorBasemapStyle('arcgis/streets', 'test-api-key');

      const originalUrl = service.styleUrl;
      service.setStyle('arcgis/navigation');
      const updatedUrl = service.styleUrl;

      expect(originalUrl).not.toBe(updatedUrl);
      expect(originalUrl).toContain('arcgis/streets');
      expect(updatedUrl).toContain('arcgis/navigation');
    });
  });

  describe('Service Methods', () => {
    it('should have update method that does nothing', () => {
      const service = new VectorBasemapStyle('arcgis/streets', 'test-api-key');

      // Should not throw error
      expect(() => service.update()).not.toThrow();
    });

    it('should have remove method that does nothing', () => {
      const service = new VectorBasemapStyle('arcgis/streets', 'test-api-key');

      // Should not throw error
      expect(() => service.remove()).not.toThrow();
    });
  });

  describe('applyStyle Static Method', () => {
    let mockMap: { setStyle: jest.Mock };

    beforeEach(() => {
      mockMap = {
        setStyle: jest.fn(),
      };
    });

    it('should apply style using API key', () => {
      VectorBasemapStyle.applyStyle(mockMap, 'arcgis/streets', { apiKey: 'test-api-key' });

      expect(mockMap.setStyle).toHaveBeenCalledWith(
        'https://basemaps-api.arcgis.com/arcgis/rest/services/styles/v1/styles/arcgis/streets?type=style&apiKey=test-api-key'
      );
    });

    it('should apply style using token', () => {
      VectorBasemapStyle.applyStyle(mockMap, 'arcgis/topographic', { token: 'test-token' });

      expect(mockMap.setStyle).toHaveBeenCalledWith(
        'https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles/arcgis/topographic?f=style&token=test-token'
      );
    });

    it('should apply style with language and worldview options', () => {
      VectorBasemapStyle.applyStyle(mockMap, 'arcgis/navigation', {
        apiKey: 'test-api-key',
        language: 'es',
        worldview: 'es',
      });

      expect(mockMap.setStyle).toHaveBeenCalledWith(
        'https://basemaps-api.arcgis.com/arcgis/rest/services/styles/v1/styles/arcgis/navigation?type=style&apiKey=test-api-key&language=es&worldview=es'
      );
    });

    it('should call setStyle only once', () => {
      VectorBasemapStyle.applyStyle(mockMap, 'arcgis/imagery', { apiKey: 'test-api-key' });

      expect(mockMap.setStyle).toHaveBeenCalledTimes(1);
    });

    it('should work with different style names', () => {
      const styles = ['arcgis/streets', 'arcgis/topographic', 'arcgis/dark-gray', 'arcgis/imagery'];

      styles.forEach(styleName => {
        VectorBasemapStyle.applyStyle(mockMap, styleName, { apiKey: 'test-key' });
      });

      expect(mockMap.setStyle).toHaveBeenCalledTimes(styles.length);
    });
  });

  describe('Real-world Usage Patterns', () => {
    it('should support standard Esri basemap styles', () => {
      const styles = [
        'arcgis/streets',
        'arcgis/topographic',
        'arcgis/imagery',
        'arcgis/dark-gray',
        'arcgis/light-gray',
        'arcgis/navigation',
        'arcgis/streets-night',
      ];

      styles.forEach(styleName => {
        const service = new VectorBasemapStyle(styleName, 'test-api-key');
        expect(service.styleName).toBe(styleName);
        expect(service.styleUrl).toContain(styleName);
      });
    });

    it('should work with production API keys', () => {
      const productionApiKey = 'AAPKa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6';
      const service = new VectorBasemapStyle('arcgis/streets', productionApiKey);

      expect(service.styleUrl).toContain(`apiKey=${productionApiKey}`);
    });

    it('should handle custom style names for enterprise users', () => {
      const customStyleName = 'MyOrg:CustomBasemap';
      const service = new VectorBasemapStyle(customStyleName, 'enterprise-api-key');

      expect(service.styleName).toBe(customStyleName);
      expect(service.styleUrl).toContain('MyOrg:CustomBasemap');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string style name by using default', () => {
      const service = new VectorBasemapStyle('', 'test-api-key');

      expect(service.styleName).toBe('arcgis/streets');
    });

    it('should handle style names with special characters', () => {
      const styleName = 'arcgis/streets-dark';
      const service = new VectorBasemapStyle(styleName, 'test-api-key');

      expect(service.styleName).toBe(styleName);
      expect(service.styleUrl).toContain(styleName);
    });

    it('should handle API keys with special characters', () => {
      const apiKey = 'test-key-with-special-chars_123';
      const service = new VectorBasemapStyle('arcgis/streets', apiKey);

      expect(service.styleUrl).toContain(`apiKey=${apiKey}`);
    });

    it('should handle null style name by using default', () => {
      const service = new VectorBasemapStyle(null as unknown as string, 'test-api-key');

      expect(service.styleName).toBe('arcgis/streets');
    });

    it('should handle undefined API key', () => {
      expect(() => {
        new VectorBasemapStyle('arcgis/streets', undefined as unknown as string);
      }).toThrow('An Esri API Key must be supplied to consume vector basemap styles');
    });

    it('should handle null API key', () => {
      expect(() => {
        new VectorBasemapStyle('arcgis/streets', null as unknown as string);
      }).toThrow('An Esri API Key must be supplied to consume vector basemap styles');
    });

    it('should maintain API key when changing styles', () => {
      const apiKey = 'persistent-api-key';
      const service = new VectorBasemapStyle('arcgis/streets', apiKey);

      service.setStyle('arcgis/imagery');

      expect(service.styleUrl).toContain(`apiKey=${apiKey}`);
    });
  });

  describe('Edge Cases and Private Method Coverage', () => {
    it('should handle empty string style name (defaults to arcgis/streets)', () => {
      const service = new VectorBasemapStyle('', 'test-api-key');
      expect(service.styleName).toBe('arcgis/streets');
    });

    it('should preserve original legacy colon syntax in styleName', () => {
      const service = new VectorBasemapStyle('arcgis:imagery', 'test-api-key');
      expect(service.styleName).toBe('arcgis:imagery'); // Original format preserved
    });

    it('should preserve original CamelCase legacy styles in styleName', () => {
      const service = new VectorBasemapStyle('arcgis:streetsnight', 'test-api-key');
      expect(service.styleName).toBe('arcgis:streetsnight'); // Original format preserved
    });

    it('should preserve original underscore legacy styles in styleName', () => {
      const service = new VectorBasemapStyle('arcgis:streetsrelief', 'test-api-key');
      expect(service.styleName).toBe('arcgis:streetsrelief'); // Original format preserved
    });

    it('should leave unknown legacy colon syntax unchanged', () => {
      const service = new VectorBasemapStyle('ArcGIS:CustomStyle', 'test-api-key');
      expect(service.styleName).toBe('ArcGIS:CustomStyle'); // Should remain unchanged
    });

    it('should preserve original unknown arcgis: patterns in styleName', () => {
      // styleName should preserve original input format
      const service = new VectorBasemapStyle('arcgis:MyCustomStyle', 'test-api-key');
      expect(service.styleName).toBe('arcgis:MyCustomStyle'); // Original preserved
    });

    it('should preserve original CamelCase in styleName', () => {
      const service = new VectorBasemapStyle('arcgis:StreetsReliefCustom', 'test-api-key');
      expect(service.styleName).toBe('arcgis:StreetsReliefCustom'); // Original preserved
    });

    it('should preserve original underscores in styleName', () => {
      const service = new VectorBasemapStyle('arcgis:custom_style_name', 'test-api-key');
      expect(service.styleName).toBe('arcgis:custom_style_name'); // Original preserved
    });

    it('should leave already slash format style names unchanged', () => {
      const service = new VectorBasemapStyle('arcgis/custom-enterprise-style', 'test-api-key');
      expect(service.styleName).toBe('arcgis/custom-enterprise-style');
    });

    it('should leave non-ArcGIS style names unchanged for enterprise', () => {
      const service = new VectorBasemapStyle('enterprise/custom-style', 'test-api-key');
      expect(service.styleName).toBe('enterprise/custom-style');
    });

    it('should handle colon syntax without token part', () => {
      const service = new VectorBasemapStyle('ArcGIS:', 'test-api-key');
      expect(service.styleName).toBe('ArcGIS:'); // Should leave unchanged when no token
    });

    it('should handle setStyle with null/empty name', () => {
      const service = new VectorBasemapStyle('arcgis/streets', 'test-api-key');
      service.setStyle('' as any);
      // setStyle with empty string should not change the style
      const urlBefore = service.styleUrl;
      service.setStyle(null as any);
      expect(service.styleUrl).toBe(urlBefore);
    });

    it('should preserve original input in styleName for legacy formats', () => {
      const testCases = [
        { input: 'arcgis:streets', expected: 'arcgis:streets' },
        { input: 'arcgis:topographic', expected: 'arcgis:topographic' },
        { input: 'arcgis:imagery', expected: 'arcgis:imagery' },
        { input: 'arcgis:oceans', expected: 'arcgis:oceans' },
        { input: 'arcgis:streetsnight', expected: 'arcgis:streetsnight' },
        { input: 'arcgis:darkgray', expected: 'arcgis:darkgray' },
        { input: 'arcgis:lightgray', expected: 'arcgis:lightgray' },
      ];

      testCases.forEach(({ input, expected }) => {
        const service = new VectorBasemapStyle(input, 'test-api-key');
        expect(service.styleName).toBe(expected); // styleName preserves original input
      });
    });

    it('should convert legacy formats to canonical in styleUrl', () => {
      const testCases = [
        { input: 'arcgis:streets', canonical: 'arcgis/streets' },
        { input: 'arcgis:topographic', canonical: 'arcgis/topographic' },
        { input: 'arcgis:imagery', canonical: 'arcgis/imagery' },
        { input: 'arcgis:oceans', canonical: 'arcgis/oceans' },
        { input: 'arcgis:streetsnight', canonical: 'arcgis/streets-night' },
        { input: 'arcgis:darkgray', canonical: 'arcgis/dark-gray' },
        { input: 'arcgis:lightgray', canonical: 'arcgis/light-gray' },
      ];

      testCases.forEach(({ input, canonical }) => {
        const service = new VectorBasemapStyle(input, 'test-api-key');
        expect(service.styleUrl).toContain(canonical); // URL uses canonical format
      });
    });

    it('should apply smart conversion for unknown arcgis patterns in URL', () => {
      const testCases = [
        { input: 'arcgis:MyCustomStyle', canonical: 'arcgis/my-custom-style' },
        { input: 'arcgis:StreetsReliefCustom', canonical: 'arcgis/streets-relief-custom' },
        { input: 'arcgis:custom_style_name', canonical: 'arcgis/custom-style-name' },
      ];

      testCases.forEach(({ input, canonical }) => {
        const service = new VectorBasemapStyle(input, 'test-api-key');
        expect(service.styleName).toBe(input); // Original preserved
        expect(service.styleUrl).toContain(canonical); // URL uses converted format
      });
    });

    it('should handle constructor with token-based options', () => {
      const service = new VectorBasemapStyle('arcgis/streets', {
        token: 'test-token',
        language: 'es',
        worldview: 'GCS_WGS_1984',
      });

      expect(service.styleUrl).toContain('token=test-token');
      expect(service.styleUrl).toContain('language=es');
      expect(service.styleUrl).toContain('worldview=GCS_WGS_1984');
    });

    it('should handle constructor with API key options object', () => {
      const service = new VectorBasemapStyle('arcgis/streets', {
        apiKey: 'test-api-key',
        language: 'fr',
      });

      expect(service.styleUrl).toContain('apiKey=test-api-key');
      expect(service.styleUrl).toContain('language=fr');
    });

    it('should throw error when neither apiKey nor token provided in options', () => {
      expect(() => {
        new VectorBasemapStyle('arcgis/streets', {
          language: 'en',
        } as any);
      }).toThrow('An Esri API Key must be supplied to consume vector basemap styles');
    });

    it('should handle version determination correctly', () => {
      // v1 with API key
      const v1Service = new VectorBasemapStyle('arcgis/streets', 'test-api-key');
      expect(v1Service.styleUrl).toContain('basemaps-api.arcgis.com');
      expect(v1Service.styleUrl).toContain('v1/styles');

      // v2 with token
      const v2Service = new VectorBasemapStyle('arcgis/streets', { token: 'test-token' });
      expect(v2Service.styleUrl).toContain('basemapstyles-api.arcgis.com');
      expect(v2Service.styleUrl).toContain('v2/styles');
    });
  });
});
