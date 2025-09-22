import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
//@ts-ignore
import 'maplibre-gl/dist/maplibre-gl.css';
import { DynamicMapService, IdentifyFeatures } from '../../main';

const DynamicMapServiceDemo: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const service = useRef<DynamicMapService | null>(null);
  const [selectedLayers, setSelectedLayers] = useState<number[]>([0, 1, 2]);
  const [styleApplied, setStyleApplied] = useState<boolean>(false);
  const [filterApplied, setFilterApplied] = useState<boolean>(false);
  const [labelsApplied, setLabelsApplied] = useState<boolean>(false);
  const [selectedLabelType, setSelectedLabelType] = useState<string>('none');

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

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
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles',
          },
        ],
      },
      center: [-95.7129, 37.0902], // Center of USA
      zoom: 4,
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // Create Dynamic Map Service
      service.current = new DynamicMapService('dynamic-source', map.current, {
        url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
        layers: selectedLayers,
        format: 'png32',
        transparent: true,
      });

      // Add layer to display the dynamic service
      map.current.addLayer({
        id: 'dynamic-layer',
        type: 'raster',
        source: 'dynamic-source',
      });

  // Add click handler for identify using IdentifyFeatures task
      map.current.on('click', async e => {
        if (!service.current || !map.current) return;

        try {
          const url: string = service.current.esriServiceOptions.url;
          const identify = new IdentifyFeatures(url);

          // Build layers parameter for Identify API (visible:<ids>)
          const layersParam =
            selectedLayers.length > 0 ? `visible:${selectedLayers.join(',')}` : 'all';

          const fc = await identify
            .at({ lng: e.lngLat.lng, lat: e.lngLat.lat })
            .on(map.current)
            .layers(layersParam)
            .tolerance(5)
            .run();

          const feature = fc.features[0];
          if (feature) {
            const props = feature.properties || {};
            let content = '<div style="max-width: 220px;">';
            Object.keys(props).forEach(key => {
              const val = (props as Record<string, unknown>)[key];
              if (val !== null && val !== '' && typeof val !== 'object') {
                content += `<div><strong>${key}:</strong> ${val}</div>`;
              }
            });
            content += '</div>';

            new maplibregl.Popup().setLngLat(e.lngLat).setHTML(content).addTo(map.current);
          }
        } catch (error) {
          console.error('Identify (task) error:', error);
        }
      });

      // Change cursor on hover
      map.current.on('mouseenter', 'dynamic-layer', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'dynamic-layer', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [selectedLayers]);

  const handleLayerToggle = (layerId: number) => {
    setSelectedLayers(prev => {
      const newLayers = prev.includes(layerId)
        ? prev.filter(id => id !== layerId)
        : [...prev, layerId].sort((a, b) => a - b);

      // Update the service layers
      if (service.current && map.current) {
        service.current.setLayers(newLayers);
      }

      return newLayers;
    });
  };

  const layerOptions = [
    { id: 0, name: 'Cities' },
    { id: 1, name: 'Highways' },
    { id: 2, name: 'States' },
    { id: 3, name: 'Counties' },
  ];

  const applyBlueStatesStyle = () => {
    if (!service.current) return;
    // Apply a simple fill renderer to the States sublayer (id: 2)
    service.current.setLayerRenderer(2, {
      type: 'simple',
      symbol: {
        type: 'esriSFS',
        style: 'esriSFSSolid',
        color: [0, 122, 255, 90], // RGBA
        outline: {
          type: 'esriSLS',
          style: 'esriSLSSolid',
          color: [0, 82, 204, 255],
          width: 1
        }
      }
    });
    setStyleApplied(true);
  };

  const resetServerStyle = () => {
    if (!service.current) return;
    // Clear all dynamicLayers so the service reverts to default drawing
    service.current.setDynamicLayers(false);
    setStyleApplied(false);
    setFilterApplied(false);
  };

  const applyPacificStatesFilter = () => {
    if (!service.current) return;
    // Filter States layer (id: 2) to only show Pacific region states
    service.current.setLayerFilter(2, {
      field: 'SUB_REGION',
      op: '=',
      value: 'Pacific'
    });
    setFilterApplied(true);
  };

  const applyPopulationFilter = () => {
    if (!service.current) return;
    // Filter States layer (id: 2) to only show states with population > 5 million
    service.current.setLayerFilter(2, {
      field: 'POP2000',
      op: '>',
      value: 5000000
    });
    setFilterApplied(true);
  };

  const clearFilter = () => {
    if (!service.current) return;
    // Reset just the filter (keep any styling)
    service.current.setLayerDefinition(2, '');
    setFilterApplied(false);
  };

  // Advanced features - Multiple labeling options
  const labelOptions = [
    { value: 'none', label: 'No Labels' },
    { value: 'state_name', label: 'State Names', field: 'state_name' },
    { value: 'state_abbr', label: 'State Abbreviations', field: 'state_abbr' },
    { value: 'sub_region', label: 'Geographic Regions', field: 'sub_region' },
    { value: 'population', label: 'Population (2000)', field: 'pop2000' },
    { value: 'pop_density', label: 'Population per sq mi', field: 'pop00_sqmi' },
  ];

  const applyLabels = (labelType: string) => {
    if (!service.current) return;
    
    const labelOption = labelOptions.find(opt => opt.value === labelType);
    if (!labelOption || labelType === 'none') {
      clearLabels();
      return;
    }

    let labelExpression = `[${labelOption.field}]`;
    let fontSize = 10;
    let textColor: [number, number, number, number] = [255, 255, 255, 255];
    let backgroundColor: [number, number, number, number] = [0, 0, 0, 128];

    // Customize formatting based on label type
    switch (labelType) {
      case 'state_abbr':
        fontSize = 12;
        textColor = [0, 0, 0, 255];
        backgroundColor = [255, 255, 255, 180];
        break;
      case 'sub_region':
        fontSize = 8;
        textColor = [255, 255, 0, 255];
        backgroundColor = [0, 0, 0, 160];
        break;
      case 'population':
        // Format population numbers with commas
        labelExpression = `[pop2000]`;
        fontSize = 9;
        textColor = [0, 255, 0, 255];
        backgroundColor = [0, 0, 0, 140];
        break;
      case 'pop_density':
        fontSize = 8;
        textColor = [255, 165, 0, 255]; // Orange
        backgroundColor = [0, 0, 0, 140];
        break;
    }

    // Apply labels to States layer (id: 2)
    service.current.setLayerLabels(2, {
      labelExpression,
      symbol: {
        type: 'esriTS',
        color: textColor,
        backgroundColor,
        borderLineColor: [0, 0, 0, 255],
        borderLineSize: 1,
        font: {
          family: 'Arial',
          size: fontSize,
          style: 'normal',
          weight: 'bold'
        },
        horizontalAlignment: 'center',
        verticalAlignment: 'middle'
      },
      minScale: 0,
      maxScale: 25000000,
      labelPlacement: 'esriServerPolygonPlacementAlwaysHorizontal'
    });
    
    setSelectedLabelType(labelType);
    setLabelsApplied(true);
  };

  const clearLabels = () => {
    if (!service.current) return;
    service.current.setLayerLabelsVisible(2, false);
    setSelectedLabelType('none');
    setLabelsApplied(false);
  };

  const getLayerStatistics = async () => {
    if (!service.current) return;
    
    try {
      const stats = await service.current.getLayerStatistics(2, [
        {
          statisticType: 'count',
          onStatisticField: 'POP2000',
          outStatisticFieldName: 'state_count'
        },
        {
          statisticType: 'sum',
          onStatisticField: 'POP2000',
          outStatisticFieldName: 'total_population'
        },
        {
          statisticType: 'avg',
          onStatisticField: 'POP2000',
          outStatisticFieldName: 'avg_population'
        }
      ]);
      
      const result = stats[0];
      if (result && result.attributes) {
        const { state_count, total_population, avg_population } = result.attributes;
        alert(`States Statistics:\n- Total States: ${state_count}\n- Total Population: ${total_population?.toLocaleString()}\n- Average Population: ${avg_population ? Math.round(avg_population as number).toLocaleString() : 'N/A'}`);
      }
    } catch (error) {
      console.error('Statistics query failed:', error);
      alert('Failed to get statistics');
    }
  };

  const queryFeatures = async () => {
    if (!service.current) return;
    
    try {
      const features = await service.current.queryLayerFeatures(2, {
        where: 'POP2000 > 10000000',
        outFields: ['STATE_NAME', 'POP2000', 'SUB_REGION'],
        orderByFields: 'POP2000 DESC',
        resultRecordCount: 5
      });
      
      if (features.features && features.features.length > 0) {
        let message = 'Top 5 Most Populous States (>10M):\n\n';
        features.features.forEach((feature, index) => {
          const attrs = feature.attributes;
          message += `${index + 1}. ${attrs.STATE_NAME}: ${(attrs.POP2000 as number).toLocaleString()} (${attrs.SUB_REGION})\n`;
        });
        alert(message);
      } else {
        alert('No features found matching criteria');
      }
    } catch (error) {
      console.error('Feature query failed:', error);
      alert('Failed to query features');
    }
  };

  const exportMapImage = async () => {
    if (!service.current || !map.current) return;
    
    try {
      const bounds = map.current.getBounds();
      const size = map.current.getContainer().getBoundingClientRect();
      
      const blob = await service.current.exportMapImage({
        bbox: [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
        size: [Math.round(size.width), Math.round(size.height)],
        format: 'png',
        dpi: 150,
        transparent: true
      });
      
      // Download the image
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'exported-map.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('Map exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export map');
    }
  };

  const generateLegend = async () => {
    if (!service.current) return;
    
    try {
      const legend = await service.current.generateLegend(selectedLayers);
      
      let message = 'Legend Information:\n\n';
      legend.forEach(layerLegend => {
        message += `Layer ${layerLegend.layerId} - ${layerLegend.layerName}:\n`;
        if (layerLegend.legend && layerLegend.legend.length > 0) {
          layerLegend.legend.forEach(item => {
            message += `  - ${item.label || 'Symbol'}\n`;
          });
        } else {
          message += '  - No legend items\n';
        }
        message += '\n';
      });
      
      alert(message);
    } catch (error) {
      console.error('Legend generation failed:', error);
      alert('Failed to generate legend');
    }
  };

  const batchUpdate = () => {
    if (!service.current) return;
    
    // Apply multiple changes at once using batch operations
    service.current.setBulkLayerProperties([
      {
        layerId: 0,
        operation: 'visibility',
        value: true
      },
      {
        layerId: 1,
        operation: 'visibility', 
        value: true
      },
      {
        layerId: 2,
        operation: 'renderer',
        value: {
          type: 'simple',
          symbol: {
            type: 'esriSFS',
            style: 'esriSFSSolid',
            color: [255, 165, 0, 128], // Orange
            outline: {
              type: 'esriSLS',
              style: 'esriSLSSolid',
              color: [255, 140, 0, 255],
              width: 2
            }
          }
        }
      },
      {
        layerId: 2,
        operation: 'filter',
        value: {
          field: 'POP2000',
          op: '>',
          value: 7000000
        }
      }
    ]);
    
    setStyleApplied(true);
    setFilterApplied(true);
    alert('Batch update applied: Orange styling + population filter > 7M');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          padding: '10px',
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #ddd',
          fontSize: '14px',
        }}
      >
        <div style={{ marginBottom: '10px' }}>
          <strong>Dynamic Map Service Demo</strong> - USA MapServer with layer controls and identify
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {layerOptions.map(layer => (
            <label key={layer.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="checkbox"
                checked={selectedLayers.includes(layer.id)}
                onChange={() => handleLayerToggle(layer.id)}
              />
              {layer.name}
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button onClick={applyBlueStatesStyle} disabled={styleApplied}>
            Apply "Blue States" Style (server)
          </button>
          <button onClick={resetServerStyle} disabled={!styleApplied && !filterApplied}>
            Reset Server Style
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={applyPacificStatesFilter} disabled={filterApplied}>
            Filter: Pacific States Only
          </button>
          <button onClick={applyPopulationFilter} disabled={filterApplied}>
            Filter: Pop &gt; 5M States
          </button>
          <button onClick={clearFilter} disabled={!filterApplied}>
            Clear Filter
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold' }}>
            State Labels:
          </label>
          <select 
            value={selectedLabelType} 
            onChange={(e) => applyLabels(e.target.value)}
            style={{ padding: '4px 8px', fontSize: '14px', minWidth: '150px' }}
          >
            {labelOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button 
            onClick={clearLabels} 
            disabled={!labelsApplied}
            style={{ padding: '4px 12px', fontSize: '12px' }}
          >
            Clear All Labels
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={getLayerStatistics}>
            Get Statistics
          </button>
          <button onClick={queryFeatures}>
            Query Features
          </button>
          <button onClick={exportMapImage}>
            Export Map
          </button>
          <button onClick={generateLegend}>
            Show Legend
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={batchUpdate}>
            Batch Update Demo
          </button>
        </div>
        <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
          Click on the map to identify features. Styling and filtering is applied server-side via dynamicLayers.
        </div>
      </div>
      <div ref={mapContainer} style={{ flex: 1, width: '100%' }} />
    </div>
  );
};

export default DynamicMapServiceDemo;
