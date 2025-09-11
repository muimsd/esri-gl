import React, { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { DynamicMapService, IdentifyFeatures } from '../../main'

const IdentifyFeaturesDemo: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const service = useRef<any>(null)
  const identifyService = useRef<any>(null)
  const [identifyResults, setIdentifyResults] = useState<any[]>([])
  const [isIdentifying, setIsIdentifying] = useState(false)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Initialize MapLibre GL JS map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles'
          }
        ]
      },
      center: [-95.7129, 37.0902], // Center of USA
      zoom: 4
    })

    map.current.on('load', () => {
      if (!map.current) return

      // Create Dynamic Map Service
      service.current = new DynamicMapService(
        'identify-source',
        map.current,
        {
          url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
          layers: [0, 1, 2, 3],
          format: 'png32',
          transparent: true
        }
      )

      // Add layer to display the dynamic service
      map.current.addLayer({
        id: 'identify-layer',
        type: 'raster',
        source: 'identify-source'
      })

      // Create IdentifyFeatures service
      identifyService.current = new IdentifyFeatures({
        url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
        tolerance: 5,
        returnGeometry: true,
        layers: 'all'
      })

      // Add click handler for identify
      map.current.on('click', async (e) => {
        if (!identifyService.current) return

        setIsIdentifying(true)
        setIdentifyResults([])

        try {
          const results = await identifyService.current.at({
            lng: e.lngLat.lng,
            lat: e.lngLat.lat
          }, map.current)

          setIdentifyResults(results.results || [])

          if (results.results && results.results.length > 0) {
            // Create popup content
            let content = '<div style="max-width: 300px; max-height: 300px; overflow-y: auto;">'
            
            results.results.forEach((result: any, index: number) => {
              content += `<div style="margin-bottom: 10px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">`
              content += `<div style="font-weight: bold; color: #0066cc; margin-bottom: 5px;">${result.layerName || `Layer ${result.layerId}`}</div>`
              
              const attributes = result.attributes || {}
              const displayField = result.displayFieldName
              
              if (displayField && attributes[displayField]) {
                content += `<div style="font-weight: bold; margin-bottom: 3px;">${attributes[displayField]}</div>`
              }
              
              // Show other attributes
              Object.keys(attributes).forEach(key => {
                if (key !== displayField && attributes[key] !== null && attributes[key] !== '') {
                  content += `<div style="font-size: 12px;"><strong>${key}:</strong> ${attributes[key]}</div>`
                }
              })
              
              content += '</div>'
            })
            
            content += '</div>'

            new maplibregl.Popup({ maxWidth: '400px' })
              .setLngLat(e.lngLat)
              .setHTML(content)
              .addTo(map.current!)
          } else {
            // Show "no results" popup
            new maplibregl.Popup()
              .setLngLat(e.lngLat)
              .setHTML('<div>No features found at this location</div>')
              .addTo(map.current!)
          }
        } catch (error) {
          console.error('Identify error:', error)
          new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML('<div>Error identifying features</div>')
            .addTo(map.current!)
        } finally {
          setIsIdentifying(false)
        }
      })

      // Change cursor when hovering over the layer
      map.current.on('mouseenter', 'identify-layer', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'crosshair'
      })

      map.current.on('mouseleave', 'identify-layer', () => {
        if (map.current) map.current.getCanvas().style.cursor = ''
      })
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  const handleToleranceChange = (tolerance: number) => {
    if (identifyService.current) {
      identifyService.current.setTolerance(tolerance)
    }
  }

  const handleLayerFilterChange = (layers: string) => {
    if (identifyService.current) {
      if (layers === 'all') {
        identifyService.current.setLayers('all')
      } else {
        const layerIds = layers.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
        identifyService.current.setLayers(layerIds)
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#f5f5f5', 
        borderBottom: '1px solid #ddd',
        fontSize: '14px'
      }}>
        <div style={{ marginBottom: '10px' }}>
          <strong>IdentifyFeatures Demo</strong> - Click anywhere on the map to identify features
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '5px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span>Tolerance:</span>
            <select onChange={(e) => handleToleranceChange(parseInt(e.target.value))} defaultValue="5">
              <option value="1">1 pixel</option>
              <option value="3">3 pixels</option>
              <option value="5">5 pixels</option>
              <option value="10">10 pixels</option>
            </select>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span>Layers:</span>
            <select onChange={(e) => handleLayerFilterChange(e.target.value)} defaultValue="all">
              <option value="all">All Layers</option>
              <option value="0">Cities Only</option>
              <option value="1">Highways Only</option>
              <option value="2">States Only</option>
              <option value="0,1">Cities & Highways</option>
              <option value="2,3">States & Counties</option>
            </select>
          </label>
          {isIdentifying && (
            <span style={{ color: '#666', fontStyle: 'italic' }}>Identifying...</span>
          )}
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          Found {identifyResults.length} feature{identifyResults.length !== 1 ? 's' : ''} in last identify operation
        </div>
      </div>
      <div 
        ref={mapContainer} 
        style={{ flex: 1, width: '100%' }}
      />
    </div>
  )
}

export default IdentifyFeaturesDemo
