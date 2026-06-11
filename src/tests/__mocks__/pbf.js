// Stub for the `pbf` package (ESM, `type: module`) which jest cannot transform
// out of node_modules. esri-gl decodes ArcGIS PBF tiles via `arcgis-pbf-parser`
// and never exercises `@esri/arcgis-rest-feature-service`'s pbf path in tests,
// so a no-op stub is sufficient to let the module graph load.
class Pbf {
  constructor() {}
  readFields() {
    return {};
  }
  readMessage() {
    return {};
  }
}

module.exports = Pbf;
module.exports.default = Pbf;
