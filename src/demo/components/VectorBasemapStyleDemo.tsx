import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
//@ts-ignore
import 'maplibre-gl/dist/maplibre-gl.css';
import { VectorBasemapStyle } from '../../main';

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

  // Valid Esri vector basemap style names (Basemap Styles Service)
  // Reference: https://developers.arcgis.com/documentation/mapping-apis-and-services/maps/services/#item-2
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
        setStyle(currentStyle);
      });

      map.current.on('error', e => {
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
  };

  const setStyle = (styleId: string): void => {
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

      // Create a VectorBasemapStyle instance to get the resolved URL for display
      const vectorStyle = new VectorBasemapStyle(styleId, auth);
      setResolvedUrl(vectorStyle.styleUrl);

      // Use the simple applyStyle wrapper
      VectorBasemapStyle.applyStyle(map.current, styleId, auth);

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
        const errorMessage = errObj.message?.includes('404') || errObj.message?.includes('494')
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

  if (!hasAuth) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h3>Vector Basemap Style Demo</h3>
          <p>Enter an Esri API Key (v1) or Token (v2 Basemap Styles):</p>
          <div style={{ marginTop: '8px' }}>
            <label style={{ fontSize: '12px', color: '#444', marginRight: '6px' }}>
              Auth Mode:
            </label>
            <select
              value={authMode}
              onChange={e => {
                const newAuthMode = e.target.value as 'auto' | 'apiKey' | 'token';
                setAuthMode(newAuthMode);
                safeSessionStorage.setItem(STORAGE_KEYS.AUTH_MODE, newAuthMode);
              }}
              style={{ padding: '4px 6px', fontSize: '12px' }}
            >
              <option value="auto">Auto Detect</option>
              <option value="apiKey">API Key (v1)</option>
              <option value="token">Token (v2)</option>
            </select>
          </div>
          <div style={{ marginTop: '20px' }}>
            <input
              type="password"
              placeholder={
                authMode === 'token' ? 'Enter Esri Token' : 'Enter Esri API Key or Token'
              }
              value={credential}
              onChange={e => {
                const newCredential = e.target.value;
                setCredential(newCredential);
                // Save to session storage as user types (for convenience)
                safeSessionStorage.setItem(STORAGE_KEYS.CREDENTIAL, newCredential);
              }}
              style={{
                padding: '10px',
                width: '300px',
                marginRight: '10px',
                border: '1px solid #ddd',
                borderRadius: '3px',
              }}
            />
            <button
              onClick={activateAuth}
              disabled={!credential.trim()}
              style={{
                padding: '10px 20px',
                backgroundColor: credential.trim() ? '#007acc' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: credential.trim() ? 'pointer' : 'not-allowed',
                marginRight: '10px',
              }}
            >
              Activate
            </button>
            <button
              onClick={async () => {
                const trimmed = credential.trim();
                if (!trimmed) return;

                const isToken = trimmed.includes('.') && trimmed.length > 60;
                const testUrl = isToken
                  ? `https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles?f=json&token=${encodeURIComponent(trimmed)}`
                  : `https://basemaps-api.arcgis.com/arcgis/rest/services/styles?f=json&apiKey=${encodeURIComponent(trimmed)}`;

                console.log('Testing credential with URL:', testUrl);
                try {
                  const response = await fetch(testUrl);
                  console.log('Test result:', response.status, response.statusText);
                  alert(`Credential test: ${response.status} ${response.statusText}`);
                } catch (error) {
                  console.error('Test error:', error);
                  alert(`Test error: ${error}`);
                }
              }}
              disabled={!credential.trim()}
              style={{
                padding: '10px 15px',
                backgroundColor: credential.trim() ? '#28a745' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: credential.trim() ? 'pointer' : 'not-allowed',
                fontSize: '14px',
              }}
            >
              Test
            </button>
          </div>
          <div style={{ marginTop: '14px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <input
              type="text"
              placeholder="language (optional)"
              value={language}
              onChange={e => {
                const newLanguage = e.target.value;
                setLanguage(newLanguage);
                safeSessionStorage.setItem(STORAGE_KEYS.LANGUAGE, newLanguage);
              }}
              style={{
                padding: '6px 8px',
                width: '140px',
                fontSize: '12px',
                border: '1px solid #ddd',
                borderRadius: '3px',
              }}
            />
            <input
              type="text"
              placeholder="worldview (optional)"
              value={worldview}
              onChange={e => {
                const newWorldview = e.target.value;
                setWorldview(newWorldview);
                safeSessionStorage.setItem(STORAGE_KEYS.WORLDVIEW, newWorldview);
              }}
              style={{
                padding: '6px 8px',
                width: '160px',
                fontSize: '12px',
                border: '1px solid #ddd',
                borderRadius: '3px',
              }}
            />
          </div>
          <div
            style={{
              fontSize: '12px',
              color: '#666',
              marginTop: '10px',
              padding: '8px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
            }}
          >
            <p style={{ margin: '0 0 8px 0' }}>
              <strong>API Key (v1):</strong> Get a free API key from{' '}
              <a href="https://developers.arcgis.com/" target="_blank" rel="noopener noreferrer">
                ArcGIS Developers
              </a>
            </p>
            <p style={{ margin: '0' }}>
              <strong>Token (v2):</strong> OAuth tokens from ArcGIS Online/Portal with basemap
              styles access
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
        <h3>Vector Basemap Style Demo</h3>
        <p>Switch between different Esri vector basemap styles ({determineMode()} mode)</p>

        <div style={{ marginTop: '4px', fontSize: '11px', color: '#555' }}>
          <strong>Resolved URL:</strong>{' '}
          <span style={{ wordBreak: 'break-all' }}>{resolvedUrl || '— select / loading —'}</span>
        </div>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '10px' }}>
          {styleOptions.map(option => (
            <button
              key={option.id}
              onClick={() => setStyle(option.id)}
              disabled={isLoading}
              style={{
                padding: '5px 10px',
                backgroundColor: currentStyle === option.id ? '#007acc' : '#f0f0f0',
                color: currentStyle === option.id ? 'white' : '#333',
                border: '1px solid #ddd',
                borderRadius: '3px',
                cursor: isLoading ? 'wait' : 'pointer',
                fontSize: '12px',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {option.name}
            </button>
          ))}
        </div>
        {isLoading && (
          <div style={{ marginTop: '10px', color: '#007acc', fontSize: '14px' }}>
            Loading style...
          </div>
        )}
        {error && (
          <div
            style={{
              marginTop: '10px',
              color: '#d32f2f',
              fontSize: '12px',
              backgroundColor: '#ffebee',
              padding: '8px',
              borderRadius: '3px',
            }}
          >
            {error}
          </div>
        )}
        <button
          onClick={() => {
            setHasAuth(false);
            setResolvedUrl('');
            setError('');
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
          }}
          style={{
            marginTop: '10px',
            padding: '5px 10px',
            backgroundColor: '#f0f0f0',
            color: '#333',
            border: '1px solid #ddd',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Change Credentials
        </button>
      </div>
      <div ref={mapContainer} style={{ flex: 1, width: '100%' }} />
    </div>
  );
};

export default VectorBasemapStyleDemo;
