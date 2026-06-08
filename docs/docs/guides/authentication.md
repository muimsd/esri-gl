# Authentication

esri-gl uses the official [ArcGIS REST JS](https://github.com/Esri/arcgis-rest-js) client
(`@esri/arcgis-rest-request`, `@esri/arcgis-rest-feature-service`,
`@esri/arcgis-rest-portal`, `@esri/arcgis-rest-basemap-sessions`) for every request it
makes to an ArcGIS REST endpoint. That means authentication is handled by ArcGIS REST JS's
authentication managers, and every service and task accepts the same three auth options.

## Auth options

Every service and task accepts these options (precedence: `authentication` → `apiKey` → `token`):

| Option | Type | Description |
|--------|------|-------------|
| `token` | `string` | A pre-generated ArcGIS token. |
| `apiKey` | `string` | An ArcGIS Location Platform API key. |
| `authentication` | `IAuthenticationManager \| string` | An ArcGIS REST JS authentication manager (preferred for OAuth / user sign-in). |

```typescript
import { DynamicMapService } from 'esri-gl';

// API key
new DynamicMapService('source', map, { url, apiKey: 'AAPK…' });

// Static token
new DynamicMapService('source', map, { url, token: 'eyJ…' });
```

A bare `token`/`apiKey` string is wrapped internally in an `ApiKeyManager`, so it is sent as
the `token` request parameter following ArcGIS conventions.

## Authentication managers

For OAuth 2.0, named-user sign-in, or token auto-refresh, pass an ArcGIS REST JS
authentication manager as `authentication`. esri-gl re-exports the common managers so you
don't need a separate import:

```typescript
import { DynamicMapService, ArcGISIdentityManager, ApiKeyManager } from 'esri-gl';

// Named-user session (auto-refreshing token)
const session = await ArcGISIdentityManager.signIn({
  username: 'jdoe',
  password: '••••••',
});
new DynamicMapService('source', map, { url, authentication: session });

// API key manager (equivalent to passing `apiKey`)
const auth = ApiKeyManager.fromKey('AAPK…');
new FeatureService('source', map, { url, authentication: auth });
```

Any object implementing ArcGIS REST JS's `IAuthenticationManager` works here, including
`ApplicationCredentialsManager` for app credentials.

## The `authenticationrequired` event

`Service`-based classes still emit an `authenticationrequired` event when ArcGIS returns a
498/499 token error (ArcGIS Online returns these as HTTP 200 with a JSON error body, which
ArcGIS REST JS surfaces as an `ArcGISRequestError` with a numeric `code`):

```typescript
service.on('authenticationrequired', ({ authenticate }) => {
  authenticate(freshToken); // re-runs queued requests with the new token
});
```

## Low-level helpers

For custom ArcGIS requests, esri-gl exports its request adapter:

```typescript
import { esriRequest, resolveAuthentication } from 'esri-gl';

// Thin wrapper over @esri/arcgis-rest-request `request()`; adds `f=json` by default,
// resolves auth, throws `ArcGISRequestError` on HTTP/ArcGIS errors.
const meta = await esriRequest('https://…/FeatureServer/0', {
  httpMethod: 'GET',
  apiKey: 'AAPK…',
});

// Normalize { token | apiKey | authentication } into an IAuthenticationManager.
const manager = resolveAuthentication({ apiKey: 'AAPK…' });
```

## Migration notes

esri-gl now delegates all HTTP to ArcGIS REST JS. A few behaviors changed from earlier
hand-rolled versions:

- **API keys are sent as the `token` parameter**, not an `X-Esri-Authorization: Bearer`
  header.
- **Errors are `ArcGISRequestError` instances.** Messages from ArcGIS service errors are
  prefixed with the error code (e.g. `"498: Token Required"`); the numeric code is on
  `error.code`, and server detail strings are at `error.response?.error?.details`.
- **The leaflet-style `proxy` option is no longer applied.** Configure a proxy through your
  authentication manager or a global fetch override instead.
- The `fetchOptions` option remains on the option types for compatibility but is no longer
  forwarded to requests.
