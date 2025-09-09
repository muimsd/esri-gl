import React, { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { ImageService } from '../../ImageService'

const ImageServiceDemo = () => {
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
          service.current = new ImageService(
            'landsat-image',
            map.current,
            {
              url: 'https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer',
              format: 'jpgpng',
              renderingRule: false
            }
          )

          map.current.addLayer({
            id: 'landsat-layer',
            type: 'raster',
            source: 'landsat-image',
            paint: {
              'raster-opacity': 0.8
            }
          })

          setLoading(false)
        } catch (err) {
          setError('Failed to load Image Service: ' + err.message)
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

  const applyColorInfraredRule = () => {
    if (service.current) {
      service.current.setRenderingRule({
        rasterFunction: 'Color Infrared'
      })
    }
  }

  const applyNaturalColorRule = () => {
    if (service.current) {
      service.current.setRenderingRule({
        rasterFunction: 'Natural Color'
      })
    }
  }

  const clearRenderingRule = () => {
    if (service.current) {
      service.current.setRenderingRule(false)
    }
  }

  if (loading) {
    return React.createElement('div', { className: 'loading' }, 'Loading Image Service...')
  }

  if (error) {
    return React.createElement('div', { className: 'error' }, error)
  }

  return React.createElement('div', { className: 'map-container' },
    React.createElement('div', { ref: mapContainer, className: 'map' }),
    React.createElement('div', { className: 'info-panel' },
      React.createElement('h3', null, 'Image Service'),
      React.createElement('p', null, 'Dynamic raster imagery from ArcGIS Image Server with rendering rules and analysis.'),
      React.createElement('div', { className: 'url' },
        'https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer'
      )
    ),
    React.createElement('div', { className: 'controls' },
      React.createElement('h4', { style: { margin: '0 0 0.5rem 0', fontSize: '0.9rem' } }, 'Rendering Rules'),
      React.createElement('div', { style: { marginBottom: '1rem' } },
        React.createElement('button', { onClick: applyNaturalColorRule }, 'Natural Color'),
        React.createElement('button', { onClick: applyColorInfraredRule }, 'Color Infrared'),
        React.createElement('button', { onClick: clearRenderingRule }, 'Default')
      )
    )
  )
}

export default ImageServiceDemo
