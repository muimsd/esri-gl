# VectorBasemapStyle

Access Esri's professionally designed vector basemap styles through the ArcGIS Basemaps API.

## Interactive Demo

<iframe
  src="/examples/vector-basemap-style.html"
  width="100%"
  height="500"
  style={{border: '1px solid #ccc', borderRadius: '4px'}}>
</iframe>

*Switch between different Esri vector basemap styles with your API key*

## Quick Start

```typescript
import { VectorBasemapStyle } from 'esri-gl';

// Simple way — static helper
VectorBasemapStyle.applyStyle(map, 'arcgis/streets', { apiKey: 'YOUR_API_KEY' });

// Advanced way — instance API
const basemap = new VectorBasemapStyle('arcgis/streets', { apiKey: 'YOUR_API_KEY' });
map.setStyle(basemap.styleUrl);
```

## Static Method

```typescript
VectorBasemapStyle.applyStyle(map, styleName, auth)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `map` | `Map` | MapLibre map instance |
| `styleName` | `EsriBasemapStyleName` | Style identifier (see table below) |
| `auth` | `VectorBasemapStyleAuthOptions` | Authentication options (`{ apiKey }` or `{ token }`) |

## Constructor

```typescript
new VectorBasemapStyle(styleId, auth)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `styleId` | `EsriBasemapStyleName` | Style identifier |
| `auth` | `VectorBasemapStyleAuthOptions` | Authentication options |

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `styleUrl` | `string` | Fully constructed style URL for MapLibre |
| `styleId` | `string` | Current style identifier |
| `auth` | `object` | Current auth configuration |

## Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `setStyle(styleId)` | `void` | Updates the style identifier and regenerates `styleUrl` |

## Available Styles

| Style ID | Description |
|----------|-------------|
| `arcgis/streets` | Standard street map |
| `arcgis/topographic` | Topographic map with terrain |
| `arcgis/navigation` | High-contrast navigation style |
| `arcgis/streets-relief` | Streets with hillshade relief |
| `arcgis/light-gray` | Light gray reference map |
| `arcgis/dark-gray` | Dark gray reference map |
| `arcgis/oceans` | Bathymetric ocean mapping |
| `arcgis/imagery` | Satellite imagery basemap |
| `arcgis/streets-night` | Dark-themed street map |

Legacy colon-format identifiers (e.g., `ArcGIS:Streets`) are also accepted for backwards compatibility.

## Examples

### applyStyle with Options
```typescript
// With language and worldview
VectorBasemapStyle.applyStyle(map, 'arcgis/navigation', {
  apiKey: 'YOUR_API_KEY',
  language: 'es',
  worldview: 'FRA'
});

// Token authentication
VectorBasemapStyle.applyStyle(map, 'arcgis/dark-gray', { token: 'YOUR_TOKEN' });
```

### Dynamic Style Switching
```typescript
const styles = ['arcgis/streets', 'arcgis/imagery', 'arcgis/topographic', 'arcgis/dark-gray'];
let currentIndex = 0;

function switchStyle() {
  VectorBasemapStyle.applyStyle(map, styles[currentIndex], { apiKey: 'YOUR_API_KEY' });
  currentIndex = (currentIndex + 1) % styles.length;
}
```

### Instance API
```typescript
const basemap = new VectorBasemapStyle('arcgis/streets', { apiKey: 'YOUR_API_KEY' });
map.setStyle(basemap.styleUrl);

// Change style later
basemap.setStyle('arcgis/dark-gray');
map.setStyle(basemap.styleUrl);
```

## Session Support

`VectorBasemapStyle` can optionally back style requests with an official **basemap style
session** via [`@esri/arcgis-rest-basemap-sessions`](https://github.com/Esri/arcgis-rest-js).
Sessions let the Basemap Styles Service meter usage per map session rather than per tile
request. Authentication runs on ArcGIS REST JS just like the rest of esri-gl — see the
[Authentication guide](../guides/authentication).

Sessions are **opt-in**. Enable them with two extra fields on `VectorBasemapStyleAuthOptions`:

| Option | Type | Description |
|--------|------|-------------|
| `useSession` | `boolean` | Opt in to backing style requests with a basemap style session (default `false`). |
| `sessionDuration` | `number` | Optional session duration in **seconds** (matches the sessions API unit). |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `startSession()` | `Promise<BasemapStyleSession>` | Starts (or reuses) a basemap style session via `BasemapStyleSession.start`, using the instance's `apiKey`/`token`. The session is cached, so repeated calls return the same instance. |
| `getStyleUrl()` | `Promise<string>` | Returns a session-backed v2 style URL when `useSession` is set; otherwise resolves to the normal `styleUrl`. |
| `VectorBasemapStyle.applyStyleWithSession(map, styleName, auth)` | `Promise<void>` | Static helper that awaits a session-backed URL and calls `map.setStyle(url)`. Mirrors `applyStyle` but starts a session first. |

| Property | Type | Description |
|----------|------|-------------|
| `sessionToken` | `string \| undefined` | The token from the active session, or `undefined` until `startSession()` runs. Useful for inspection / debugging. |

### Example

```typescript
import { VectorBasemapStyle } from 'esri-gl';

// Simplest path — start a session and apply the style in one call
await VectorBasemapStyle.applyStyleWithSession(map, 'arcgis/streets', {
  apiKey: 'YOUR_API_KEY',
});

// Instance API — manage the session yourself
const basemap = new VectorBasemapStyle('arcgis/navigation', {
  apiKey: 'YOUR_API_KEY',
  useSession: true,
  sessionDuration: 3600, // seconds
});

await basemap.startSession();
const url = await basemap.getStyleUrl(); // session-backed style URL
map.setStyle(url);

console.log(basemap.sessionToken); // inspect the active session token
```

`startSession()` requires an `apiKey` or `token`; it throws if neither is supplied.
