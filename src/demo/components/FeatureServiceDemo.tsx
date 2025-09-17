import React, { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { FeatureService } from '../../main'

const FeatureServiceDemo: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)

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
      center: [-86.5804, 36.1627], // Tennessee
      // center: [-118.2437, 34.0522], // Los Angeles
      zoom: 10
    })

    map.current.on('load', () => {
      if (!map.current) return

      // Create a Feature Service using GeoJSON (more reliable for demo)
      new FeatureService(
        'counties-source', 
        map.current, 
        {
          url: 'https://services6.arcgis.com/drBkxhK7nF7o7hKT/arcgis/rest/services/TN_Bridges/FeatureServer/0',
          useVectorTiles: false, // Use GeoJSON for better compatibility
          where: '1=1',
          outFields: '*'
        }
      )

      // Wait a moment for the source to be created, then add the layer
      setTimeout(() => {
        if (!map.current) return
        
        // Add a layer to visualize the features (states polygons)
        map.current.addLayer({
          id: 'counties-fill',
          type: 'fill',
          source: 'counties-source',
          paint: {
            'fill-color': 'rgba(200, 100, 240, 0.4)',
            'fill-outline-color': 'rgba(200, 100, 240, 1)'
          }
        })
      }, 100)

      // Add click handler for feature identification
      map.current.on('click', 'counties-fill', async (e) => {
        if (!e.features || e.features.length === 0) return

        const feature = e.features[0]
        const countyName = feature.properties?.NAME || 'Unknown County'
        const stateName = feature.properties?.STATE_NAME || 'Unknown State'

        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`<div><strong>${countyName}</strong><br/>${stateName}</div>`)
          .addTo(map.current!)
      })

      // Change cursor to pointer when hovering over counties
      map.current.on('mouseenter', 'counties-fill', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer'
      })

      map.current.on('mouseleave', 'counties-fill', () => {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#f5f5f5', 
        borderBottom: '1px solid #ddd',
        fontSize: '14px'
      }}>
        <strong>Feature Service Demo</strong> - USA Counties from ArcGIS FeatureServer. Click counties for details.
      </div>
      <div 
        ref={mapContainer} 
        style={{ flex: 1, width: '100%' }}
      />
    </div>
  )
}

export default FeatureServiceDemo
