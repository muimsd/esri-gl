declare module '@mapbox/tilebelt' {
  export function bboxToTile(bbox: [number, number, number, number]): [number, number, number];
  export function tileToBBOX(tile: [number, number, number]): [number, number, number, number];
  export function tileToQuadkey(tile: [number, number, number]): string;
  export function quadkeyToTile(quadkey: string): [number, number, number];
  export function getChildren(tile: [number, number, number]): [number, number, number][];
  export function getParent(tile: [number, number, number]): [number, number, number];
  export function getSiblings(tile: [number, number, number]): [number, number, number][];
  export function hasSiblings(
    tile: [number, number, number],
    tiles: [number, number, number][]
  ): boolean;
  export function hasTile(
    tiles: [number, number, number][],
    tile: [number, number, number]
  ): boolean;
  export function tilesEqual(
    tile1: [number, number, number],
    tile2: [number, number, number]
  ): boolean;
  export function tileToGeoJSON(tile: [number, number, number]): GeoJSON.Polygon;
  export function pointToTile(lon: number, lat: number, z: number): [number, number, number];
  export function pointToTileFraction(
    lon: number,
    lat: number,
    z: number
  ): [number, number, number];
}
