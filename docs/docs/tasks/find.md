# Find Task

Perform text-based searches across multiple fields in ArcGIS Feature Services. The Find task is perfect for implementing search functionality that looks for text matches across various attribute fields.

## Constructor

```typescript
new Find(options);
find(options); // Convenience function
```

| Option       | Type     | Default | Description                             |
| ------------ | -------- | ------- | --------------------------------------- |
| url          | `string` |         | **Required** URL of the Feature Service |
| token        | `string` |         | Authentication token                    |
| fetchOptions | `object` |         | Additional fetch request options        |

## Chainable Methods

### `.text(searchText)`

Set the text to search for.

```typescript
find({ url: '...' }).text('San Francisco');
```

### `.fields(fieldArray)`

Specify which fields to search in.

```typescript
find({ url: '...' }).text('School').fields(['NAME', 'DESCRIPTION', 'TYPE']);
```

### `.contains()`

Search for text anywhere within field values (default behavior).

```typescript
find({ url: '...' }).text('Park').contains();
// Matches: "Central Park", "Parking Lot", "National Park Service"
```

### `.startsWith()`

Search for text at the beginning of field values.

```typescript
find({ url: '...' }).text('San').startsWith();
// Matches: "San Francisco", "San Diego", but not "Mission San Juan"
```

### `.exactMatch()`

Search for exact text matches only.

```typescript
find({ url: '...' }).text('CA').exactMatch();
// Matches only "CA", not "California" or "CAT"
```

### `.layers(layerArray)`

Specify which layers to search (for Map Services).

```typescript
find({ url: 'MapServer' }).layers([0, 1, 3]);
```

### `.spatialRel(relationship)`

Set spatial relationship for geometry filtering.

```typescript
find({ url: '...' }).spatialRel('esriSpatialRelIntersects');
```

### `.geometry(geom)`

Add spatial filter to the search.

```typescript
find({ url: '...' }).text('Restaurant').geometry({
  type: 'Polygon',
  coordinates: [
    /* boundary coordinates */
  ],
});
```

## Usage Examples

### Interactive Find Search Component

Here's a complete example based on our demo implementation, showing how to build an interactive find search interface:

```typescript
import { useEffect, useRef, useState } from 'react';
import { Map } from 'maplibre-gl';
import { DynamicMapService, find } from 'esri-gl';

const FindSearchDemo = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const [searchText, setSearchText] = useState('');
  const [searchFields, setSearchFields] = useState('STATE_ABBR,STATE_NAME');
  const [layers, setLayers] = useState('all');
  const [searchType, setSearchType] = useState('startsWith');
  const [isSearching, setIsSearching] = useState(false);
  const [findResults, setFindResults] = useState<any>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize MapLibre GL JS map
    map.current = new Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [-95, 37],
      zoom: 4
    });

    // Add ArcGIS service layer
    const service = new DynamicMapService(
      'usa-states',
      map.current,
      {
        url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer'
      }
    );

    // Add layer to map
    map.current.on('load', () => {
      map.current.addLayer({
        id: 'usa-states-layer',
        type: 'raster',
        source: 'usa-states'
      });
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  const executeFind = async () => {
    if (!searchText.trim() || !map.current) return;

    setIsSearching(true);
    setFindResults(null);

    try {
      // Configure find task
      let findTask = find({
        url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer'
      }).text(searchText);

      // Set search fields
      if (searchFields) {
        findTask = findTask.fields(searchFields.split(',').map(f => f.trim()));
      }

      // Set layers to search
      if (layers !== 'all') {
        const layerIds = layers.split(',').map(l => parseInt(l.trim())).filter(id => !isNaN(id));
        if (layerIds.length > 0) {
          findTask = findTask.layers(layerIds);
        }
      }

      // Apply search type
      if (searchType === 'startsWith') {
        findTask = findTask.startsWith();
      }
      // Default is contains search

      // Execute search
      const results = await findTask;
      setFindResults(results);

      // Visualize results on map
      if (results.features.length > 0) {
        // Remove existing results
        if (map.current.getLayer('find-results')) {
          map.current.removeLayer('find-results');
          map.current.removeSource('find-results');
        }

        // Add results to map
        map.current.addSource('find-results', {
          type: 'geojson',
          data: results
        });

        map.current.addLayer({
          id: 'find-results',
          type: 'fill',
          source: 'find-results',
          paint: {
            'fill-color': '#ff4444',
            'fill-opacity': 0.3,
            'fill-outline-color': '#ff0000'
          }
        });

        // Fit map to results
        const allCoords: [number, number][] = [];
        results.features.forEach((feature: GeoJSON.Feature) => {
          if (feature.geometry?.type === 'Polygon') {
            const coords = (feature.geometry as GeoJSON.Polygon).coordinates[0];
            coords.forEach((coord: number[]) => {
              if (coord.length >= 2) {
                allCoords.push([coord[0], coord[1]]);
              }
            });
          }
        });

        if (allCoords.length > 0) {
          const bounds = allCoords.reduce(
            (bounds, coord) => bounds.extend(coord),
            new LngLatBounds()
          );
          map.current.fitBounds(bounds, { padding: 50 });
        }
      }
    } catch (error) {
      console.error('Find failed:', error);
      setFindResults({
        error: error instanceof Error ? error.message : 'Search failed',
        features: []
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Search Controls */}
      <div style={{ padding: '15px', background: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
        <h3>Interactive Find Search</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Search Text:
            </label>
            <input
              type="text"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="Try: CA, TX, NY"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Search Fields:
            </label>
            <input
              type="text"
              value={searchFields}
              onChange={e => setSearchFields(e.target.value)}
              placeholder="STATE_ABBR,STATE_NAME"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Layers:
            </label>
            <input
              type="text"
              value={layers}
              onChange={e => setLayers(e.target.value)}
              placeholder="all or 0,1,2"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Search Type:
            </label>
            <select
              value={searchType}
              onChange={e => setSearchType(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="startsWith">Starts With</option>
              <option value="contains">Contains</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={executeFind}
            disabled={isSearching || !searchText.trim()}
            style={{
              padding: '10px 20px',
              backgroundColor: isSearching ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isSearching || !searchText.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {isSearching ? 'Searching...' : 'Find Features'}
          </button>

          <button
            onClick={() => {
              setFindResults(null);
              if (map.current?.getLayer('find-results')) {
                map.current.removeLayer('find-results');
                map.current.removeSource('find-results');
              }
            }}
            disabled={!findResults}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: findResults ? 'pointer' : 'not-allowed',
            }}
          >
            Clear Results
          </button>
        </div>

        {/* Results Display */}
        {findResults && (
          <div style={{
            marginTop: '15px',
            padding: '15px',
            background: 'white',
            borderRadius: '6px',
            border: '1px solid #dee2e6'
          }}>
            {findResults.error ? (
              <div style={{ color: '#dc3545' }}>
                <strong>Error:</strong> {findResults.error}
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                  Found {findResults.features?.length || 0} features
                </div>
                {findResults.features?.slice(0, 3).map((feature: GeoJSON.Feature, index: number) => (
                  <div key={index} style={{
                    marginBottom: '10px',
                    padding: '10px',
                    background: '#f8f9fa',
                    borderRadius: '4px',
                    border: '1px solid #e9ecef'
                  }}>
                    <strong>Feature {index + 1}:</strong>
                    {Object.entries(feature.properties || {}).map(([key, value]) => (
                      <div key={key} style={{ marginLeft: '15px', marginTop: '5px' }}>
                        <span style={{ fontWeight: '500' }}>{key}:</span> {String(value)}
                      </div>
                    ))}
                  </div>
                ))}
                {(findResults.features?.length || 0) > 3 && (
                  <div style={{ fontStyle: 'italic', color: '#6c757d' }}>
                    ... and {(findResults.features?.length || 0) - 3} more features
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div ref={mapContainer} style={{ flex: 1 }} />
    </div>
  );
};
```

### Basic Text Search

```typescript
import { find } from 'esri-gl';

// Find all features containing "School"
const schools = await find({
  url: 'https://services.arcgis.com/.../Facilities/FeatureServer/0',
})
  .text('School')
  .fields(['NAME', 'ADDRESS', 'TYPE']);

console.log(`Found ${schools.features.length} school facilities`);
```

### Multi-Field Search with Error Handling

```typescript
// Search across multiple fields for business names
const findBusinesses = async (searchTerm: string) => {
  try {
    const businessSearch = await find({
      url: 'https://services.arcgis.com/.../Businesses/FeatureServer/0',
    })
      .text(searchTerm)
      .fields(['BUSINESS_NAME', 'DESCRIPTION', 'CATEGORY', 'KEYWORDS'])
      .contains(); // Use contains for broader matching

    if (businessSearch.features.length === 0) {
      console.log('No businesses found for:', searchTerm);
      return null;
    }

    // Process results
    const businesses = businessSearch.features.map(feature => ({
      id: feature.properties.OBJECTID,
      name: feature.properties.BUSINESS_NAME,
      category: feature.properties.CATEGORY,
      coordinates: feature.geometry.type === 'Point' ? feature.geometry.coordinates : null,
    }));

    console.log(`Found ${businesses.length} businesses:`, businesses);
    return businesses;
  } catch (error) {
    console.error('Business search failed:', error);
    throw new Error(`Failed to search businesses: ${error.message}`);
  }
};

// Usage
await findBusinesses('Coffee');
```

### Spatial Text Search with Map Integration

```typescript
import { Map } from 'maplibre-gl';

const spatialTextSearch = async (map: Map, searchArea: GeoJSON.Polygon) => {
  try {
    // Find restaurants within specified area
    const restaurants = await find({
      url: 'https://services.arcgis.com/.../Restaurants/FeatureServer/0',
    })
      .text('Restaurant')
      .geometry(searchArea)
      .spatialRel('esriSpatialRelWithin')
      .fields(['NAME', 'ADDRESS', 'CUISINE_TYPE', 'RATING'])
      .contains();

    // Add results to map
    if (restaurants.features.length > 0) {
      // Remove existing results
      if (map.getSource('search-results')) {
        map.removeLayer('search-results-points');
        map.removeSource('search-results');
      }

      // Add new results
      map.addSource('search-results', {
        type: 'geojson',
        data: restaurants,
      });

      map.addLayer({
        id: 'search-results-points',
        type: 'circle',
        source: 'search-results',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 4, 15, 8, 20, 16],
          'circle-color': [
            'case',
            ['>=', ['get', 'RATING'], 4],
            '#28a745', // Green for high rating
            ['>=', ['get', 'RATING'], 3],
            '#ffc107', // Yellow for medium rating
            '#dc3545', // Red for low rating
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      });

      // Fit map to results
      const bounds = new LngLatBounds();
      restaurants.features.forEach(feature => {
        if (feature.geometry.type === 'Point') {
          bounds.extend(feature.geometry.coordinates as [number, number]);
        }
      });
      map.fitBounds(bounds, { padding: 50 });

      return restaurants.features.length;
    }

    return 0;
  } catch (error) {
    console.error('Spatial search failed:', error);
    return 0;
  }
};

// Define search area (downtown area)
const downtownBounds = {
  type: 'Polygon' as const,
  coordinates: [
    [
      [-122.425, 37.775],
      [-122.4, 37.775],
      [-122.4, 37.755],
      [-122.425, 37.755],
      [-122.425, 37.775],
    ],
  ],
};

// Execute search
const resultCount = await spatialTextSearch(map, downtownBounds);
console.log(`Found ${resultCount} restaurants in downtown area`);
```

### Advanced Search with Autocomplete

```typescript
class SmartSearchService {
  private searchHistory: Map<string, any> = new Map();
  private debounceTimer: NodeJS.Timeout | null = null;

  constructor(
    private serviceUrl: string,
    private searchFields: string[],
    private maxResults: number = 20
  ) {}

  // Debounced search with caching
  async searchWithAutocomplete(
    query: string,
    onResults: (results: GeoJSON.Feature[]) => void,
    onError: (error: string) => void
  ) {
    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Minimum search length
    if (query.length < 2) {
      onResults([]);
      return;
    }

    // Check cache
    if (this.searchHistory.has(query)) {
      onResults(this.searchHistory.get(query));
      return;
    }

    // Debounce search
    this.debounceTimer = setTimeout(async () => {
      try {
        const results = await this.performSearch(query);

        // Cache results
        this.searchHistory.set(query, results.features);

        // Limit cache size
        if (this.searchHistory.size > 100) {
          const firstKey = this.searchHistory.keys().next().value;
          this.searchHistory.delete(firstKey);
        }

        onResults(results.features.slice(0, this.maxResults));
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Search failed');
      }
    }, 300); // 300ms debounce
  }

  private async performSearch(query: string) {
    // Try different search strategies
    const strategies = [
      () => this.exactSearch(query),
      () => this.startsWithSearch(query),
      () => this.containsSearch(query),
      () => this.fuzzySearch(query),
    ];

    for (const strategy of strategies) {
      try {
        const results = await strategy();
        if (results.features.length > 0) {
          return results;
        }
      } catch (error) {
        console.warn('Search strategy failed:', error);
      }
    }

    // Return empty results if all strategies fail
    return { type: 'FeatureCollection' as const, features: [] };
  }

  private async exactSearch(query: string) {
    return await find({ url: this.serviceUrl }).text(query).fields(this.searchFields).exactMatch();
  }

  private async startsWithSearch(query: string) {
    return await find({ url: this.serviceUrl }).text(query).fields(this.searchFields).startsWith();
  }

  private async containsSearch(query: string) {
    return await find({ url: this.serviceUrl }).text(query).fields(this.searchFields).contains();
  }

  private async fuzzySearch(query: string) {
    // Split query into terms for broader matching
    const terms = query
      .toLowerCase()
      .split(' ')
      .filter(term => term.length > 1);
    const allResults: GeoJSON.Feature[] = [];

    for (const term of terms) {
      try {
        const termResults = await find({ url: this.serviceUrl })
          .text(term)
          .fields(this.searchFields)
          .contains();

        // Add unique results
        termResults.features.forEach(feature => {
          const isDuplicate = allResults.some(
            existing => existing.properties?.OBJECTID === feature.properties?.OBJECTID
          );
          if (!isDuplicate) {
            allResults.push(feature);
          }
        });
      } catch (error) {
        console.warn(`Fuzzy search failed for term "${term}":`, error);
      }
    }

    return {
      type: 'FeatureCollection' as const,
      features: allResults,
    };
  }

  clearCache() {
    this.searchHistory.clear();
  }
}

// Usage example
const searchService = new SmartSearchService(
  'https://services.arcgis.com/.../Places/FeatureServer/0',
  ['NAME', 'CATEGORY', 'ADDRESS'],
  15
);

// In your React component or UI
const handleSearchInput = (query: string) => {
  searchService.searchWithAutocomplete(
    query,
    results => {
      // Update autocomplete dropdown
      setAutocompleteResults(
        results.map(feature => ({
          id: feature.properties.OBJECTID,
          text: feature.properties.NAME,
          subtext: feature.properties.ADDRESS,
          feature,
        }))
      );
    },
    error => {
      console.error('Autocomplete search failed:', error);
      setAutocompleteResults([]);
    }
  );
};
```

        };
```

        return await finder.contains();
    }
  }

  async searchWithSuggestions(searchText: string) {
    const results = await this.fuzzySearch(searchText);

    // Generate search suggestions based on results
    const suggestions = this.generateSuggestions(results.features, searchText);

    return {
      results,
      suggestions,
      count: results.features.length
    };
  }

  private generateSuggestions(features: any[], searchText: string): string[] {
    const suggestions = new Set<string>();
    const lowerSearch = searchText.toLowerCase();

    features.forEach(feature => {
      this.searchFields.forEach(field => {
        const value = feature.properties[field];
        if (typeof value === 'string') {
          const words = value.toLowerCase().split(' ');
          words.forEach(word => {
            if (word.includes(lowerSearch) && word !== lowerSearch && word.length > 2) {
              suggestions.add(word);
            }
          });
        }
      });
    });

    return Array.from(suggestions).slice(0, 5);
  }
}

// Usage
const finder = new AdvancedFinder(
  'https://services.arcgis.com/.../POI/FeatureServer/0',
  ['NAME', 'CATEGORY', 'DESCRIPTION', 'ADDRESS']
);

const searchResult = await finder.searchWithSuggestions('coffe');
console.log('Search results:', searchResult.results.features.length);
console.log('Suggestions:', searchResult.suggestions); // ['coffee', 'coffeehouse', etc.]
            }
          });
        }
      });
    });

console.log('Search results:', searchResult.results.features.length);
console.log('Suggestions:', searchResult.suggestions); // ['coffee', 'coffeehouse', etc.]
```

### Autocomplete Implementation

```typescript
class AutocompleteSearch {
  private finder: any;
  private cache = new Map<string, any[]>();
  private debounceTimer: NodeJS.Timeout | null = null;

  constructor(serviceUrl: string, searchFields: string[]) {
    this.finder = find({ url: serviceUrl }).fields(searchFields);
  }

  async getSuggestions(input: string, callback: (suggestions: string[]) => void) {
    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Debounce the search
    this.debounceTimer = setTimeout(async () => {
      try {
        const suggestions = await this.performAutoComplete(input);
        callback(suggestions);
      } catch (error) {
        console.error('Autocomplete error:', error);
        callback([]);
      }
    }, 300);
  }

  private async performAutoComplete(input: string): Promise<string[]> {
    if (input.length < 2) return [];

    // Check cache first
    const cacheKey = input.toLowerCase();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) || [];
    }

    try {
      const results = await this.finder.text(input).contains();

      const suggestions = this.extractSuggestions(results.features, input);

      // Cache results
      this.cache.set(cacheKey, suggestions);

      // Limit cache size
      if (this.cache.size > 100) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }

      return suggestions;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  private extractSuggestions(features: any[], input: string): string[] {
    const suggestions = new Set<string>();
    const lowerInput = input.toLowerCase();

    features.forEach(feature => {
      Object.values(feature.properties).forEach(value => {
        if (typeof value === 'string') {
          const lowerValue = value.toLowerCase();
          if (lowerValue.includes(lowerInput) && value.length < 100) {
            suggestions.add(value);
          }
        }
      });
    });

    return Array.from(suggestions)
      .sort((a, b) => {
        // Sort by relevance (starts with input first)
        const aStarts = a.toLowerCase().startsWith(lowerInput);
        const bStarts = b.toLowerCase().startsWith(lowerInput);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.length - b.length; // Then by length
      })
      .slice(0, 10);
  }
}

// Usage with UI
const autocomplete = new AutocompleteSearch(
  'https://services.arcgis.com/.../Places/FeatureServer/0',
  ['NAME', 'CATEGORY', 'ADDRESS']
);

// HTML: <input id="search-input" type="text" placeholder="Search places...">
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const suggestionsList = document.getElementById('suggestions-list');

searchInput.addEventListener('input', (e) => {
  const value = (e.target as HTMLInputElement).value;

  autocomplete.getSuggestions(value, (suggestions) => {
    // Update UI with suggestions
    suggestionsList.innerHTML = suggestions
      .map(s => `<li class="suggestion-item">${s}</li>`)
      .join('');
  });
});
````

### Category-Based Search

```typescript
class CategoryFinder {
  private services: Map<string, string> = new Map();

  constructor() {
    // Register different service endpoints for different categories
    this.services.set('restaurants', 'https://services.arcgis.com/.../Restaurants/FeatureServer/0');
    this.services.set('schools', 'https://services.arcgis.com/.../Schools/FeatureServer/0');
    this.services.set('hospitals', 'https://services.arcgis.com/.../Healthcare/FeatureServer/0');
    this.services.set('parks', 'https://services.arcgis.com/.../Parks/FeatureServer/0');
  }

  async searchCategory(category: string, searchText: string, geometry?: any) {
    const serviceUrl = this.services.get(category.toLowerCase());
    if (!serviceUrl) {
      throw new Error(`Unknown category: ${category}`);
    }

    const finder = find({ url: serviceUrl }).text(searchText).fields(['*']);

    if (geometry) {
      finder.geometry(geometry);
    }

    const results = await finder.contains();

    return {
      category,
      results: results.features,
      count: results.features.length,
    };
  }

  async searchAllCategories(searchText: string, geometry?: any) {
    const categories = Array.from(this.services.keys());

    const searchPromises = categories.map(async category => {
      try {
        return await this.searchCategory(category, searchText, geometry);
      } catch (error) {
        console.error(`Search failed for ${category}:`, error);
        return {
          category,
          results: [],
          count: 0,
          error: error.message,
        };
      }
    });

    const results = await Promise.all(searchPromises);

    return {
      searchText,
      categories: results,
      totalResults: results.reduce((sum, cat) => sum + cat.count, 0),
    };
  }

  async getPopularSearches(category: string, limit = 10) {
    // This would typically query a separate analytics service
    // For demo purposes, return common search terms
    const popularTerms = {
      restaurants: ['pizza', 'coffee', 'sushi', 'burger', 'mexican', 'italian'],
      schools: ['elementary', 'high school', 'middle school', 'private', 'public'],
      hospitals: ['emergency', 'clinic', 'urgent care', 'medical center'],
      parks: ['playground', 'dog park', 'trail', 'picnic', 'sports'],
    };

    return popularTerms[category] || [];
  }
}

// Usage
const categoryFinder = new CategoryFinder();

// Search specific category
const restaurants = await categoryFinder.searchCategory('restaurants', 'pizza', {
  type: 'Point',
  coordinates: [-122.4194, 37.7749],
});

// Search all categories
const allResults = await categoryFinder.searchAllCategories('hospital');
console.log(`Found ${allResults.totalResults} results across all categories`);
```

## Integration Patterns

### React Search Component

```tsx
import React, { useState, useCallback, useEffect } from 'react';
import { find } from 'esri-gl';

interface SearchResult {
  type: 'FeatureCollection';
  features: any[];
}

const SearchComponent: React.FC<{
  serviceUrl: string;
  searchFields: string[];
  onResults: (results: SearchResult) => void;
}> = ({ serviceUrl, searchFields, onResults }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const performSearch = useCallback(
    async (searchText: string) => {
      if (!searchText.trim()) {
        onResults({ type: 'FeatureCollection', features: [] });
        return;
      }

      setLoading(true);
      try {
        const results = await find({ url: serviceUrl })
          .text(searchText)
          .fields(searchFields)
          .contains();

        onResults(results);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    },
    [serviceUrl, searchFields, onResults]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  return (
    <div className="search-container">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search..."
        className="search-input"
      />

      {loading && <div className="search-loading">Searching...</div>}

      {suggestions.length > 0 && (
        <div className="search-suggestions">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="suggestion-item" onClick={() => setQuery(suggestion)}>
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### Map Integration

```typescript
import { Map, Popup, LngLatBounds } from 'maplibre-gl';
import { find } from 'esri-gl';

class MapSearchControl {
  private map: Map;
  private popup: Popup;
  private searchLayer = 'search-results';

  constructor(map: Map) {
    this.map = map;
    this.popup = new Popup();
    this.addSearchControl();
  }

  private addSearchControl() {
    // Create search input
    const searchContainer = document.createElement('div');
    searchContainer.className = 'maplibre-ctrl maplibre-ctrl-group search-control';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search map...';
    searchInput.className = 'search-input';

    searchContainer.appendChild(searchInput);

    // Add to map
    const searchControl = {
      onAdd: () => searchContainer,
      onRemove: () => searchContainer.remove(),
    };

    this.map.addControl(searchControl, 'top-left');

    // Add search functionality
    let searchTimeout: NodeJS.Timeout;
    searchInput.addEventListener('input', e => {
      clearTimeout(searchTimeout);
      const query = (e.target as HTMLInputElement).value;

      searchTimeout = setTimeout(() => {
        this.performSearch(query);
      }, 500);
    });
  }

  async performSearch(query: string) {
    if (!query.trim()) {
      this.clearResults();
      return;
    }

    try {
      const results = await find({
        url: 'https://services.arcgis.com/.../POI/FeatureServer/0',
      })
        .text(query)
        .fields(['NAME', 'ADDRESS', 'CATEGORY'])
        .contains();

      this.displayResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  }

  private displayResults(results: any) {
    // Add results to map
    if (this.map.getSource(this.searchLayer)) {
      (this.map.getSource(this.searchLayer) as any).setData(results);
    } else {
      this.map.addSource(this.searchLayer, {
        type: 'geojson',
        data: results,
      });

      this.map.addLayer({
        id: this.searchLayer,
        type: 'circle',
        source: this.searchLayer,
        paint: {
          'circle-radius': 8,
          'circle-color': '#ff4444',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      });

      // Add click handler for popups
      this.map.on('click', this.searchLayer, e => {
        const feature = e.features[0];
        this.popup.setLngLat(e.lngLat).setHTML(this.formatPopup(feature)).addTo(this.map);
      });
    }

    // Zoom to results
    if (results.features.length > 0) {
      const bounds = new LngLatBounds();
      results.features.forEach((feature: any) => {
        bounds.extend(feature.geometry.coordinates);
      });
      this.map.fitBounds(bounds, { padding: 50 });
    }
  }

  private formatPopup(feature: any): string {
    const props = feature.properties;
    return `
      <div class="search-popup">
        <h3>${props.NAME || 'Unknown'}</h3>
        <p><strong>Category:</strong> ${props.CATEGORY || 'N/A'}</p>
        <p><strong>Address:</strong> ${props.ADDRESS || 'N/A'}</p>
      </div>
    `;
  }

  private clearResults() {
    if (this.map.getSource(this.searchLayer)) {
      (this.map.getSource(this.searchLayer) as any).setData({
        type: 'FeatureCollection',
        features: [],
      });
    }
    this.popup.remove();
  }
}

// Initialize
const searchControl = new MapSearchControl(map);
```

## Error Handling

```typescript
const robustFind = async (searchParams: any) => {
  try {
    // Validate search text
    if (!searchParams.text || searchParams.text.trim().length < 2) {
      return { type: 'FeatureCollection', features: [] };
    }

    const result = await find(searchParams);

    // Validate result
    if (!result || !Array.isArray(result.features)) {
      throw new Error('Invalid search result format');
    }

    return result;
  } catch (error) {
    console.error('Find operation failed:', error);

    // Return empty result on error
    return {
      type: 'FeatureCollection',
      features: [],
      error: error.message,
    };
  }
};
```

## Best Practices

1. **Debounce Input**: Always debounce user input to avoid excessive requests
2. **Minimum Length**: Require minimum 2-3 characters before searching
3. **Field Selection**: Limit search fields to relevant text fields only
4. **Result Limits**: Implement reasonable limits (e.g., 50 results)
5. **Cache Results**: Cache common searches for better performance
6. **Error Handling**: Always handle network errors gracefully
7. **User Feedback**: Provide loading indicators and clear result counts

## Common Use Cases

- **Place Search**: Finding locations, businesses, landmarks
- **Address Lookup**: Searching for specific addresses or streets
- **Category Filtering**: Finding all features of a specific type
- **Autocomplete**: Providing search suggestions as users type
- **Multi-Service Search**: Searching across multiple feature services
- **Spatial Search**: Combining text search with geographic boundaries
