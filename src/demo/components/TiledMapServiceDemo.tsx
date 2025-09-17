import React, { useRef, useEffect, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { TiledMapService } from '../../main'

const TiledMapServiceDemo: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const service = useRef<TiledMapService | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [showTiled, setShowTiled] = useState<boolean>(true)

  useEffect(() => {
    if (map.current || !mapContainer.current) return
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
        center: [-95.7129, 37.0902], // Center of USA
        zoom: 4,
      })

      map.current.on('load', () => {
        try {
          service.current = new TiledMapService('tiled-source', map.current!, {
            url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer',
          })

          map.current!.addLayer({
            id: 'tiled-layer',
            type: 'raster',
            source: 'tiled-source',
            paint: {
              'raster-opacity': 0.7,
            },
            layout: {
              visibility: showTiled ? 'visible' : 'none',
            },
          })

          setLoading(false)
        } catch (err) {
          setError('Failed to load Tiled Map Service: ' + (err as Error).message)
          setLoading(false)
        }
      })
    } catch (err) {
      setError('Failed to initialize map: ' + (err as Error).message)
      setLoading(false)
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  if (error) {
    return <div className="error">{error}</div>
  }

  return (
    <div className="map-container" style={{ position: 'relative', height: '100%' }}>
      <div ref={mapContainer} className="map" style={{ flex: 1, width: '100%', height: '100%' }} />

      {/* Toggle control */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 1,
          display: 'flex',
          gap: 8,
        }}
      >
        <button
          onClick={() => {
            setShowTiled(prev => {
              const next = !prev
              if (map.current && map.current.getLayer('tiled-layer')) {
                map.current.setLayoutProperty('tiled-layer', 'visibility', next ? 'visible' : 'none')
              }
              return next
            })
          }}
          disabled={loading || !!error}
          style={{
            padding: '6px 10px',
            border: '1px solid #ccc',
            borderRadius: 4,
            background: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
        >
          {showTiled ? 'Hide Tiled Layer' : 'Show Tiled Layer'}
        </button>
      </div>

      {loading && (
        <div
          className="loading-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.7)'
          }}
        >
          Loading Tiled Map Service...
        </div>
      )}

      {!loading && (
        <div className="info-panel" style={{ position: 'absolute', bottom: 10, left: 10, background: 'white', padding: '8px 10px', borderRadius: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
          <h3 style={{ margin: '0 0 6px 0' }}>Tiled Map Service</h3>
          <p style={{ margin: 0 }}>Pre-rendered cached map tiles from ArcGIS Server for fast performance.</p>
          <div className="url" style={{ fontSize: 12, marginTop: 6 }}>
            https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer
          </div>
        </div>
      )}
    </div>
  )
}

export default TiledMapServiceDemo
