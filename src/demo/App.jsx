import React, { useState } from 'react'
import DynamicMapServiceDemo from './components/DynamicMapServiceDemo'
import TiledMapServiceDemo from './components/TiledMapServiceDemo'
import ImageServiceDemo from './components/ImageServiceDemo'
import VectorTileServiceDemo from './components/VectorTileServiceDemo'
import FeatureServiceDemo from './components/FeatureServiceDemo'
import VectorBasemapStyleDemo from './components/VectorBasemapStyleDemo'

const tabs = [
  { id: 'dynamic', label: 'Dynamic Map Service', component: DynamicMapServiceDemo },
  { id: 'tiled', label: 'Tiled Map Service', component: TiledMapServiceDemo },
  { id: 'image', label: 'Image Service', component: ImageServiceDemo },
  { id: 'vector-tile', label: 'Vector Tile Service', component: VectorTileServiceDemo },
  { id: 'feature', label: 'Feature Service', component: FeatureServiceDemo },
  { id: 'vector-basemap', label: 'Vector Basemap Style', component: VectorBasemapStyleDemo }
]

function App() {
  const [activeTab, setActiveTab] = useState('dynamic')

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component

  return (
    <div className="app">
      <header className="header">
        <h1>Esri Map GL Services Demo</h1>
        <p>Demonstration of all Esri service integrations with Mapbox GL JS</p>
      </header>
      
      <nav className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      
      <main className="content">
        {ActiveComponent && <ActiveComponent />}
      </main>
    </div>
  )
}

export default App
