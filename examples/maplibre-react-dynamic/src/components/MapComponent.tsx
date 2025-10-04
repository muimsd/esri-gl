import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl, { Map } from 'maplibre-gl'
import { useDynamicMapService, useIdentifyFeatures } from 'esri-gl/react'
import type { Map as EsriMap } from 'esri-gl'
import LayerControls from './LayerControls'
import './MapComponent.css'

interface LayerOption {
  id: number
  name: string
}

const MapComponent = () => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<Map | null>(null)
  const [mapInstance, setMapInstance] = useState<Map | null>(null)
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
    });

    map.current.on('load', () => {
      if (!map.current) return
      setMapInstance(map.current)
      setMapLoaded(true)
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
        setMapInstance(null)
      }
    }
  }, [])

  const esriMap = useMemo<EsriMap | null>(() => {
    if (!mapInstance) return null
    return mapInstance as unknown as EsriMap
  }, [mapInstance])

  const serviceOptions = useMemo(
    () => ({
      url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
      layers: selectedLayers,
      format: 'png32',
      transparent: true,
    }),
    [selectedLayers]
  )

  const { service: dynamicService } = useDynamicMapService({
    sourceId: 'usa-source',
    map: esriMap,
    options: serviceOptions,
  })

  const {
    identify: runIdentify,
    loading: identifyLoading,
    error: identifyError,
  } = useIdentifyFeatures({
    url: serviceOptions.url,
    tolerance: 6,
    returnGeometry: false,
  })

  useEffect(() => {
    if (!mapInstance || !dynamicService) return

    if (!mapInstance.getLayer('usa-layer')) {
      mapInstance.addLayer({
        id: 'usa-layer',
        type: 'raster',
        source: 'usa-source',
      })
    }

    const handleClick = async (e: maplibregl.MapLayerMouseEvent) => {
      try {
        const featureCollection = await runIdentify(
          { lng: e.lngLat.lng, lat: e.lngLat.lat },
          {
            layers: selectedLayers.length ? selectedLayers : undefined,
          }
        )

        const [firstFeature] = featureCollection.features || []
        if (firstFeature) {
          console.log('Identified features:', featureCollection.features)
          new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(
              `<div>
                <h3>Feature Info</h3>
                <p><strong>Layer:</strong> ${firstFeature.properties?.layerName ?? 'Unknown'}</p>
                <p><strong>Attributes:</strong></p>
                <pre>${JSON.stringify(firstFeature.properties, null, 2)}</pre>
              </div>`
            )
            .addTo(mapInstance)
        }
      } catch (error) {
        console.error('Identify failed:', error)
      }
    }

    const handleMouseEnter = () => {
      mapInstance.getCanvas().style.cursor = 'pointer'
    }

    const handleMouseLeave = () => {
      mapInstance.getCanvas().style.cursor = ''
    }

    mapInstance.on('click', 'usa-layer', handleClick)
    mapInstance.on('mouseenter', 'usa-layer', handleMouseEnter)
    mapInstance.on('mouseleave', 'usa-layer', handleMouseLeave)

    return () => {
      mapInstance.off('click', 'usa-layer', handleClick)
      mapInstance.off('mouseenter', 'usa-layer', handleMouseEnter)
      mapInstance.off('mouseleave', 'usa-layer', handleMouseLeave)
    }
  }, [mapInstance, dynamicService])

  // Handle layer visibility changes
  const handleLayerToggle = (layerId: number) => {
    const newLayers = selectedLayers.includes(layerId)
      ? selectedLayers.filter(id => id !== layerId)
      : [...selectedLayers, layerId].sort((a, b) => a - b)
    
    setSelectedLayers(newLayers)
    
    if (dynamicService) {
      dynamicService.setLayers(newLayers)
    }
  }

  // Handle labels toggle
  const handleLabelsToggle = () => {
    if (!dynamicService) return

    const newLabelsEnabled = !labelsEnabled
    setLabelsEnabled(newLabelsEnabled)

    if (newLabelsEnabled) {
      // Add state name labels to the States layer (id: 2)
      dynamicService.setLayerLabels(2, {
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
      dynamicService.setLayerLabelsVisible(2, true)
    } else {
      // Remove labels
      dynamicService.setLayerLabelsVisible(2, false)
    }
  }

  // Apply server-side styling
  const applyServerStyling = () => {
    if (!dynamicService) return

    // Apply orange styling to the States layer
    dynamicService.setLayerRenderer(2, {
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
    if (!dynamicService) return

    // Filter to show only states with population > 5 million
    dynamicService.setLayerFilter(2, {
      field: 'pop2000',
      op: '>',
      value: 5000000,
    })
  }

  // Reset all server modifications
  const resetServer = () => {
    if (!dynamicService) return
    dynamicService.setDynamicLayers(false)
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
          identifyLoading={identifyLoading}
          identifyError={identifyError?.message ?? null}
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