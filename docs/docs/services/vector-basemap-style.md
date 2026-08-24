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
new VectorBasemapStyle(styleName?, auth?)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `styleName` | `EsriBasemapStyleName` | Style identifier (defaults to `'arcgis/streets'`) |
| `auth` | `VectorBasemapStyleAuthOptions \| string` | Authentication options, or a bare API key string |

An `apiKey` or `token` is **required** — the constructor throws
`An Esri API Key must be supplied to consume vector basemap styles` if neither is given.

### Auth options (`VectorBasemapStyleAuthOptions`)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | — | API key, used against the v1 host (`basemaps-api.arcgis.com`) |
| `token` | `string` | — | OAuth / user token, used against the v2 host (`basemapstyles-api.arcgis.com`) |
| `version` | `'v1' \| 'v2'` | inferred | Force the API version (inferred as `v2` when a `token` is supplied, otherwise `v1`) |
| `host` | `string` | per version | Override the host (enterprise deployments) |
| `format` | `'json' \| 'style'` | `'style'` | Value sent as `f` on v2 requests |
| `language` | `string` | — | Locale for basemap labels |
| `worldview` | `string` | — | Worldview to render disputed boundaries for |
| `itemId` | `string` | — | Load a custom style from a portal item instead of a named style |
| `useSession` | `boolean` | `false` | Back style requests with a [basemap style session](#session-support) |
| `sessionDuration` | `number` | — | Session duration in seconds |

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `styleUrl` | `string` | Fully constructed style URL for MapLibre |
| `styleName` | `string` | The style identifier as supplied (see `setStyle`) |
| `sessionToken` | `string \| undefined` | Token of the active session, once `startSession()` has run |

## Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `setStyle(styleName)` | `void` | Updates the style identifier so `styleUrl` regenerates. Apply it with `map.setStyle(basemap.styleUrl)` — this does not touch the map itself. |
| `update()` / `remove()` | `void` | No-ops; present so `VectorBasemapStyle` satisfies the common service interface |

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

Sessions are **opt-in**, enabled with the `useSession` / `sessionDuration`
[auth options](#auth-options-vectorbasemapstyleauthoptions).

### Session methods

| Method | Returns | Description |
|--------|---------|-------------|
| `startSession()` | `Promise<BasemapStyleSession>` | Starts (or reuses) a basemap style session via `BasemapStyleSession.start`, using the instance's `apiKey`/`token`. The session is cached, so repeated calls return the same instance. |
| `getStyleUrl()` | `Promise<string>` | Returns a session-backed v2 style URL when `useSession` is set; otherwise resolves to the normal `styleUrl`. |
| `VectorBasemapStyle.applyStyleWithSession(map, styleName, auth)` | `Promise<void>` | Static helper that awaits a session-backed URL and calls `map.setStyle(url)`. Mirrors `applyStyle` but starts a session first. |

The active session's token is readable from the `sessionToken` property (see
[Properties](#properties)).

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
