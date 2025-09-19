import { IdentifyImage, identifyImage, IdentifyImageOptions } from '@/IdentifyImage';

// Mock the Task base class
jest.mock('@/Task');

describe('IdentifyImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create IdentifyImage instance with string URL', () => {
      const identifyImg = new IdentifyImage('https://example.com/ImageServer');
      expect(identifyImg).toBeInstanceOf(IdentifyImage);
    });

    it('should create IdentifyImage instance with options object', () => {
      const options: IdentifyImageOptions = {
        url: 'https://example.com/ImageServer',
        returnGeometry: true,
        returnCatalogItems: true
      };
      const identifyImg = new IdentifyImage(options);
      expect(identifyImg).toBeInstanceOf(IdentifyImage);
    });
  });

  describe('chainable methods', () => {
    let identifyImg: IdentifyImage;

    beforeEach(() => {
      identifyImg = new IdentifyImage('https://example.com/ImageServer');
    });

    describe('at method', () => {
      it('should set geometry from lng/lat object', () => {
        const point = { lng: -120, lat: 35 };
        const result = identifyImg.at(point);

        expect(result).toBe(identifyImg);
        expect(JSON.parse((identifyImg as any).params.geometry as string)).toEqual({
          x: -120,
          y: 35,
          spatialReference: { wkid: 4326 }
        });
        expect((identifyImg as any).params.geometryType).toBe('esriGeometryPoint');
        expect((identifyImg as any).params.sr).toBe(4326);
      });

      it('should set geometry from coordinate array', () => {
        const point: [number, number] = [-120, 35];
        const result = identifyImg.at(point);

        expect(result).toBe(identifyImg);
        expect(JSON.parse((identifyImg as any).params.geometry as string)).toEqual({
          x: -120,
          y: 35,
          spatialReference: { wkid: 4326 }
        });
      });
    });

    describe('geometry method', () => {
      it('should set custom geometry with default type', () => {
        const customGeometry = {
          xmin: -121, ymin: 34, xmax: -119, ymax: 36,
          spatialReference: { wkid: 4326 }
        };

        const result = identifyImg.geometry(customGeometry);

        expect(result).toBe(identifyImg);
        expect((identifyImg as any).params.geometry).toBe(JSON.stringify(customGeometry));
        expect((identifyImg as any).params.geometryType).toBe('esriGeometryPoint');
      });

      it('should set custom geometry with specified type', () => {
        const customGeometry = {
          xmin: -121, ymin: 34, xmax: -119, ymax: 36,
          spatialReference: { wkid: 4326 }
        };

        const result = identifyImg.geometry(customGeometry, 'esriGeometryEnvelope');

        expect(result).toBe(identifyImg);
        expect((identifyImg as any).params.geometryType).toBe('esriGeometryEnvelope');
      });
    });

    describe('pixelSize method', () => {
      it('should set pixel size from array', () => {
        const size: [number, number] = [30, 30];
        const result = identifyImg.pixelSize(size);

        expect(result).toBe(identifyImg);
        expect((identifyImg as any).params.pixelSize).toBe('30,30');
      });

      it('should set pixel size from object', () => {
        const size = { x: 30, y: 30 };
        const result = identifyImg.pixelSize(size);

        expect(result).toBe(identifyImg);
        expect((identifyImg as any).params.pixelSize).toBe('30,30');
      });
    });

    describe('returnGeometry method', () => {
      it('should set returnGeometry to true', () => {
        const result = identifyImg.returnGeometry(true);

        expect(result).toBe(identifyImg);
        expect((identifyImg as any).params.returnGeometry).toBe(true);
      });

      it('should set returnGeometry to false', () => {
        const result = identifyImg.returnGeometry(false);

        expect(result).toBe(identifyImg);
        expect((identifyImg as any).params.returnGeometry).toBe(false);
      });
    });

    describe('returnCatalogItems method', () => {
      it('should set returnCatalogItems to true', () => {
        const result = identifyImg.returnCatalogItems(true);

        expect(result).toBe(identifyImg);
        expect((identifyImg as any).params.returnCatalogItems).toBe(true);
      });

      it('should set returnCatalogItems to false', () => {
        const result = identifyImg.returnCatalogItems(false);

        expect(result).toBe(identifyImg);
        expect((identifyImg as any).params.returnCatalogItems).toBe(false);
      });
    });

    describe('mosaicRule method', () => {
      it('should set mosaic rule', () => {
        const rule = {
          mosaicMethod: 'esriMosaicLockRaster',
          lockRasterIds: [1, 2, 3]
        };

        const result = identifyImg.mosaicRule(rule);

        expect(result).toBe(identifyImg);
        expect((identifyImg as any).params.mosaicRule).toBe(JSON.stringify(rule));
      });
    });

    describe('renderingRule method', () => {
      it('should set rendering rule', () => {
        const rule = {
          rasterFunction: 'Stretch',
          rasterFunctionArguments: {
            StretchType: 0,
            MinPercent: 2,
            MaxPercent: 98
          }
        };

        const result = identifyImg.renderingRule(rule);

        expect(result).toBe(identifyImg);
        expect((identifyImg as any).params.renderingRule).toBe(JSON.stringify(rule));
      });
    });
  });

  describe('factory function', () => {
    it('should create IdentifyImage instance with string', () => {
      const identifyImg = identifyImage('https://example.com/ImageServer');
      expect(identifyImg).toBeInstanceOf(IdentifyImage);
    });

    it('should create IdentifyImage instance with options', () => {
      const options: IdentifyImageOptions = {
        url: 'https://example.com/ImageServer',
        returnGeometry: true
      };
      const identifyImg = identifyImage(options);
      expect(identifyImg).toBeInstanceOf(IdentifyImage);
    });
  });

  describe('default parameters', () => {
    it('should have correct default parameters', () => {
      const identifyImg = new IdentifyImage('https://example.com/ImageServer');
      
      expect((identifyImg as any).params.sr).toBe(4326);
      expect((identifyImg as any).params.returnGeometry).toBe(false);
      expect((identifyImg as any).params.returnCatalogItems).toBe(false);
      expect((identifyImg as any).params.f).toBe('json');
    });
  });

  describe('setters configuration', () => {
    it('should have correct setters mapping', () => {
      const identifyImg = new IdentifyImage('https://example.com/ImageServer');
      
      expect((identifyImg as any).setters).toEqual({
        returnCatalogItems: 'returnCatalogItems',
        returnGeometry: 'returnGeometry',
        pixelSize: 'pixelSize',
        token: 'token',
      });
    });

    it('should have correct path', () => {
      const identifyImg = new IdentifyImage('https://example.com/ImageServer');
      expect((identifyImg as any).path).toBe('identify');
    });
  });
});