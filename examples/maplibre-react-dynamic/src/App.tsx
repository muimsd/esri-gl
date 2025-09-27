import MapComponent from './components/MapComponent'
import './App.css'

function App() {
  return (
    <div className="App">
      <header className="app-header">
        <h1>MapLibre + React + esri-gl</h1>
        <p>Dynamic Layers Example with ArcGIS Services</p>
      </header>
      <main className="app-main">
        <MapComponent />
      </main>
    </div>
  )
}

export default App