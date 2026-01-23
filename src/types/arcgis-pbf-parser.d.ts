declare module 'arcgis-pbf-parser' {
  interface DecodedResult {
    featureCollection: GeoJSON.FeatureCollection;
  }

  function tileDecode(buffer: Uint8Array): DecodedResult;

  export = tileDecode;
}
