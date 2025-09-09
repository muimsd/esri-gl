import React, { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { TiledMapService } from '../../TiledMapService'

const TiledMapServiceDemo = () => {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const service = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (map.current) return

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer/style',
        center: [-95, 40],
        zoom: 4
      })

      map.current.on('load', () => {
        try {
          service.current = new TiledMapService(
            'world-topo-tiles',
            map.current,
            {
              url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer'
            }
          )

          map.current.addLayer({
            id: 'world-topo-layer',
            type: 'raster',
            source: 'world-topo-tiles',
            paint: {
              'raster-opacity': 0.7
            }
          })

          setLoading(false)
        } catch (err) {
          setError('Failed to load Tiled Map Service: ' + err.message)
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

  if (loading) {
    return React.createElement('div', { className: 'loading' }, 'Loading Tiled Map Service...')
  }

  if (error) {
    return React.createElement('div', { className: 'error' }, error)
  }

  return React.createElement('div', { className: 'map-container' },
    React.createElement('div', { ref: mapContainer, className: 'map' }),
    React.createElement('div', { className: 'info-panel' },
      React.createElement('h3', null, 'Tiled Map Service'),
      React.createElement('p', null, 'Pre-rendered cached map tiles from ArcGIS Server for fast performance.'),
      React.createElement('div', { className: 'url' },
        'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer'
      )
    )
  )
}

export default TiledMapServiceDemo
