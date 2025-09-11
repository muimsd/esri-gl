import React, { useRef, useEffect, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { TiledMapService } from '../../../dist/esri-map-gl.esm.js'

const TiledMapServiceDemo: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const service = useRef<TiledMapService | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (map.current || !mapContainer.current) return

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style:
          '{ version: 8, sources: { "osm": { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap contributors" } }, layers: [{ id: "osm", type: "raster", source: "osm" }] }',
        center: [-95, 40],
        zoom: 4,
      })

      map.current.on('load', () => {
        try {
          service.current = new TiledMapService('world-topo-tiles', map.current!, {
            url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer',
          })

          map.current!.addLayer({
            id: 'world-topo-layer',
            type: 'raster',
            source: 'world-topo-tiles',
            paint: {
              'raster-opacity': 0.7,
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
      }
    }
  }, [])

  if (loading) {
    return <div className="loading">Loading Tiled Map Service...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  return (
    <div className="map-container">
      <div ref={mapContainer} className="map" />
      <div className="info-panel">
        <h3>Tiled Map Service</h3>
        <p>Pre-rendered cached map tiles from ArcGIS Server for fast performance.</p>
        <div className="url">
          https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer
        </div>
      </div>
    </div>
  )
}

export default TiledMapServiceDemo
