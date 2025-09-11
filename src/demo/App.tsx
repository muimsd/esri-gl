import React, { useState } from 'react'
import DynamicMapServiceDemo from './components/DynamicMapServiceDemo'
import TiledMapServiceDemo from './components/TiledMapServiceDemo'
import FeatureServiceDemo from './components/FeatureServiceDemo'
import ImageServiceDemo from './components/ImageServiceDemo'
import VectorTileServiceDemo from './components/VectorTileServiceDemo'
import VectorBasemapStyleDemo from './components/VectorBasemapStyleDemo'

type TabType = 'dynamic' | 'tiled' | 'features' | 'image' | 'vector' | 'basemap'

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dynamic')

  const tabs = [
    { id: 'dynamic' as TabType, label: 'Dynamic Map Service', component: DynamicMapServiceDemo },
    { id: 'tiled' as TabType, label: 'Tiled Map Service', component: TiledMapServiceDemo },
    { id: 'features' as TabType, label: 'Feature Service', component: FeatureServiceDemo },
    { id: 'image' as TabType, label: 'Image Service', component: ImageServiceDemo },
    { id: 'vector' as TabType, label: 'Vector Tile Service', component: VectorTileServiceDemo },
    { id: 'basemap' as TabType, label: 'Vector Basemap Style', component: VectorBasemapStyleDemo },
  ]

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || DynamicMapServiceDemo

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          backgroundColor: '#333',
          color: 'white',
          padding: '10px 20px',
          borderBottom: '1px solid #ddd',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '24px' }}>Esri Map GL Demo</h1>
        <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: 0.8 }}>
          Interactive demos of Esri services with MapLibre GL JS
        </p>
      </header>

      <nav
        style={{
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #ddd',
          padding: '0',
          overflowX: 'auto',
        }}
      >
        <div style={{ display: 'flex', minWidth: 'max-content' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '15px 20px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? '#007acc' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#333',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '3px solid #005a9e' : '3px solid transparent',
                whiteSpace: 'nowrap',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main style={{ flex: 1, overflow: 'hidden' }}>
        <ActiveComponent />
      </main>
    </div>
  )
}

export default App
