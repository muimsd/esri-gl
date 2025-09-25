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
});
