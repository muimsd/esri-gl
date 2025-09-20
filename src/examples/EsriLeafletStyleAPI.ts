/**
 * Esri Leaflet Style API Examples
 * This demonstrates how our implementation now matches Esri Leaflet exactly
 * Updated to use Services-only approach
 */

import { mapService } from '../Services/SimpleMapService';

// Example API showing how Esri Leaflet-style API can work with esri-gl
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

// Example 2: Service Usage (requires actual map instance)
// In a real application, you would create a DynamicMapService like this:
// const dynamicService2 = new DynamicMapService('service-2', mapInstance, {
//   url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer',
// });
//
// Service direct identify method:
// dynamicService2.identify({ lng: -122.45, lat: 37.75 }, true)
//   .then(response => {
//     console.log('Service identify:', response);
//   })
//   .catch((error: unknown) => {
//     console.error('Service identify error:', error);
//   });

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

export { service, exampleAsync };
