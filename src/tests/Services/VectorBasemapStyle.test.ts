import { VectorBasemapStyle } from '@/Services/VectorBasemapStyle';

describe('VectorBasemapStyle', () => {
  describe('Constructor', () => {
    it('should create VectorBasemapStyle instance with API key', () => {
      const service = new VectorBasemapStyle('ArcGIS:Streets', 'test-api-key');

      expect(service).toBeInstanceOf(VectorBasemapStyle);
      expect(service.styleName).toBe('ArcGIS:Streets');
    });

    it('should throw error if API key is not provided', () => {
      expect(() => {
        new VectorBasemapStyle('ArcGIS:Streets');
      }).toThrow('An Esri API Key must be supplied to consume vector basemap styles');

      expect(() => {
        new VectorBasemapStyle('ArcGIS:Streets', '');
      }).toThrow('An Esri API Key must be supplied to consume vector basemap styles');
    });

    it('should use default style name if not provided', () => {
      const service = new VectorBasemapStyle(undefined, 'test-api-key');

      expect(service.styleName).toBe('ArcGIS:Streets');
    });

    it('should accept custom style name', () => {
      const service = new VectorBasemapStyle('ArcGIS:Topographic', 'test-api-key');

      expect(service.styleName).toBe('ArcGIS:Topographic');
    });
  });

  describe('styleUrl Generation', () => {
    it('should generate correct style URL', () => {
      const service = new VectorBasemapStyle('ArcGIS:Streets', 'test-api-key');

      expect(service.styleUrl).toBe(
        'https://basemaps-api.arcgis.com/arcgis/rest/services/styles/ArcGIS:Streets?type=style&apiKey=test-api-key'
      );
    });

    it('should generate URL with different style names', () => {
      const streetService = new VectorBasemapStyle('ArcGIS:Streets', 'test-api-key');
      const topoService = new VectorBasemapStyle('ArcGIS:Topographic', 'test-api-key');
      const imageryService = new VectorBasemapStyle('ArcGIS:Imagery', 'test-api-key');

      expect(streetService.styleUrl).toContain('ArcGIS:Streets');
      expect(topoService.styleUrl).toContain('ArcGIS:Topographic');
      expect(imageryService.styleUrl).toContain('ArcGIS:Imagery');
    });

    it('should include API key in URL', () => {
      const service = new VectorBasemapStyle('ArcGIS:Streets', 'my-secret-api-key');

      expect(service.styleUrl).toContain('apiKey=my-secret-api-key');
    });
  });

  describe('Style Management', () => {
    it('should allow changing style name', () => {
      const service = new VectorBasemapStyle('ArcGIS:Streets', 'test-api-key');

      service.setStyle('ArcGIS:Imagery');

      expect(service.styleName).toBe('ArcGIS:Imagery');
      expect(service.styleUrl).toContain('ArcGIS:Imagery');
    });

    it('should update styleUrl when style name changes', () => {
      const service = new VectorBasemapStyle('ArcGIS:Streets', 'test-api-key');
      
      const originalUrl = service.styleUrl;
      service.setStyle('ArcGIS:Navigation');
      const updatedUrl = service.styleUrl;

      expect(originalUrl).not.toBe(updatedUrl);
      expect(originalUrl).toContain('ArcGIS:Streets');
      expect(updatedUrl).toContain('ArcGIS:Navigation');
    });
  });

  describe('Service Methods', () => {
    it('should have update method that does nothing', () => {
      const service = new VectorBasemapStyle('ArcGIS:Streets', 'test-api-key');
      
      // Should not throw error
      expect(() => service.update()).not.toThrow();
    });

    it('should have remove method that does nothing', () => {
      const service = new VectorBasemapStyle('ArcGIS:Streets', 'test-api-key');
      
      // Should not throw error
      expect(() => service.remove()).not.toThrow();
    });
  });

  describe('Real-world Usage Patterns', () => {
    it('should support standard Esri basemap styles', () => {
      const styles = [
        'ArcGIS:Streets',
        'ArcGIS:TopographicBase', 
        'ArcGIS:Imagery',
        'ArcGIS:DarkGray',
        'ArcGIS:LightGray',
        'ArcGIS:Navigation',
        'ArcGIS:StreetsNight'
      ];

      styles.forEach(styleName => {
        const service = new VectorBasemapStyle(styleName, 'test-api-key');
        expect(service.styleName).toBe(styleName);
        expect(service.styleUrl).toContain(styleName);
      });
    });

    it('should work with production API keys', () => {
      const productionApiKey = 'AAPKa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6';
      const service = new VectorBasemapStyle('ArcGIS:Streets', productionApiKey);

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

      expect(service.styleName).toBe('ArcGIS:Streets');
    });

    it('should handle style names with special characters', () => {
      const styleName = 'ArcGIS:Streets-Dark_v2';
      const service = new VectorBasemapStyle(styleName, 'test-api-key');

      expect(service.styleName).toBe(styleName);
      expect(service.styleUrl).toContain(styleName);
    });

    it('should handle API keys with special characters', () => {
      const apiKey = 'test-key-with-special-chars_123';
      const service = new VectorBasemapStyle('ArcGIS:Streets', apiKey);

      expect(service.styleUrl).toContain(`apiKey=${apiKey}`);
    });

    it('should handle null style name by using default', () => {
      const service = new VectorBasemapStyle(null as unknown as string, 'test-api-key');

      expect(service.styleName).toBe('ArcGIS:Streets');
    });

    it('should handle undefined API key', () => {
      expect(() => {
        new VectorBasemapStyle('ArcGIS:Streets', undefined as unknown as string);
      }).toThrow('An Esri API Key must be supplied to consume vector basemap styles');
    });

    it('should handle null API key', () => {
      expect(() => {
        new VectorBasemapStyle('ArcGIS:Streets', null as unknown as string);
      }).toThrow('An Esri API Key must be supplied to consume vector basemap styles');
    });

    it('should maintain API key when changing styles', () => {
      const apiKey = 'persistent-api-key';
      const service = new VectorBasemapStyle('ArcGIS:Streets', apiKey);

      service.setStyle('ArcGIS:Imagery');

      expect(service.styleUrl).toContain(`apiKey=${apiKey}`);
    });
  });
});