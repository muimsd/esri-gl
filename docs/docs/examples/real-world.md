# Real-World Examples

Complete applications demonstrating esri-gl in production scenarios. These examples show how to build comprehensive mapping solutions using multiple services, advanced interactions, and real-world data patterns.

## Emergency Response Dashboard

A comprehensive emergency management system integrating multiple data sources with real-time updates.

```typescript
import { Map, Popup, LngLatBounds } from 'maplibre-gl';
import { 
  FeatureService, 
  DynamicMapService, 
  VectorBasemapStyle,
  IdentifyFeatures,
  query 
} from 'esri-gl';

class EmergencyResponseDashboard {
  private map: Map;
  private services = new Map<string, any>();
  private popup: Popup;
  private filters = {
    severity: 'all',
    timeRange: '24h',
    category: 'all'
  };

  constructor(container: string, apiKey: string) {
    this.initializeMap(container, apiKey);
    this.popup = new Popup({ closeOnClick: false });
    this.loadEmergencyServices();
    this.setupEventHandlers();
    this.createControlPanel();
  }

  private initializeMap(container: string, apiKey: string) {
    this.map = new Map({
      container,
      center: [-95, 37],
      zoom: 6
    });

    // Load emergency-appropriate basemap
    this.map.on('load', () => {
      const basemap = new VectorBasemapStyle('emergency-basemap', this.map, {
        style: 'arcgis/navigation-night', // High contrast for emergency use
        apiKey
      });
    });
  }

  private async loadEmergencyServices() {
    // Active incidents (real-time)
    const incidentService = new FeatureService('incidents', this.map, {
      url: 'https://services.arcgis.com/.../EmergencyIncidents/FeatureServer/0',
      useVectorTiles: false, // GeoJSON for real-time updates
      useBoundingBox: true,
      where: this.buildIncidentWhereClause(),
      outFields: '*',
      orderByFields: 'INCIDENT_DATE DESC'
    });

    this.services.set('incidents', incidentService);

    // Emergency facilities
    const facilitiesService = new FeatureService('facilities', this.map, {
      url: 'https://services.arcgis.com/.../EmergencyFacilities/FeatureServer/0',
      useVectorTiles: true,
      where: "STATUS = 'Operational'",
      outFields: ['NAME', 'TYPE', 'CAPACITY', 'CONTACT', 'ADDRESS']
    });

    this.services.set('facilities', facilitiesService);

    // Transportation routes
    const routesService = new DynamicMapService('routes', this.map, {
      url: 'https://services.arcgis.com/.../EmergencyRoutes/MapServer',
      layers: [0, 1, 2], // Roads, closures, alternate routes
      layerDefs: {
        1: "STATUS = 'Closed'", // Road closures only
        2: "ROUTE_TYPE = 'Emergency'"
      }
    });

    this.services.set('routes', routesService);

    // Weather/hazard overlay
    const hazardService = new DynamicMapService('hazards', this.map, {
      url: 'https://services.arcgis.com/.../WeatherHazards/MapServer',
      layers: [0, 1, 2],
      transparent: true,
      format: 'png32'
    });

    this.services.set('hazards', hazardService);

    this.addLayers();
    this.startRealTimeUpdates();
  }

  private addLayers() {
    // Critical incidents (red)
    this.map.addLayer({
      id: 'incidents-critical',
      type: 'circle',
      source: 'incidents',
      filter: ['==', ['get', 'SEVERITY'], 'Critical'],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 8, 14, 24],
        'circle-color': '#ff0000',
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.8
      }
    });

    // High priority incidents (orange)
    this.map.addLayer({
      id: 'incidents-high',
      type: 'circle',
      source: 'incidents',
      filter: ['==', ['get', 'SEVERITY'], 'High'],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 6, 14, 18],
        'circle-color': '#ff8800',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.8
      }
    });

    // Medium priority incidents (yellow)
    this.map.addLayer({
      id: 'incidents-medium',
      type: 'circle',
      source: 'incidents',
      filter: ['==', ['get', 'SEVERITY'], 'Medium'],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 4, 14, 12],
        'circle-color': '#ffff00',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.6
      }
    });

    // Emergency facilities
    this.map.addLayer({
      id: 'facilities',
      type: 'symbol',
      source: 'facilities',
      layout: {
        'icon-image': [
          'case',
          ['==', ['get', 'TYPE'], 'Hospital'], 'hospital-icon',
          ['==', ['get', 'TYPE'], 'Fire Station'], 'fire-icon',
          ['==', ['get', 'TYPE'], 'Police'], 'police-icon',
          'facility-icon'
        ],
        'icon-size': 0.8,
        'text-field': ['get', 'NAME'],
        'text-font': ['Open Sans Bold'],
        'text-offset': [0, 1.5],
        'text-size': 10
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 2
      }
    });

    // Add pulsing animation to critical incidents
    this.animateCriticalIncidents();
  }

  private buildIncidentWhereClause(): string {
    const conditions = [];
    
    // Time filter
    if (this.filters.timeRange !== 'all') {
      const hoursAgo = this.filters.timeRange === '24h' ? 24 : 
                      this.filters.timeRange === '48h' ? 48 : 168;
      const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
      conditions.push(`INCIDENT_DATE >= timestamp '${cutoff.toISOString()}'`);
    }

    // Severity filter
    if (this.filters.severity !== 'all') {
      conditions.push(`SEVERITY = '${this.filters.severity}'`);
    }

    // Category filter
    if (this.filters.category !== 'all') {
      conditions.push(`CATEGORY = '${this.filters.category}'`);
    }

    return conditions.length > 0 ? conditions.join(' AND ') : '1=1';
  }

  private setupEventHandlers() {
    // Click handlers for incidents
    ['incidents-critical', 'incidents-high', 'incidents-medium'].forEach(layerId => {
      this.map.on('click', layerId, (e) => {
        this.showIncidentDetails(e.features[0]);
      });

      this.map.on('mouseenter', layerId, () => {
        this.map.getCanvas().style.cursor = 'pointer';
      });

      this.map.on('mouseleave', layerId, () => {
        this.map.getCanvas().style.cursor = '';
      });
    });

    // Click handler for facilities
    this.map.on('click', 'facilities', (e) => {
      this.showFacilityDetails(e.features[0]);
    });

    // Right-click for area analysis
    this.map.on('contextmenu', async (e) => {
      e.preventDefault();
      await this.performAreaAnalysis(e.lngLat);
    });
  }

  private showIncidentDetails(feature: any) {
    const props = feature.properties;
    const coordinates = feature.geometry.coordinates;

    const html = `
      <div class="incident-popup">
        <div class="incident-header severity-${props.SEVERITY.toLowerCase()}">
          <h3>${props.INCIDENT_TYPE}</h3>
          <span class="severity-badge">${props.SEVERITY}</span>
        </div>
        <div class="incident-details">
          <p><strong>Location:</strong> ${props.ADDRESS || 'Unknown'}</p>
          <p><strong>Time:</strong> ${new Date(props.INCIDENT_DATE).toLocaleString()}</p>
          <p><strong>Status:</strong> ${props.STATUS}</p>
          <p><strong>Units Responding:</strong> ${props.UNITS_RESPONDING || 0}</p>
          ${props.DESCRIPTION ? `<p><strong>Description:</strong> ${props.DESCRIPTION}</p>` : ''}
        </div>
        <div class="incident-actions">
          <button onclick="this.dispatchUnits(${props.OBJECTID})">Dispatch Units</button>
          <button onclick="this.updateStatus(${props.OBJECTID})">Update Status</button>
          <button onclick="this.viewHistory(${props.OBJECTID})">View History</button>
        </div>
      </div>
    `;

    this.popup
      .setLngLat(coordinates)
      .setHTML(html)
      .addTo(this.map);
  }

  private showFacilityDetails(feature: any) {
    const props = feature.properties;
    const coordinates = feature.geometry.coordinates;

    const html = `
      <div class="facility-popup">
        <div class="facility-header">
          <h3>${props.NAME}</h3>
          <span class="facility-type">${props.TYPE}</span>
        </div>
        <div class="facility-details">
          <p><strong>Address:</strong> ${props.ADDRESS}</p>
          <p><strong>Capacity:</strong> ${props.CAPACITY || 'Unknown'}</p>
          <p><strong>Contact:</strong> ${props.CONTACT || 'N/A'}</p>
        </div>
        <div class="facility-actions">
          <button onclick="this.routeTo([${coordinates}])">Get Directions</button>
          <button onclick="this.contactFacility('${props.CONTACT}')">Contact</button>
        </div>
      </div>
    `;

    this.popup
      .setLngLat(coordinates)
      .setHTML(html)
      .addTo(this.map);
  }

  private async performAreaAnalysis(lngLat: any) {
    const buffer = this.createBuffer([lngLat.lng, lngLat.lat], 5000); // 5km radius

    // Query incidents in area
    const incidents = await query({
      url: 'https://services.arcgis.com/.../EmergencyIncidents/FeatureServer/0'
    })
    .intersects(buffer)
    .where(this.buildIncidentWhereClause());

    // Query facilities in area
    const facilities = await query({
      url: 'https://services.arcgis.com/.../EmergencyFacilities/FeatureServer/0'
    })
    .intersects(buffer)
    .where("STATUS = 'Operational'");

    // Show analysis results
    const analysisHtml = `
      <div class="area-analysis">
        <h3>Area Analysis (5km radius)</h3>
        <div class="analysis-stats">
          <div class="stat-item">
            <span class="stat-number">${incidents.features.length}</span>
            <span class="stat-label">Active Incidents</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">${facilities.features.length}</span>
            <span class="stat-label">Available Facilities</span>
          </div>
        </div>
        <div class="severity-breakdown">
          ${this.buildSeverityBreakdown(incidents.features)}
        </div>
      </div>
    `;

    this.popup
      .setLngLat(lngLat)
      .setHTML(analysisHtml)
      .addTo(this.map);

    // Highlight analysis area
    this.highlightArea(buffer);
  }

  private createControlPanel() {
    const controlPanel = document.createElement('div');
    controlPanel.className = 'emergency-controls';
    controlPanel.innerHTML = `
      <div class="control-section">
        <h4>Filters</h4>
        <select id="severity-filter">
          <option value="all">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        
        <select id="time-filter">
          <option value="24h">Last 24 Hours</option>
          <option value="48h">Last 48 Hours</option>
          <option value="week">Last Week</option>
          <option value="all">All Time</option>
        </select>
        
        <select id="category-filter">
          <option value="all">All Categories</option>
          <option value="Fire">Fire</option>
          <option value="Medical">Medical</option>
          <option value="Traffic">Traffic</option>
          <option value="Weather">Weather</option>
        </select>
      </div>
      
      <div class="control-section">
        <h4>Layers</h4>
        <label><input type="checkbox" id="incidents-layer" checked> Incidents</label>
        <label><input type="checkbox" id="facilities-layer" checked> Facilities</label>
        <label><input type="checkbox" id="routes-layer" checked> Routes</label>
        <label><input type="checkbox" id="hazards-layer" checked> Weather Hazards</label>
      </div>
      
      <div class="control-section">
        <h4>Actions</h4>
        <button id="refresh-data">Refresh Data</button>
        <button id="export-report">Export Report</button>
        <button id="print-map">Print Map</button>
      </div>
      
      <div class="stats-panel">
        <h4>Current Status</h4>
        <div id="live-stats"></div>
      </div>
    `;

    document.body.appendChild(controlPanel);
    this.setupControlHandlers(controlPanel);
  }

  private setupControlHandlers(panel: HTMLElement) {
    // Filter handlers
    panel.querySelector('#severity-filter')?.addEventListener('change', (e) => {
      this.filters.severity = (e.target as HTMLSelectElement).value;
      this.updateFilters();
    });

    panel.querySelector('#time-filter')?.addEventListener('change', (e) => {
      this.filters.timeRange = (e.target as HTMLSelectElement).value;
      this.updateFilters();
    });

    panel.querySelector('#category-filter')?.addEventListener('change', (e) => {
      this.filters.category = (e.target as HTMLSelectElement).value;
      this.updateFilters();
    });

    // Layer visibility handlers
    ['incidents', 'facilities', 'routes', 'hazards'].forEach(layer => {
      panel.querySelector(`#${layer}-layer`)?.addEventListener('change', (e) => {
        this.toggleLayerVisibility(layer, (e.target as HTMLInputElement).checked);
      });
    });

    // Action handlers
    panel.querySelector('#refresh-data')?.addEventListener('click', () => {
      this.refreshAllData();
    });

    panel.querySelector('#export-report')?.addEventListener('click', () => {
      this.exportIncidentReport();
    });

    panel.querySelector('#print-map')?.addEventListener('click', () => {
      window.print();
    });
  }

  private startRealTimeUpdates() {
    // Update incidents every 30 seconds
    setInterval(() => {
      this.refreshIncidents();
      this.updateLiveStats();
    }, 30000);

    // Update facilities every 5 minutes
    setInterval(() => {
      this.refreshFacilities();
    }, 300000);
  }

  private async refreshIncidents() {
    const incidentService = this.services.get('incidents');
    if (incidentService) {
      incidentService.updateQuery({
        where: this.buildIncidentWhereClause()
      });
    }
  }

  private async updateLiveStats() {
    try {
      const stats = await query({
        url: 'https://services.arcgis.com/.../EmergencyIncidents/FeatureServer/0'
      })
      .where(this.buildIncidentWhereClause());

      const severityCounts = this.countBySeverity(stats.features);
      
      const statsHtml = `
        <div class="severity-stats">
          <div class="stat critical">Critical: ${severityCounts.Critical || 0}</div>
          <div class="stat high">High: ${severityCounts.High || 0}</div>
          <div class="stat medium">Medium: ${severityCounts.Medium || 0}</div>
          <div class="stat low">Low: ${severityCounts.Low || 0}</div>
        </div>
        <div class="update-time">
          Last Updated: ${new Date().toLocaleTimeString()}
        </div>
      `;

      const statsPanel = document.getElementById('live-stats');
      if (statsPanel) {
        statsPanel.innerHTML = statsHtml;
      }
    } catch (error) {
      console.error('Failed to update live stats:', error);
    }
  }

  private countBySeverity(features: any[]) {
    const counts: { [key: string]: number } = {};
    features.forEach(feature => {
      const severity = feature.properties.SEVERITY;
      counts[severity] = (counts[severity] || 0) + 1;
    });
    return counts;
  }

  private animateCriticalIncidents() {
    let opacity = 0.8;
    let increasing = false;

    const animate = () => {
      if (increasing) {
        opacity += 0.02;
        if (opacity >= 1) increasing = false;
      } else {
        opacity -= 0.02;
        if (opacity <= 0.3) increasing = true;
      }

      if (this.map.getLayer('incidents-critical')) {
        this.map.setPaintProperty('incidents-critical', 'circle-opacity', opacity);
      }

      requestAnimationFrame(animate);
    };

    animate();
  }

  private updateFilters() {
    const incidentService = this.services.get('incidents');
    if (incidentService) {
      incidentService.updateQuery({
        where: this.buildIncidentWhereClause()
      });
    }
  }

  private toggleLayerVisibility(layerType: string, visible: boolean) {
    const visibility = visible ? 'visible' : 'none';
    
    switch (layerType) {
      case 'incidents':
        ['incidents-critical', 'incidents-high', 'incidents-medium'].forEach(id => {
          if (this.map.getLayer(id)) {
            this.map.setLayoutProperty(id, 'visibility', visibility);
          }
        });
        break;
      case 'facilities':
        if (this.map.getLayer('facilities')) {
          this.map.setLayoutProperty('facilities', 'visibility', visibility);
        }
        break;
      // Handle other layer types...
    }
  }

  private async exportIncidentReport() {
    const incidents = await query({
      url: 'https://services.arcgis.com/.../EmergencyIncidents/FeatureServer/0'
    })
    .where(this.buildIncidentWhereClause())
    .fields(['*'])
    .orderBy('SEVERITY DESC, INCIDENT_DATE DESC');

    const report = this.generateCSVReport(incidents.features);
    this.downloadCSV(report, `emergency_report_${new Date().toISOString().split('T')[0]}.csv`);
  }

  private generateCSVReport(features: any[]): string {
    const headers = ['ID', 'Type', 'Severity', 'Date', 'Address', 'Status', 'Units'];
    const rows = features.map(f => {
      const props = f.properties;
      return [
        props.OBJECTID,
        props.INCIDENT_TYPE,
        props.SEVERITY,
        new Date(props.INCIDENT_DATE).toISOString(),
        props.ADDRESS || '',
        props.STATUS,
        props.UNITS_RESPONDING || 0
      ];
    });

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  private downloadCSV(csvContent: string, filename: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Utility methods
  private createBuffer(center: [number, number], radiusMeters: number) {
    // Simple buffer implementation
    const earthRadius = 6378137;
    const lat = center[1] * Math.PI / 180;
    const lng = center[0] * Math.PI / 180;
    
    const deltaLat = radiusMeters / earthRadius;
    const deltaLng = radiusMeters / (earthRadius * Math.cos(lat));
    
    const points = [];
    for (let i = 0; i < 32; i++) {
      const angle = (i / 32) * 2 * Math.PI;
      const bufferLat = lat + deltaLat * Math.sin(angle);
      const bufferLng = lng + deltaLng * Math.cos(angle);
      points.push([bufferLng * 180 / Math.PI, bufferLat * 180 / Math.PI]);
    }
    points.push(points[0]);

    return { type: 'Polygon', coordinates: [points] };
  }

  private highlightArea(buffer: any) {
    if (this.map.getSource('analysis-area')) {
      (this.map.getSource('analysis-area') as any).setData({
        type: 'Feature',
        geometry: buffer
      });
    } else {
      this.map.addSource('analysis-area', {
        type: 'geojson',
        data: { type: 'Feature', geometry: buffer }
      });

      this.map.addLayer({
        id: 'analysis-area-fill',
        type: 'fill',
        source: 'analysis-area',
        paint: {
          'fill-color': '#007cbf',
          'fill-opacity': 0.2
        }
      });

      this.map.addLayer({
        id: 'analysis-area-stroke',
        type: 'line',
        source: 'analysis-area',
        paint: {
          'line-color': '#007cbf',
          'line-width': 2,
          'line-dasharray': [4, 2]
        }
      });

      // Remove highlight after 10 seconds
      setTimeout(() => {
        if (this.map.getLayer('analysis-area-fill')) {
          this.map.removeLayer('analysis-area-fill');
        }
        if (this.map.getLayer('analysis-area-stroke')) {
          this.map.removeLayer('analysis-area-stroke');
        }
        if (this.map.getSource('analysis-area')) {
          this.map.removeSource('analysis-area');
        }
      }, 10000);
    }
  }

  cleanup() {
    this.services.forEach(service => {
      if (service && typeof service.remove === 'function') {
        service.remove();
      }
    });
    this.services.clear();
  }
}

// Usage
const dashboard = new EmergencyResponseDashboard('map-container', 'your-esri-api-key');

// CSS for styling (add to your stylesheet)
const emergencyStyles = `
.emergency-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 15px;
  border-radius: 5px;
  max-width: 300px;
  font-family: Arial, sans-serif;
}

.control-section {
  margin-bottom: 15px;
}

.control-section h4 {
  margin: 0 0 10px 0;
  color: #ff6b35;
}

.control-section select,
.control-section button {
  width: 100%;
  margin-bottom: 5px;
  padding: 5px;
  background: #333;
  color: white;
  border: 1px solid #555;
  border-radius: 3px;
}

.control-section label {
  display: block;
  margin-bottom: 5px;
}

.incident-popup,
.facility-popup {
  max-width: 300px;
}

.incident-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.severity-critical { color: #ff0000; }
.severity-high { color: #ff8800; }
.severity-medium { color: #ffff00; }
.severity-low { color: #00ff00; }

.severity-badge {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: bold;
}

.incident-actions button,
.facility-actions button {
  margin: 5px 5px 0 0;
  padding: 5px 10px;
  background: #007cbf;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.stats-panel {
  background: rgba(0, 0, 0, 0.7);
  padding: 10px;
  border-radius: 3px;
}

.severity-stats .stat {
  padding: 3px 6px;
  margin: 2px;
  border-radius: 3px;
  display: inline-block;
  font-size: 12px;
  font-weight: bold;
}

.stat.critical { background: #ff0000; }
.stat.high { background: #ff8800; }
.stat.medium { background: #ffff00; color: black; }
.stat.low { background: #00ff00; color: black; }

.update-time {
  font-size: 10px;
  color: #ccc;
  margin-top: 5px;
}
`;
```

## Urban Planning Dashboard

A comprehensive urban planning application for analyzing zoning, demographics, and development patterns.

```typescript
class UrbanPlanningDashboard {
  private map: Map;
  private analysisTools: AnalysisToolset;
  private reportGenerator: ReportGenerator;

  constructor(container: string) {
    this.initializeMap(container);
    this.analysisTools = new AnalysisToolset(this.map);
    this.reportGenerator = new ReportGenerator();
    this.loadPlanningData();
    this.setupPlanningControls();
  }

  private async loadPlanningData() {
    // Zoning data with vector tile optimization
    const zoningService = new FeatureService('zoning', this.map, {
      url: 'https://services.arcgis.com/.../Zoning/FeatureServer/0',
      useVectorTiles: true,
      useBoundingBox: true,
      outFields: ['ZONE_TYPE', 'ZONE_DESC', 'MAX_HEIGHT', 'FAR', 'DENSITY']
    });

    // Demographics (census data)
    const demographicsService = new FeatureService('demographics', this.map, {
      url: 'https://services.arcgis.com/.../Demographics/FeatureServer/0',
      useVectorTiles: true,
      where: '1=1',
      outFields: ['POPULATION', 'MEDIAN_INCOME', 'AGE_MEDIAN', 'DENSITY_POP']
    });

    // Development projects
    const developmentService = new FeatureService('development', this.map, {
      url: 'https://services.arcgis.com/.../Development/FeatureServer/0',
      useVectorTiles: false,
      where: "STATUS IN ('Proposed', 'Under Review', 'Approved', 'Under Construction')",
      outFields: '*'
    });

    this.addPlanningLayers();
  }

  private addPlanningLayers() {
    // Zoning with color-coded styling
    this.map.addLayer({
      id: 'zoning-fill',
      type: 'fill',
      source: 'zoning',
      paint: {
        'fill-color': [
          'match',
          ['get', 'ZONE_TYPE'],
          'Residential', '#90EE90',
          'Commercial', '#FFB6C1',
          'Industrial', '#DDA0DD',
          'Mixed Use', '#F0E68C',
          'Public', '#87CEEB',
          '#CCCCCC' // Default
        ],
        'fill-opacity': 0.7
      }
    });

    // Development projects
    this.map.addLayer({
      id: 'development-projects',
      type: 'circle',
      source: 'development',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'PROJECT_VALUE'],
          100000, 8,
          10000000, 20
        ],
        'circle-color': [
          'match',
          ['get', 'STATUS'],
          'Proposed', '#ffff00',
          'Under Review', '#ffa500',
          'Approved', '#90ee90',
          'Under Construction', '#87ceeb',
          '#cccccc'
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#000000'
      }
    });

    // Demographics choropleth
    this.map.addLayer({
      id: 'demographics-choropleth',
      type: 'fill',
      source: 'demographics',
      paint: {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['get', 'MEDIAN_INCOME'],
          30000, '#fef0d9',
          50000, '#fdcc8a',
          70000, '#fc8d59',
          100000, '#d7301f'
        ],
        'fill-opacity': 0.6
      },
      layout: {
        'visibility': 'none' // Hidden by default
      }
    });
  }

  // Analysis methods, controls, etc...
}
```

This real-world emergency response dashboard demonstrates:

1. **Multi-service integration** - Combining incidents, facilities, routes, and hazards
2. **Real-time updates** - Automatic data refresh with live statistics
3. **Interactive analysis** - Right-click area analysis with buffer queries
4. **Advanced filtering** - Dynamic filters for severity, time, and category
5. **Export capabilities** - CSV reports and printable maps
6. **Professional UI** - Control panels with layer toggles and statistics
7. **Performance optimization** - Smart caching and efficient queries
8. **Error handling** - Robust error handling for production use

The example provides a complete, production-ready template for emergency management systems using esri-gl.