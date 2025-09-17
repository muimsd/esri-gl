import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { VectorBasemapStyle } from '../../main';

const VectorBasemapStyleDemo: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [currentStyle, setCurrentStyle] = useState<string>('ArcGIS:Streets');
  const [apiKey, setApiKey] = useState<string>('');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  const styleOptions = [
    { id: 'ArcGIS:Streets', name: 'Streets' },
    { id: 'ArcGIS:Topographic', name: 'Topographic' },
    { id: 'ArcGIS:Navigation', name: 'Navigation' },
    { id: 'ArcGIS:Streets:Relief', name: 'Streets Relief' },
    { id: 'ArcGIS:DarkGray', name: 'Dark Gray' },
    { id: 'ArcGIS:LightGray', name: 'Light Gray' },
    { id: 'ArcGIS:Oceans', name: 'Oceans' },
  ];

  useEffect(() => {
    if (map.current || !mapContainer.current) return; // Initialize map only once

    // Initialize with a basic style first
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
          },
        ],
      },
      center: [-118.2437, 34.0522],
      zoom: 9,
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  const setEsriApiKey = (): void => {
    if (apiKey.trim()) {
      setHasApiKey(true);
    }
  };

  const setStyle = async (styleId: string): Promise<void> => {
    if (!map.current || !hasApiKey) return;

    try {
      const vectorStyle = new VectorBasemapStyle(styleId, apiKey);
      const response = await fetch(vectorStyle.styleUrl);
      const style = await response.json();
      map.current.setStyle(style);
      setCurrentStyle(styleId);
    } catch (error) {
      console.error('Error loading style:', error);
      alert('Error loading Esri style. Please check your API key.');
    }
  };

  if (!hasApiKey) {
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
          <p>Enter your Esri API Key to use vector basemap styles:</p>
          <div style={{ marginTop: '20px' }}>
            <input
              type="password"
              placeholder="Enter Esri API Key"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              style={{
                padding: '10px',
                width: '300px',
                marginRight: '10px',
                border: '1px solid #ddd',
                borderRadius: '3px',
              }}
            />
            <button
              onClick={setEsriApiKey}
              disabled={!apiKey.trim()}
              style={{
                padding: '10px 20px',
                backgroundColor: apiKey.trim() ? '#007acc' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: apiKey.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Set API Key
            </button>
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
    <div style={{ width: '100%', height: '100%' }}>
      <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
        <h3>Vector Basemap Style Demo</h3>
        <p>Switch between different Esri vector basemap styles</p>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '10px' }}>
          {styleOptions.map(option => (
            <button
              key={option.id}
              onClick={() => setStyle(option.id)}
              style={{
                padding: '5px 10px',
                backgroundColor: currentStyle === option.id ? '#007acc' : '#f0f0f0',
                color: currentStyle === option.id ? 'white' : '#333',
                border: '1px solid #ddd',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              {option.name}
            </button>
          ))}
        </div>
        <button
          onClick={() => setHasApiKey(false)}
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
          Change API Key
        </button>
      </div>
      <div ref={mapContainer} style={{ width: '100%', height: 'calc(100% - 140px)' }} />
    </div>
  );
};

export default VectorBasemapStyleDemo;
