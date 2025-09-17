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
service
  .identify()
  .at([-122.45, 37.75])
  .tolerance(5)
  .layers('visible')
  .run((error, response) => {
    if (error) {
      console.error('Identify error:', error);
    } else {
      console.log('Identify results:', response);
    }
  });

// Query - returns a task that can be chained
service
  .query()
  .layer(0)
  .where("STATE_NAME='California'")
  .returnGeometry(false)
  .run((error, response) => {
    if (error) {
      console.error('Query error:', error);
    } else {
      console.log('Query results:', response);
    }
  });

// Find - returns a task that can be chained
service
  .find()
  .text('California')
  .fields(['STATE_NAME'])
  .run((error, response) => {
    if (error) {
      console.error('Find error:', error);
    } else {
      console.log('Find results:', response);
    }
  });

// Example 2: Layer Usage (same as Esri Leaflet)
const dynamicLayer = new DynamicMapLayer({
  url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer',
  opacity: 0.8,
});

// Layer methods return tasks (just like Esri Leaflet)
dynamicLayer
  .identify()
  .at([-122.45, 37.75])
  .tolerance(3)
  .run((error, response) => {
    console.log('Layer identify:', response);
  });

dynamicLayer
  .query()
  .layer(0)
  .where('1=1')
  .run((error, response) => {
    console.log('Layer query:', response);
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
