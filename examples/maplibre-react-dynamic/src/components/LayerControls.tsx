interface LayerOption {
  id: number
  name: string
}

interface LayerControlsProps {
  layerOptions: LayerOption[]
  selectedLayers: number[]
  labelsEnabled: boolean
  identifyLoading?: boolean
  identifyError?: string | null
  onLayerToggle: (layerId: number) => void
  onLabelsToggle: () => void
  onApplyStyling: () => void
  onApplyFilter: () => void
  onReset: () => void
}

const LayerControls = ({
  layerOptions,
  selectedLayers,
  labelsEnabled,
  identifyLoading = false,
  identifyError = null,
  onLayerToggle,
  onLabelsToggle,
  onApplyStyling,
  onApplyFilter,
  onReset,
}: LayerControlsProps) => {
  return (
    <div className="layer-controls">
      <div className="control-section">
        <h3>Layers</h3>
        <div className="layer-list">
          {layerOptions.map((layer) => (
            <label key={layer.id} className="layer-item">
              <input
                type="checkbox"
                checked={selectedLayers.includes(layer.id)}
                onChange={() => onLayerToggle(layer.id)}
              />
              {layer.name}
            </label>
          ))}
        </div>
      </div>

      <div className="control-section">
        <h3>Labels</h3>
        <button
          onClick={onLabelsToggle}
          className={labelsEnabled ? 'active' : ''}
        >
          {labelsEnabled ? 'Hide State Names' : 'Show State Names'}
        </button>
      </div>

      <div className="control-section">
        <h3>Server-side Features</h3>
        <div className="button-group">
          <button onClick={onApplyStyling}>Apply Orange Styling</button>
          <button onClick={onApplyFilter}>Filter by Population</button>
          <button onClick={onReset} className="reset-btn">
            Reset All
          </button>
        </div>
      </div>

      <div className="info-section">
        <p><small>Click on the map to identify features</small></p>
        {identifyLoading && <p className="status loading">Identifying…</p>}
        {identifyError && <p className="status error">{identifyError}</p>}
      </div>
    </div>
  )
}

export default LayerControls