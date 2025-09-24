import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
//@ts-ignore
import 'maplibre-gl/dist/maplibre-gl.css';
import { VectorBasemapStyle } from '../../main';

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

      map.current.on('error', (e) => {
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
    if (!credential.trim()) return;
    // Trigger map initialization via hasAuth change; style will be set on map load.
    setHasAuth(true);
  };

  const setStyle = (styleId: string): void => {
    if (!map.current) {
      console.log('setStyle called but map not ready yet');
      return;
    }
    if (!hasAuth) return; // auth guard

    console.log(`Loading style: ${styleId}`);
    setIsLoading(true);
    setError('');

    try {
      // Build auth options based on detected mode
      const mode = determineMode();
      const auth = mode === 'token'
        ? { token: credential, language: language || undefined, worldview: worldview || undefined }
        : { apiKey: credential, language: language || undefined, worldview: worldview || undefined };

      console.log('Auth mode:', mode, 'Auth config:', { ...auth, token: auth.token ? '[TOKEN]' : undefined, apiKey: auth.apiKey ? '[APIKEY]' : undefined });

      const vectorStyle = new VectorBasemapStyle(styleId, auth);
      const styleUrl = vectorStyle.styleUrl;
      setResolvedUrl(styleUrl);
      
      console.log('Style URL:', styleUrl);

      // Handlers must be defined before registration so we can deregister them
      const handleStyleData = () => {
        console.log('Style data event fired, isStyleLoaded:', map.current?.isStyleLoaded());
        // styledata can fire multiple times; wait until fully loaded
        if (!map.current?.isStyleLoaded()) return;
        console.log('Style fully loaded');
        setIsLoading(false);
        setCurrentStyle(styleId);
        map.current?.off('styledata', handleStyleData);
        map.current?.off('error', handleStyleError);
      };

      const handleStyleError = (ev: unknown) => {
        const errObj = (ev as { error?: Error })?.error;
        if (!errObj) return; // Ignore non-style errors
        console.error('Map style error', errObj);
        setIsLoading(false);
        setError(`Failed to apply style (${styleId}). ${errObj.message || 'Network or authentication error'}`.trim());
        map.current?.off('styledata', handleStyleData);
        map.current?.off('error', handleStyleError);
      };

      // Cleanup previous listeners to avoid stacking (safe if they weren't registered yet)
      map.current.off('styledata', handleStyleData);
      map.current.off('error', handleStyleError);

      map.current.on('styledata', handleStyleData);
      map.current.on('error', handleStyleError);

      // Using the style URL directly ensures relative sprite & glyph paths resolve correctly
      map.current.setStyle(styleUrl);
      
    } catch (error) {
      console.error('Error in setStyle:', error);
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
            <label style={{ fontSize: '12px', color: '#444', marginRight: '6px' }}>Auth Mode:</label>
            <select
              value={authMode}
              onChange={e => setAuthMode(e.target.value as 'auto' | 'apiKey' | 'token')}
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
              placeholder={authMode === 'token' ? 'Enter Esri Token' : 'Enter Esri API Key or Token'}
              value={credential}
              onChange={e => setCredential(e.target.value)}
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
              }}
            >
              Activate
            </button>
          </div>
          <div style={{ marginTop: '14px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <input
              type="text"
              placeholder="language (optional)"
              value={language}
              onChange={e => setLanguage(e.target.value)}
              style={{ padding: '6px 8px', width: '140px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '3px' }}
            />
            <input
              type="text"
              placeholder="worldview (optional)"
              value={worldview}
              onChange={e => setWorldview(e.target.value)}
              style={{ padding: '6px 8px', width: '160px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '3px' }}
            />
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            Get a free API key from{' '}
            <a href="https://developers.arcgis.com/" target="_blank" rel="noopener noreferrer">
              ArcGIS Developers
            </a>
          </p>
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
          <div style={{ marginTop: '10px', color: '#007acc', fontSize: '14px' }}>Loading style...</div>
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
