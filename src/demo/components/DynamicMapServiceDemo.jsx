import React, { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'

// Note: In a real app, you would import from the built package
// import { DynamicMapService } from 'esri-map-gl'
// For demo purposes, we'll import directly from the source
import { DynamicMapService } from '../../DynamicMapService'

const DynamicMapServiceDemo = () => {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const service = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [layerDefs, setLayerDefs] = useState('')

  useEffect(() => {
    if (map.current) return // initialize map only once

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer/style',
        center: [-95, 40],
        zoom: 4
      })

      map.current.on('load', () => {
        try {
          // Create Dynamic Map Service
          service.current = new DynamicMapService(
            'usa-states-dynamic',
            map.current,
            {
              url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
              layers: [0, 1, 2],
              format: 'png32',
              transparent: true,
              dpi: 96
            }
          )

          // Add layer to display the service
          map.current.addLayer({
            id: 'usa-states-dynamic-layer',
            type: 'raster',
            source: 'usa-states-dynamic',
            paint: {
              'raster-opacity': 0.8
            }
          })

          setLoading(false)
        } catch (err) {
          setError('Failed to load Dynamic Map Service: ' + err.message)
          setLoading(false)
        }
      })

    } catch (err) {
      setError('Failed to initialize map: ' + err.message)
      setLoading(false)
    }

    return () => {
      if (map.current) {
        map.current.remove()
      }
    }
  }, [])

  const handleLayerDefsChange = () => {
    if (service.current && layerDefs) {
      try {
        const layerDefsObj = JSON.parse(layerDefs)
        service.current.setLayerDefs(layerDefsObj)
      } catch (err) {
        alert('Invalid JSON format for layer definitions')
      }
    }
  }

  const clearLayerDefs = () => {
    if (service.current) {
      service.current.setLayerDefs(false)
      setLayerDefs('')
    }
  }

  const toggleLayer = (layerId) => {
    if (service.current) {
      const currentLayers = service.current.esriServiceOptions.layers || []
      const layerArray = Array.isArray(currentLayers) ? currentLayers : [currentLayers]
      
      if (layerArray.includes(layerId)) {
        const newLayers = layerArray.filter(id => id !== layerId)
        service.current.setLayers(newLayers.length > 0 ? newLayers : false)
      } else {
        service.current.setLayers([...layerArray, layerId])
      }
    }
  }

  if (loading) {
    return <div className="loading">Loading Dynamic Map Service...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  return (
    <div className="map-container">
      <div ref={mapContainer} className="map" />
      
      <div className="info-panel">
        <h3>Dynamic Map Service</h3>
        <p>Real-time dynamic map rendering from ArcGIS Server with multiple layers and styling options.</p>
        <div className="url">
          https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer
        </div>
      </div>

      <div className="controls">
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Layer Controls</h4>
        
        <div style={{ marginBottom: '1rem' }}>
          <button onClick={() => toggleLayer(0)}>Toggle Cities</button>
          <button onClick={() => toggleLayer(1)}>Toggle Highways</button>
          <button onClick={() => toggleLayer(2)}>Toggle States</button>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
            Layer Definitions (JSON):
          </label>
          <textarea
            value={layerDefs}
            onChange={(e) => setLayerDefs(e.target.value)}
            placeholder='{"2": "STATE_NAME = \'California\'"}'
            style={{ 
              width: '200px', 
              height: '60px', 
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              padding: '0.25rem'
            }}
          />
          <br />
          <button onClick={handleLayerDefsChange} style={{ marginTop: '0.25rem' }}>
            Apply Filter
          </button>
          <button onClick={clearLayerDefs} style={{ marginTop: '0.25rem' }}>
            Clear Filter
          </button>
        </div>
      </div>
    </div>
  )
}

export default DynamicMapServiceDemo
