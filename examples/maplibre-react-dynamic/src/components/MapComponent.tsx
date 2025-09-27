import { useEffect, useRef, useState } from 'react'
import maplibregl, { Map } from 'maplibre-gl'
import { DynamicMapService } from 'esri-gl'
import LayerControls from './LayerControls'
import './MapComponent.css'

interface LayerOption {
  id: number
  name: string
}

const MapComponent = () => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<Map | null>(null)
  const service = useRef<DynamicMapService | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [selectedLayers, setSelectedLayers] = useState<number[]>([0, 2]) // Cities and States by default
  const [labelsEnabled, setLabelsEnabled] = useState(false)

  // Available layers from the USA MapServer
  const layerOptions: LayerOption[] = [
    { id: 0, name: 'Cities' },
    { id: 1, name: 'Highways' },
    { id: 2, name: 'States' },
  ]

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
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm-tiles',
          },
        ],
      },
      center: [-95.7129, 37.0902], // Center of USA
      zoom: 4,
    })

    map.current.on('load', () => {
      if (!map.current) return

      // Create Dynamic Map Service using esri-gl
      service.current = new DynamicMapService('usa-source', map.current, {
        url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
        layers: selectedLayers,
        format: 'png32',
        transparent: true,
      })

      // Add layer to display the dynamic service
      map.current.addLayer({
        id: 'usa-layer',
        type: 'raster',
        source: 'usa-source',
      })

      // Add click handler for identify functionality
      map.current.on('click', 'usa-layer', async (e) => {
        if (!service.current) return
        
        try {
          const results = await service.current.identify(e.lngLat)
          if (results && results.length > 0) {
            console.log('Identified features:', results)
            // Create a simple popup
            new maplibregl.Popup()
              .setLngLat(e.lngLat)
              .setHTML(
                `<div>
                  <h3>Feature Info</h3>
                  <p><strong>Layer:</strong> ${results[0].layerName}</p>
                  <p><strong>Attributes:</strong></p>
                  <pre>${JSON.stringify(results[0].attributes, null, 2)}</pre>
                </div>`
              )
              .addTo(map.current!)
          }
        } catch (error) {
          console.error('Identify failed:', error)
        }
      })

      // Change cursor on hover
      map.current.on('mouseenter', 'usa-layer', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer'
      })

      map.current.on('mouseleave', 'usa-layer', () => {
        if (map.current) map.current.getCanvas().style.cursor = ''
      })

      setMapLoaded(true)
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Handle layer visibility changes
  const handleLayerToggle = (layerId: number) => {
    const newLayers = selectedLayers.includes(layerId)
      ? selectedLayers.filter(id => id !== layerId)
      : [...selectedLayers, layerId].sort((a, b) => a - b)
    
    setSelectedLayers(newLayers)
    
    if (service.current) {
      service.current.setLayers(newLayers)
    }
  }

  // Handle labels toggle
  const handleLabelsToggle = () => {
    if (!service.current) return

    const newLabelsEnabled = !labelsEnabled
    setLabelsEnabled(newLabelsEnabled)

    if (newLabelsEnabled) {
      // Add state name labels to the States layer (id: 2)
      service.current.setLayerLabels(2, {
        labelExpression: '[state_name]',
        symbol: {
          type: 'esriTS',
          color: [0, 0, 0, 255],
          backgroundColor: [255, 255, 255, 180],
          font: {
            family: 'Arial',
            size: 12,
          },
        },
        minScale: 0,
        maxScale: 50000000,
        labelPlacement: 'esriServerPolygonPlacementAlwaysHorizontal',
      })
    } else {
      // Remove labels
      service.current.setLayerLabelsVisible(2, false)
    }
  }

  // Apply server-side styling
  const applyServerStyling = () => {
    if (!service.current) return

    // Apply orange styling to the States layer
    service.current.setLayerRenderer(2, {
      type: 'simple',
      symbol: {
        type: 'esriSFS',
        style: 'esriSFSSolid',
        color: [255, 165, 0, 120], // Orange with transparency
        outline: {
          type: 'esriSLS',
          style: 'esriSLSSolid',
          color: [255, 140, 0, 255],
          width: 2,
        },
      },
    })
  }

  // Apply server-side filtering
  const applyServerFilter = () => {
    if (!service.current) return

    // Filter to show only states with population > 5 million
    service.current.setLayerFilter(2, {
      field: 'pop2000',
      op: '>',
      value: 5000000,
    })
  }

  // Reset all server modifications
  const resetServer = () => {
    if (!service.current) return
    service.current.setDynamicLayers(false)
    setLabelsEnabled(false)
  }

  return (
    <div className="map-component">
      <div className="map-container" ref={mapContainer} />
      {mapLoaded && (
        <LayerControls
          layerOptions={layerOptions}
          selectedLayers={selectedLayers}
          labelsEnabled={labelsEnabled}
          onLayerToggle={handleLayerToggle}
          onLabelsToggle={handleLabelsToggle}
          onApplyStyling={applyServerStyling}
          onApplyFilter={applyServerFilter}
          onReset={resetServer}
        />
      )}
    </div>
  )
}

export default MapComponent