import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { VectorBasemapStyle } from '@/index';
import {
  DEMO_CONTAINER_STYLE,
  DEMO_SIDEBAR_STYLE,
  DEMO_SECTION_TITLE_STYLE,
  DEMO_FOOTER_STYLE,
  DEMO_MAP_CONTAINER_STYLE,
  createBadgeStyle,
} from '../shared/styles';

// Session storage keys
const STORAGE_KEYS = {
  CREDENTIAL: 'esri-gl-demo-credential',
  AUTH_MODE: 'esri-gl-demo-auth-mode',
  LANGUAGE: 'esri-gl-demo-language',
  WORLDVIEW: 'esri-gl-demo-worldview',
  CURRENT_STYLE: 'esri-gl-demo-current-style',
} as const;

// Safe session storage helpers for SSR compatibility
const safeSessionStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // Silently fail if storage is not available
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Silently fail if storage is not available
    }
  },
};

// Valid Esri vector basemap style names (Basemap Styles Service)
const styleOptions = [
  { id: 'arcgis/streets', name: 'Streets' },
  { id: 'arcgis/topographic', name: 'Topographic' },
  { id: 'arcgis/navigation', name: 'Navigation' },
  { id: 'arcgis/streets-relief', name: 'Streets Relief' },
  { id: 'arcgis/dark-gray', name: 'Dark Gray' },
  { id: 'arcgis/light-gray', name: 'Light Gray' },
  { id: 'arcgis/oceans', name: 'Oceans' },
  { id: 'arcgis/imagery', name: 'Imagery' },
];

const VectorBasemapStyleDemo: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [currentStyle, setCurrentStyle] = useState<string>('arcgis/streets');
  const [credential, setCredential] = useState<string>('');
  const [authMode, setAuthMode] = useState<'auto' | 'apiKey' | 'token'>('auto');
  const [hasAuth, setHasAuth] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [language, setLanguage] = useState<string>('');
  const [worldview, setWorldview] = useState<string>('');
  const [resolvedUrl, setResolvedUrl] = useState<string>('');
  const [testStatus, setTestStatus] = useState<string>('');

  // Load saved data from session storage on component mount
  useEffect(() => {
    const savedCredential = safeSessionStorage.getItem(STORAGE_KEYS.CREDENTIAL);
    const savedAuthMode = safeSessionStorage.getItem(STORAGE_KEYS.AUTH_MODE) as
      | 'auto'
      | 'apiKey'
      | 'token'
      | null;
    const savedLanguage = safeSessionStorage.getItem(STORAGE_KEYS.LANGUAGE);
    const savedWorldview = safeSessionStorage.getItem(STORAGE_KEYS.WORLDVIEW);
    const savedCurrentStyle = safeSessionStorage.getItem(STORAGE_KEYS.CURRENT_STYLE);

    if (savedCredential) {
      setCredential(savedCredential);
      setHasAuth(true);
    }
    if (savedAuthMode) {
      setAuthMode(savedAuthMode);
    }
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
    if (savedWorldview) {
      setWorldview(savedWorldview);
    }
    if (savedCurrentStyle) {
      setCurrentStyle(savedCurrentStyle);
    }
  }, []);

  // Initialize map only AFTER credentials activated so the container exists in DOM.
  useEffect(() => {
    if (!hasAuth) return; // wait until auth screen dismissed (container rendered)
    if (map.current || !mapContainer.current) return;

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'osm-tiles': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors',
            },
          },
          layers: [
            {
              id: 'osm-tiles',
              type: 'raster',
              source: 'osm-tiles',
            },
          ],
        },
        center: [-118.2437, 34.0522],
        zoom: 9,
      });

      map.current.on('load', () => {
        console.log('Map loaded successfully');
        // Apply initial style once map core is ready
        applyStyle(currentStyle);
      });

      map.current.on('error', (e: { error?: Error }) => {
        // Suppress vector tile parsing errors - these are common with Esri tiles on MapLibre v5+
        if (
          e.error?.message?.includes('Unimplemented type:') ||
          e.error?.message?.includes('Unable to parse the tile')
        ) {
          return; // Don't log or show these as user-facing errors
        }
        console.error('Map error:', e);
      });
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [hasAuth]);

  const determineMode = (): 'apiKey' | 'token' => {
    if (authMode === 'apiKey' || authMode === 'token') return authMode;
    // Heuristic: token strings from OAuth are usually very long and contain dots.
    if (credential.includes('.') && credential.length > 60) return 'token';
    return 'apiKey';
  };

  const activateAuth = (): void => {
    const trimmedCredential = credential.trim();
    if (!trimmedCredential) return;

    console.log('Activating auth with credential:', JSON.stringify(trimmedCredential));
    console.log(
      'Credential type detected:',
      trimmedCredential.includes('.') && trimmedCredential.length > 60 ? 'token' : 'apiKey'
    );

    // Update the credential state to the trimmed version
    setCredential(trimmedCredential);
    // Save to session storage
    safeSessionStorage.setItem(STORAGE_KEYS.CREDENTIAL, trimmedCredential);
    safeSessionStorage.setItem(STORAGE_KEYS.AUTH_MODE, authMode);
    safeSessionStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
    safeSessionStorage.setItem(STORAGE_KEYS.WORLDVIEW, worldview);
    safeSessionStorage.setItem(STORAGE_KEYS.CURRENT_STYLE, currentStyle);
    // Trigger map initialization via hasAuth change; style will be set on map load.
    setHasAuth(true);
    setError('');
    setTestStatus('');
  };

  const applyStyle = (styleId: string): void => {
    if (!map.current) {
      return;
    }
    if (!hasAuth) return; // auth guard

    setIsLoading(true);
    setError('');

    try {
      // Sanitize credential (handle pasted URL or extra content)
      const original = credential;
      let cleaned = original.trim();
      if (
        (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
        (cleaned.startsWith("'") && cleaned.endsWith("'"))
      ) {
        cleaned = cleaned.slice(1, -1);
      }
      cleaned = cleaned.split(/\s+/)[0];
      if (/https?:\/\//i.test(cleaned)) {
        const match = cleaned.match(/[?&](?:apiKey|token)=([^&]+)/i);
        if (match) {
          cleaned = decodeURIComponent(match[1]);
        } else {
          setIsLoading(false);
          setError('You pasted a full URL. Please paste only the API Key or Token.');
          return;
        }
      }
      const allowed = /^[A-Za-z0-9._+=-]+$/;
      if (!allowed.test(cleaned)) {
        setIsLoading(false);
        setError('Credential has invalid characters. Paste only the raw API Key / Token.');
        return;
      }
      if (cleaned !== credential) {
        setCredential(cleaned); // update for future operations
      }

      // Build auth options based on detected mode (after cleaning)
      const mode = determineMode();
      const auth =
        mode === 'token'
          ? { token: cleaned, language: language || undefined, worldview: worldview || undefined }
          : { apiKey: cleaned, language: language || undefined, worldview: worldview || undefined };

      const vectorStyle = new VectorBasemapStyle(styleId, auth);
      setResolvedUrl(vectorStyle.styleUrl);

      (map.current as unknown as { setStyle: (style: string) => void }).setStyle(
        vectorStyle.styleUrl
      );

      // Handle style loading completion
      const handleStyleLoad = () => {
        setIsLoading(false);
        setCurrentStyle(styleId);
        safeSessionStorage.setItem(STORAGE_KEYS.CURRENT_STYLE, styleId);
        map.current?.off('styledata', handleStyleLoad);
        map.current?.off('error', handleStyleError);
      };

      const handleStyleError = (ev: unknown) => {
        const errObj = (ev as { error?: Error })?.error;
        if (!errObj) return;

        // Filter out vector tile parsing errors - these are common with Esri tiles on MapLibre v5+
        if (
          errObj.message?.includes('Unimplemented type:') ||
          errObj.message?.includes('Unable to parse the tile')
        ) {
          return; // Don't treat as fatal error
        }

        setIsLoading(false);
        const mode = determineMode();
        const errorMessage =
          errObj.message?.includes('404') || errObj.message?.includes('494')
            ? `Authentication failed. Please verify your ${mode === 'token' ? 'token' : 'API key'} is valid.`
            : `Error loading style: ${errObj.message || 'Unknown error'}`;

        setError(errorMessage);
        map.current?.off('styledata', handleStyleLoad);
        map.current?.off('error', handleStyleError);
      };

      // Set up event listeners
      map.current.on('styledata', handleStyleLoad);
      map.current.on('error', handleStyleError);

      // Fallback timeout
      setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
          setCurrentStyle(styleId);
          safeSessionStorage.setItem(STORAGE_KEYS.CURRENT_STYLE, styleId);
          map.current?.off('styledata', handleStyleLoad);
          map.current?.off('error', handleStyleError);
        }
      }, 5000);
    } catch (error) {
      setIsLoading(false);
      setError(`Error loading style: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTestCredential = async () => {
    const trimmed = credential.trim();
    if (!trimmed) return;

    const isToken = trimmed.includes('.') && trimmed.length > 60;
    const testUrl = isToken
      ? `https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles?f=json&token=${encodeURIComponent(trimmed)}`
      : `https://basemaps-api.arcgis.com/arcgis/rest/services/styles?f=json&apiKey=${encodeURIComponent(trimmed)}`;

    setTestStatus('Testing credential...');
    try {
      const response = await fetch(testUrl);
      setTestStatus(`Credential test: ${response.status} ${response.statusText}`);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : String(fetchError);
      setTestStatus(`Credential test failed: ${message}`);
    }
  };

  const handleChangeCredentials = () => {
    setHasAuth(false);
    setResolvedUrl('');
    setError('');
    setTestStatus('');
    // Clear session storage
    safeSessionStorage.removeItem(STORAGE_KEYS.CREDENTIAL);
    safeSessionStorage.removeItem(STORAGE_KEYS.AUTH_MODE);
    safeSessionStorage.removeItem(STORAGE_KEYS.LANGUAGE);
    safeSessionStorage.removeItem(STORAGE_KEYS.WORLDVIEW);
    safeSessionStorage.removeItem(STORAGE_KEYS.CURRENT_STYLE);
    // Reset form values
    setCredential('');
    setAuthMode('auto');
    setLanguage('');
    setWorldview('');
    setCurrentStyle('arcgis/streets');
  };

  // ---------- Auth sidebar content ----------
  const renderAuthSidebar = () => (
    <aside style={DEMO_SIDEBAR_STYLE}>
      <div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Vector Basemap Style (ESM)</h2>
        <p style={{ margin: 0, color: '#4b5563', fontSize: '13px' }}>
          Enter an Esri API Key (v1) or Token (v2) to load vector basemap styles via the ESM class
          API.
        </p>
      </div>

      <div>
        <h3 style={DEMO_SECTION_TITLE_STYLE}>Credentials</h3>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
          Auth Mode
          <select
            value={authMode}
            onChange={e => {
              const newAuthMode = e.target.value as 'auto' | 'apiKey' | 'token';
              setAuthMode(newAuthMode);
              safeSessionStorage.setItem(STORAGE_KEYS.AUTH_MODE, newAuthMode);
            }}
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '13px',
            }}
          >
            <option value="auto">Auto Detect</option>
            <option value="apiKey">API Key (v1)</option>
            <option value="token">Token (v2)</option>
          </select>
        </label>

        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '13px',
            marginTop: '10px',
          }}
        >
          Credential
          <input
            type="password"
            placeholder={authMode === 'token' ? 'Enter Esri Token' : 'Enter Esri API Key or Token'}
            value={credential}
            onChange={e => {
              const newCredential = e.target.value;
              setCredential(newCredential);
              safeSessionStorage.setItem(STORAGE_KEYS.CREDENTIAL, newCredential);
            }}
            style={{
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '13px',
            }}
          />
        </label>

        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={activateAuth}
            disabled={!credential.trim()}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid',
              borderColor: credential.trim() ? '#2563eb' : '#d1d5db',
              backgroundColor: credential.trim() ? '#2563eb' : '#f3f4f6',
              color: credential.trim() ? '#ffffff' : '#9ca3af',
              cursor: credential.trim() ? 'pointer' : 'not-allowed',
              fontWeight: 600,
            }}
          >
            Activate
          </button>
          <button
            onClick={handleTestCredential}
            disabled={!credential.trim()}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #10b981',
              backgroundColor: credential.trim() ? '#10b981' : '#f3f4f6',
              color: credential.trim() ? '#ffffff' : '#9ca3af',
              cursor: credential.trim() ? 'pointer' : 'not-allowed',
              fontWeight: 600,
            }}
          >
            Test
          </button>
        </div>
        {testStatus && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#2563eb' }}>{testStatus}</div>
        )}
      </div>

      <div>
        <h3 style={DEMO_SECTION_TITLE_STYLE}>Internationalization</h3>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
          Language
          <input
            type="text"
            placeholder="e.g. en"
            value={language}
            onChange={e => {
              const newLanguage = e.target.value;
              setLanguage(newLanguage);
              safeSessionStorage.setItem(STORAGE_KEYS.LANGUAGE, newLanguage);
            }}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '13px',
            }}
          />
        </label>
        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '13px',
            marginTop: '10px',
          }}
        >
          Worldview
          <input
            type="text"
            placeholder="e.g. US, AR, IN"
            value={worldview}
            onChange={e => {
              const newWorldview = e.target.value;
              setWorldview(newWorldview);
              safeSessionStorage.setItem(STORAGE_KEYS.WORLDVIEW, newWorldview);
            }}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '13px',
            }}
          />
        </label>
      </div>

      <div
        style={{
          fontSize: '12px',
          color: '#6b7280',
          padding: '8px',
          backgroundColor: '#f3f4f6',
          borderRadius: '6px',
        }}
      >
        <p style={{ margin: '0 0 6px 0' }}>
          <strong>API Key (v1):</strong> Get a free API key from{' '}
          <a href="https://developers.arcgis.com/" target="_blank" rel="noopener noreferrer">
            ArcGIS Developers
          </a>
        </p>
        <p style={{ margin: 0 }}>
          <strong>Token (v2):</strong> OAuth tokens from ArcGIS Online/Portal with basemap styles
          access
        </p>
      </div>

      <div style={DEMO_FOOTER_STYLE}>
        Requires an Esri API key (v1) or OAuth token (v2). The resolved style URL updates as options
        change.
      </div>
    </aside>
  );

  // ---------- Authenticated sidebar content ----------
  const renderMainSidebar = () => (
    <aside style={DEMO_SIDEBAR_STYLE}>
      <div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Vector Basemap Style (ESM)</h2>
        <p style={{ margin: 0, color: '#4b5563', fontSize: '13px' }}>
          Switch between Esri vector basemap styles using the <code>VectorBasemapStyle</code> class
          ({determineMode()} mode).
        </p>
      </div>

      <div>
        <h3 style={DEMO_SECTION_TITLE_STYLE}>Style Status</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span
            style={createBadgeStyle(
              hasAuth ? '#dbeafe' : '#fee2e2',
              hasAuth ? '#1e3a8a' : '#7f1d1d'
            )}
          >
            {hasAuth
              ? `Credential mode: ${determineMode()}`
              : 'Credential required to load Esri basemap'}
          </span>
          {isLoading && (
            <span style={createBadgeStyle('#bfdbfe', '#1e3a8a')}>Loading style...</span>
          )}
          {error && <span style={createBadgeStyle('#fecaca', '#7f1d1d')}>{error}</span>}
          {resolvedUrl && (
            <span
              style={{
                display: 'block',
                fontSize: '11px',
                color: '#6b7280',
                wordBreak: 'break-all',
              }}
            >
              Resolved URL: <code>{resolvedUrl}</code>
            </span>
          )}
        </div>
      </div>

      <div>
        <h3 style={DEMO_SECTION_TITLE_STYLE}>Basemap Styles</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '8px',
          }}
        >
          {styleOptions.map(option => {
            const isActive = option.id === currentStyle;
            return (
              <button
                key={option.id}
                onClick={() => applyStyle(option.id)}
                disabled={isLoading}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: isActive ? '#2563eb' : '#d1d5db',
                  backgroundColor: isActive ? '#2563eb' : '#ffffff',
                  color: isActive ? '#ffffff' : '#1f2937',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: isLoading ? 'wait' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                {option.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 style={DEMO_SECTION_TITLE_STYLE}>Credentials</h3>
        <button
          onClick={handleChangeCredentials}
          style={{
            padding: '8px 14px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            backgroundColor: '#ffffff',
            color: '#374151',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Change Credentials
        </button>
      </div>

      <div style={DEMO_FOOTER_STYLE}>
        Requires an Esri API key (v1) or OAuth token (v2). The resolved style URL updates as options
        change.
      </div>
    </aside>
  );

  return (
    <div style={DEMO_CONTAINER_STYLE}>
      {hasAuth ? renderMainSidebar() : renderAuthSidebar()}

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        {hasAuth && <div ref={mapContainer} style={{ position: 'absolute', inset: 0 }} />}
        {!hasAuth && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(249, 250, 251, 0.92)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '24px',
              color: '#1f2937',
              backdropFilter: 'blur(2px)',
            }}
          >
            <div
              style={{ maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <h3 style={{ margin: 0 }}>Awaiting credentials</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#4b5563' }}>
                Enter an Esri API key or token in the sidebar, then click <strong>Activate</strong>{' '}
                to stream the basemap directly from ArcGIS services.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VectorBasemapStyleDemo;
