import React, { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { FeatureService } from '../../FeatureService.pending'

const FeatureServiceDemo = () => {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const service = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [whereClause, setWhereClause] = useState('1=1')

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
          service.current = new FeatureService(
            'usa-states-features',
            map.current,
            {
              url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_States_Generalized/FeatureServer/0',
              where: '1=1',
              outFields: ['STATE_NAME', 'POP2000', 'AREA'],
              f: 'geojson'
            }
          )

          map.current.addLayer({
            id: 'usa-states-fill',
            type: 'fill',
            source: 'usa-states-features',
            paint: {
              'fill-color': '#627BC1',
              'fill-opacity': 0.5
            }
          })

          map.current.addLayer({
            id: 'usa-states-line',
            type: 'line',
            source: 'usa-states-features',
            paint: {
              'line-color': '#627BC1',
              'line-width': 2
            }
          })

          setLoading(false)
        } catch (err) {
          setError('Failed to load Feature Service: ' + err.message)
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

  const applyFilter = () => {
    if (service.current) {
      service.current.setWhere(whereClause)
    }
  }

  const clearFilter = () => {
    setWhereClause('1=1')
    if (service.current) {
      service.current.setWhere('1=1')
    }
  }

  const filterByPopulation = (threshold) => {
    const clause = `POP2000 > ${threshold}`
    setWhereClause(clause)
    if (service.current) {
      service.current.setWhere(clause)
    }
  }

  if (loading) {
    return React.createElement('div', { className: 'loading' }, 'Loading Feature Service...')
  }

  if (error) {
    return React.createElement('div', { className: 'error' }, error)
  }

  return React.createElement('div', { className: 'map-container' },
    React.createElement('div', { ref: mapContainer, className: 'map' }),
    React.createElement('div', { className: 'info-panel' },
      React.createElement('h3', null, 'Feature Service'),
      React.createElement('p', null, 'Vector features from ArcGIS Feature Server as GeoJSON with dynamic filtering.'),
      React.createElement('div', { className: 'url' },
        'https://services.arcgis.com/.../USA_States_Generalized/FeatureServer/0'
      )
    ),
    React.createElement('div', { className: 'controls' },
      React.createElement('h4', { style: { margin: '0 0 0.5rem 0', fontSize: '0.9rem' } }, 'Feature Controls'),
      React.createElement('div', { style: { marginBottom: '1rem' } },
        React.createElement('button', { onClick: () => filterByPopulation(1000000) }, 'Pop > 1M'),
        React.createElement('button', { onClick: () => filterByPopulation(5000000) }, 'Pop > 5M'),
        React.createElement('button', { onClick: () => filterByPopulation(10000000) }, 'Pop > 10M')
      ),
      React.createElement('div', { style: { marginBottom: '1rem' } },
        React.createElement('label', { 
          style: { display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' } 
        }, 'Where Clause:'),
        React.createElement('input', {
          type: 'text',
          value: whereClause,
          onChange: (e) => setWhereClause(e.target.value),
          style: { 
            width: '200px', 
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            padding: '0.25rem'
          }
        }),
        React.createElement('br'),
        React.createElement('button', { 
          onClick: applyFilter, 
          style: { marginTop: '0.25rem' } 
        }, 'Apply Filter'),
        React.createElement('button', { 
          onClick: clearFilter, 
          style: { marginTop: '0.25rem' } 
        }, 'Clear Filter')
      )
    )
  )
}

export default FeatureServiceDemo
