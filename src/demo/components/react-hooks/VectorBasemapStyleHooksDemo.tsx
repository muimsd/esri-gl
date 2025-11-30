import React, { useCallback, useEffect, useMemo, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useVectorBasemapStyle } from '../../../react';
import {
  DEMO_CONTAINER_STYLE,
  DEMO_SIDEBAR_STYLE,
  DEMO_SECTION_TITLE_STYLE,
  DEMO_FOOTER_STYLE,
  DEMO_MAP_CONTAINER_STYLE,
  createBadgeStyle,
} from '../shared/styles';
import { useMapLibreDemo } from './useMapLibreDemo';

const STORAGE_KEYS = {
  CREDENTIAL: 'esri-gl-demo-credential',
  AUTH_MODE: 'esri-gl-demo-auth-mode',
  LANGUAGE: 'esri-gl-demo-language',
  WORLDVIEW: 'esri-gl-demo-worldview',
  CURRENT_STYLE: 'esri-gl-demo-current-style',
} as const;

const safeSessionStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      // Ignore storage errors (private browsing, etc.)
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // Ignore storage errors
    }
  },
};

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

type AuthMode = 'auto' | 'apiKey' | 'token';
type CredentialMode = 'apiKey' | 'token';

const VectorBasemapStyleHooksDemo: React.FC = () => {
  const { containerRef, mapRef, mapReady } = useMapLibreDemo({
    style: 'https://demotiles.maplibre.org/style.json',
    center: [-118.2437, 34.0522],
    zoom: 9,
  });

  const [credential, setCredential] = useState('');
  const [activeCredential, setActiveCredential] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('auto');
  const [currentStyle, setCurrentStyle] = useState<string>('arcgis/streets');
  const [language, setLanguage] = useState('');
  const [worldview, setWorldview] = useState('');
  const [hasAuth, setHasAuth] = useState(false);
  const [styleLoading, setStyleLoading] = useState(false);
  const [error, setError] = useState('');
  const [resolvedUrl, setResolvedUrl] = useState('');
  const [testStatus, setTestStatus] = useState('');

  const determineMode = useCallback(
    (value: string): CredentialMode => {
      if (authMode === 'apiKey' || authMode === 'token') {
        return authMode;
      }
      if (value.includes('.') && value.length > 60) {
        return 'token';
      }
      return 'apiKey';
    },
    [authMode]
  );

  const sanitizeCredential = useCallback((raw: string) => {
    let cleaned = raw.trim();
    if (!cleaned) {
      return { value: '' };
    }

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
        return {
          value: '',
          error: 'You pasted a full URL. Please paste only the API Key or Token.',
        };
      }
    }

    const allowed = /^[A-Za-z0-9._+=-]+$/;
    if (!allowed.test(cleaned)) {
      return {
        value: '',
        error: 'Credential has invalid characters. Paste only the raw API Key or Token.',
      };
    }

    return { value: cleaned };
  }, []);

  useEffect(() => {
    const savedCredential = safeSessionStorage.getItem(STORAGE_KEYS.CREDENTIAL);
    const savedAuthMode = safeSessionStorage.getItem(STORAGE_KEYS.AUTH_MODE) as AuthMode | null;
    const savedLanguage = safeSessionStorage.getItem(STORAGE_KEYS.LANGUAGE);
    const savedWorldview = safeSessionStorage.getItem(STORAGE_KEYS.WORLDVIEW);
    const savedCurrentStyle = safeSessionStorage.getItem(STORAGE_KEYS.CURRENT_STYLE);

    if (savedCredential) {
      setCredential(savedCredential);
      setActiveCredential(savedCredential);
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

  const credentialMode = useMemo<CredentialMode | null>(() => {
    if (!hasAuth || !activeCredential) return null;
    return determineMode(activeCredential);
  }, [hasAuth, activeCredential, determineMode]);

  const vectorOptions = useMemo(() => {
    if (!hasAuth || !activeCredential || !credentialMode) return null;
    return {
      basemapEnum: currentStyle,
      token: credentialMode === 'token' ? activeCredential : undefined,
      apiKey: credentialMode === 'apiKey' ? activeCredential : undefined,
      language: language || undefined,
      worldview: worldview || undefined,
    };
  }, [hasAuth, activeCredential, credentialMode, currentStyle, language, worldview]);

  const {
    service,
    loading: serviceLoading,
    error: serviceError,
    reload,
  } = useVectorBasemapStyle({
    options: vectorOptions ?? undefined,
  });

  useEffect(() => {
    if (!service) {
      return;
    }
    setResolvedUrl(service.styleUrl);
  }, [service]);

  useEffect(() => {
    if (!mapReady || !service || !mapRef.current || !hasAuth) {
      return;
    }

    const map = mapRef.current as maplibregl.Map;
    const styleUrl = service.styleUrl;
    setStyleLoading(true);
    setError('');
    setResolvedUrl(styleUrl);

    const handleStyleData = () => {
      setStyleLoading(false);
      map.off('styledata', handleStyleData);
      map.off('error', handleStyleError);
    };

    const handleStyleError = (event: unknown) => {
      const mapError = (event as { error?: Error })?.error;
      if (!mapError) {
        return;
      }

      if (
        mapError.message?.includes('Unimplemented type:') ||
        mapError.message?.includes('Unable to parse the tile')
      ) {
        return;
      }

      setStyleLoading(false);
      setError(
        mapError.message ? `Error loading style: ${mapError.message}` : 'Error loading style'
      );
      map.off('styledata', handleStyleData);
      map.off('error', handleStyleError);
    };

    map.on('styledata', handleStyleData);
    map.on('error', handleStyleError);
    (map as unknown as { setStyle: (style: string) => void }).setStyle(styleUrl);

    const timeoutId = window.setTimeout(() => {
      setStyleLoading(false);
      map.off('styledata', handleStyleData);
      map.off('error', handleStyleError);
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
      map.off('styledata', handleStyleData);
      map.off('error', handleStyleError);
    };
  }, [mapReady, service, mapRef, hasAuth]);

  const handleActivate = useCallback(() => {
    const { value, error: sanitizeError } = sanitizeCredential(credential);
    if (sanitizeError) {
      setError(sanitizeError);
      return;
    }
    if (!value) {
      setError('Credential is required to activate the vector basemap style.');
      return;
    }

    const mode = determineMode(value);
    setCredential(value);
    setActiveCredential(value);
    setHasAuth(true);
    setError('');
    setTestStatus('');
    safeSessionStorage.setItem(STORAGE_KEYS.CREDENTIAL, value);
    safeSessionStorage.setItem(STORAGE_KEYS.AUTH_MODE, authMode);
    if (language) {
      safeSessionStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
    }
    if (worldview) {
      safeSessionStorage.setItem(STORAGE_KEYS.WORLDVIEW, worldview);
    }
    safeSessionStorage.setItem(STORAGE_KEYS.CURRENT_STYLE, currentStyle);

    if (mode === 'token') {
      console.info('Activated Esri vector basemap style with token credential.');
    } else {
      console.info('Activated Esri vector basemap style with API key credential.');
    }
  }, [sanitizeCredential, credential, determineMode, authMode, language, worldview, currentStyle]);

  const handleTestCredential = useCallback(async () => {
    const { value, error: sanitizeError } = sanitizeCredential(credential);
    if (sanitizeError) {
      setError(sanitizeError);
      return;
    }
    if (!value) {
      setError('Enter a credential before testing.');
      return;
    }

    const mode = determineMode(value);
    const url =
      mode === 'token'
        ? `https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles?f=json&token=${encodeURIComponent(value)}`
        : `https://basemaps-api.arcgis.com/arcgis/rest/services/styles?f=json&apiKey=${encodeURIComponent(value)}`;

    setTestStatus('Testing credential…');
    try {
      const response = await fetch(url);
      setTestStatus(`Credential test: ${response.status} ${response.statusText}`);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : String(fetchError);
      setTestStatus(`Credential test failed: ${message}`);
    }
  }, [sanitizeCredential, credential, determineMode]);

  const handleClearCredential = useCallback(() => {
    setCredential('');
    setActiveCredential(null);
    setHasAuth(false);
    setResolvedUrl('');
    setError('');
    setTestStatus('');
    safeSessionStorage.removeItem(STORAGE_KEYS.CREDENTIAL);
  }, []);

  const handleLanguageChange = useCallback((value: string) => {
    setLanguage(value);
    if (value) {
      safeSessionStorage.setItem(STORAGE_KEYS.LANGUAGE, value);
    } else {
      safeSessionStorage.removeItem(STORAGE_KEYS.LANGUAGE);
    }
  }, []);

  const handleWorldviewChange = useCallback((value: string) => {
    setWorldview(value);
    if (value) {
      safeSessionStorage.setItem(STORAGE_KEYS.WORLDVIEW, value);
    } else {
      safeSessionStorage.removeItem(STORAGE_KEYS.WORLDVIEW);
    }
  }, []);

  return (
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Vector Basemap Style (Hooks)</h2>
          <p style={{ margin: 0, color: '#4b5563', fontSize: '13px' }}>
            Manage Esri vector basemap styles with <code>useVectorBasemapStyle</code> and live
            MapLibre setStyle updates.
          </p>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Credentials</h3>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
            Auth Mode
            <select
              value={authMode}
              onChange={event => {
                const nextMode = event.target.value as AuthMode;
                setAuthMode(nextMode);
                safeSessionStorage.setItem(STORAGE_KEYS.AUTH_MODE, nextMode);
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
              value={credential}
              onChange={event => {
                const nextValue = event.target.value;
                setCredential(nextValue);
                if (nextValue) {
                  safeSessionStorage.setItem(STORAGE_KEYS.CREDENTIAL, nextValue);
                } else {
                  safeSessionStorage.removeItem(STORAGE_KEYS.CREDENTIAL);
                }
              }}
              placeholder="Enter Esri API key or token"
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
              onClick={handleActivate}
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
            <button
              onClick={handleClearCredential}
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
              Clear
            </button>
          </div>
          {testStatus && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#2563eb' }}>{testStatus}</div>
          )}
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span
              style={createBadgeStyle(
                mapReady ? '#bbf7d0' : '#e5e7eb',
                mapReady ? '#064e3b' : '#1f2937'
              )}
            >
              {mapReady ? 'Map ready' : 'Starting MapLibre map…'}
            </span>
            <span
              style={createBadgeStyle(
                hasAuth ? '#dbeafe' : '#fee2e2',
                hasAuth ? '#1e3a8a' : '#7f1d1d'
              )}
            >
              {hasAuth
                ? `Credential mode: ${credentialMode ?? 'detecting…'}`
                : 'Credential required to load Esri basemap'}
            </span>
            {serviceLoading && (
              <span style={createBadgeStyle('#fde68a', '#78350f')}>Requesting vector style…</span>
            )}
            {styleLoading && (
              <span style={createBadgeStyle('#bfdbfe', '#1e3a8a')}>Applying map style…</span>
            )}
            {serviceError && (
              <span style={createBadgeStyle('#fecaca', '#7f1d1d')}>
                Service error: {serviceError.message}
              </span>
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
          <button
            onClick={reload}
            disabled={!hasAuth || serviceLoading || styleLoading}
            style={{
              marginTop: '10px',
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: '#ffffff',
              color: '#1f2937',
              cursor: !hasAuth || serviceLoading || styleLoading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            Reload Style
          </button>
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
                  onClick={() => {
                    setCurrentStyle(option.id);
                    safeSessionStorage.setItem(STORAGE_KEYS.CURRENT_STYLE, option.id);
                  }}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: isActive ? '#2563eb' : '#d1d5db',
                    backgroundColor: isActive ? '#2563eb' : '#ffffff',
                    color: isActive ? '#ffffff' : '#1f2937',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {option.name}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Internationalization</h3>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
            Language
            <input
              type="text"
              value={language}
              onChange={event => handleLanguageChange(event.target.value)}
              placeholder="e.g. en"
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
              value={worldview}
              onChange={event => handleWorldviewChange(event.target.value)}
              placeholder="e.g. US, AR, IN"
              style={{
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '13px',
              }}
            />
          </label>
        </div>

        <div style={DEMO_FOOTER_STYLE}>
          Requires an Esri API key (v1) or OAuth token (v2). The resolved style URL updates as
          options change.
        </div>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
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

export default VectorBasemapStyleHooksDemo;
