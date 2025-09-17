/**
 * Esri Leaflet Style API Examples
 * This demonstrates how our implementation now matches Esri Leaflet exactly
 */

import { mapService } from '../Services/SimpleMapService';
import { DynamicMapLayer } from '../Layers/DynamicMapLayer';

// Example 1: Direct Service Usage (Esri Leaflet style)
const service = mapService({
  url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer',
});

// Identify - returns a task that can be chained
const identifyTask = service.identify().at([-122.45, 37.75]).tolerance(5).layers('visible');

// Execute with modern Promise API
identifyTask
  .run()
  .then(response => {
    console.log('Identify results:', response);
  })
  .catch((error: unknown) => {
    console.error('Identify error:', error);
  });

// Query - returns a task that can be chained
const queryTask = service.query().layer(0).where("STATE_NAME='California'");

// Execute with modern Promise API
queryTask
  .run()
  .then(response => {
    console.log('Query results:', response);
  })
  .catch((error: unknown) => {
    console.error('Query error:', error);
  });

// Find - returns a task that can be chained
const findTask = service.find().text('California').fields(['STATE_NAME']);

// Execute with modern Promise API
findTask
  .run()
  .then(response => {
    console.log('Find results:', response);
  })
  .catch((error: unknown) => {
    console.error('Find error:', error);
  });

// Example 2: Layer Usage (same as Esri Leaflet)
const dynamicLayer = new DynamicMapLayer({
  url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer',
  opacity: 0.8,
});

// Layer methods return tasks (just like Esri Leaflet)
const layerIdentifyTask = dynamicLayer.identify().at([-122.45, 37.75]).tolerance(3);

layerIdentifyTask
  .run()
  .then(response => {
    console.log('Layer identify:', response);
  })
  .catch((error: unknown) => {
    console.error('Layer identify error:', error);
  });

const layerQueryTask = dynamicLayer.query().layer(0).where('1=1');

layerQueryTask
  .run()
  .then(response => {
    console.log('Layer query:', response);
  })
  .catch((error: unknown) => {
    console.error('Layer query error:', error);
  });

// Example 3: Promise-based API (our extension)
async function exampleAsync() {
  try {
    const identifyResult = await service.identify().at([-122.45, 37.75]).tolerance(5).request();

    console.log('Async identify:', identifyResult);

    const queryResult = await service.query().where("STATE_NAME='California'").request();

    console.log('Async query:', queryResult);
  } catch (error) {
    console.error('Async error:', error);
  }
}

export { service, dynamicLayer, exampleAsync };
