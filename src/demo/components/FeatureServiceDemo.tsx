import React, { useRef, useEffect, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { FeatureService } from '../../FeatureService.pending'

const FeatureServiceDemo: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const service = useRef<FeatureService | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [whereClause, setWhereClause] = useState<string>('1=1')

  useEffect(() => {
    if (map.current) return

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current!,
        style:
          'https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer/style',
        center: [-95, 40],
        zoom: 4,
      })

      map.current.on('load', () => {
        try {
          service.current = new FeatureService('usa-states-features', map.current!, {
            url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_States_Generalized/FeatureServer/0',
            where: '1=1',
            outFields: ['STATE_NAME', 'POP2000', 'AREA'],
            f: 'geojson',
            useVectorTiles: true
          })

          // Add layers to render the vector tiles
          map.current!.addLayer({
            id: 'usa-states-fill',
            type: 'fill',
            source: 'usa-states-features',
            'source-layer': 'USA_States_Generalized', // Vector tile layer name
            paint: {
              'fill-color': '#627BC1',
              'fill-opacity': 0.5,
            },
          })

          map.current!.addLayer({
            id: 'usa-states-line',
            type: 'line',
            source: 'usa-states-features',
            'source-layer': 'USA_States_Generalized',
            paint: {
              'line-color': '#627BC1',
              'line-width': 2,
            },
          })

          setLoading(false)
        } catch (err) {
          setError('Failed to load Feature Service: ' + (err as Error).message)
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
      }
    }
  }, [])

  const applyFilter = (): void => {
    if (service.current) {
      service.current.setWhere(whereClause)
    }
  }

  const clearFilter = (): void => {
    setWhereClause('1=1')
    if (service.current) {
      service.current.setWhere('1=1')
    }
  }

  const filterByPopulation = (threshold: number): void => {
    const clause = `POP2000 > ${threshold}`
    setWhereClause(clause)
    if (service.current) {
      service.current.setWhere(clause)
    }
  }

  if (loading) {
    return <div className="loading">Loading Feature Service...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  return (
    <div className="map-container">
      <div ref={mapContainer} className="map" />
      <div className="info-panel">
        <h3>Feature Service</h3>
        <p>Vector features from ArcGIS Feature Server as GeoJSON with dynamic filtering.</p>
        <div className="url">
          https://services.arcgis.com/.../USA_States_Generalized/FeatureServer/0
        </div>
      </div>
      <div className="controls">
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Feature Controls</h4>
        <div style={{ marginBottom: '1rem' }}>
          <button onClick={() => filterByPopulation(1000000)}>Pop &gt; 1M</button>
          <button onClick={() => filterByPopulation(5000000)}>Pop &gt; 5M</button>
          <button onClick={() => filterByPopulation(10000000)}>Pop &gt; 10M</button>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
            Where Clause:
          </label>
          <input
            type="text"
            value={whereClause}
            onChange={e => setWhereClause(e.target.value)}
            style={{
              width: '200px',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              padding: '0.25rem',
            }}
          />
          <br />
          <button onClick={applyFilter} style={{ marginTop: '0.25rem' }}>
            Apply Filter
          </button>
          <button onClick={clearFilter} style={{ marginTop: '0.25rem' }}>
            Clear Filter
          </button>
        </div>
      </div>
    </div>
  )
}

export default FeatureServiceDemo
