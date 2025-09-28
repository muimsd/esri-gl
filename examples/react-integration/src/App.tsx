import { useState } from 'react';
import HooksExample from './components/HooksExample';
import ReactMapGLExample from './components/ReactMapGLExample';
import IdentifyExample from './components/IdentifyExample';
import MapLibreIntegrationExample from './components/MapLibreIntegrationExample';
import AdvancedFeaturesExample from './components/AdvancedFeaturesExample';

function App() {
  const [activeTab, setActiveTab] = useState<'hooks' | 'mapgl' | 'identify' | 'maplibre' | 'advanced'>('hooks');

  return (
    <div>
      <header style={{ marginBottom: '40px' }}>
        <h1>Esri GL React Integration Examples</h1>
        <p>
          This example demonstrates the React hooks and components provided by esri-gl.
          Switch between tabs to see different integration patterns.
        </p>
        
        <div className="controls">
          <button 
            onClick={() => setActiveTab('hooks')}
            style={{ 
              background: activeTab === 'hooks' ? '#007ACC' : '#f0f0f0',
              color: activeTab === 'hooks' ? 'white' : '#333'
            }}
          >
            React Hooks
          </button>
          <button 
            onClick={() => setActiveTab('mapgl')}
            style={{ 
              background: activeTab === 'mapgl' ? '#007ACC' : '#f0f0f0',
              color: activeTab === 'mapgl' ? 'white' : '#333'
            }}
          >
            React Map GL
          </button>
          <button 
            onClick={() => setActiveTab('identify')}
            style={{ 
              background: activeTab === 'identify' ? '#007ACC' : '#f0f0f0',
              color: activeTab === 'identify' ? 'white' : '#333'
            }}
          >
            Identify Features
          </button>
          <button 
            onClick={() => setActiveTab('maplibre')}
            style={{ 
              background: activeTab === 'maplibre' ? '#007ACC' : '#f0f0f0',
              color: activeTab === 'maplibre' ? 'white' : '#333'
            }}
          >
            MapLibre Direct
          </button>
          <button 
            onClick={() => setActiveTab('advanced')}
            style={{ 
              background: activeTab === 'advanced' ? '#007ACC' : '#f0f0f0',
              color: activeTab === 'advanced' ? 'white' : '#333'
            }}
          >
            Advanced Config
          </button>
        </div>
      </header>

      <main>
        {activeTab === 'hooks' && <HooksExample />}
        {activeTab === 'mapgl' && <ReactMapGLExample />}
        {activeTab === 'identify' && <IdentifyExample />}
        {activeTab === 'maplibre' && <MapLibreIntegrationExample />}
        {activeTab === 'advanced' && <AdvancedFeaturesExample />}
      </main>
    </div>
  );
}

export default App;