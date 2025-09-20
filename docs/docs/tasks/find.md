# Find Task

Perform text-based searches across multiple fields in ArcGIS Feature Services. The Find task is perfect for implementing search functionality that looks for text matches across various attribute fields.

## Constructor

```typescript
new Find(options)
find(options) // Convenience function
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | `string` | | **Required** URL of the Feature Service |
| token | `string` | | Authentication token |
| fetchOptions | `object` | | Additional fetch request options |

## Chainable Methods

### `.text(searchText)`
Set the text to search for.

```typescript
find({ url: '...' }).text('San Francisco')
```

### `.fields(fieldArray)`
Specify which fields to search in.

```typescript
find({ url: '...' })
  .text('School')
  .fields(['NAME', 'DESCRIPTION', 'TYPE'])
```

### `.contains()`
Search for text anywhere within field values (default behavior).

```typescript
find({ url: '...' }).text('Park').contains()
// Matches: "Central Park", "Parking Lot", "National Park Service"
```

### `.startsWith()`
Search for text at the beginning of field values.

```typescript
find({ url: '...' }).text('San').startsWith()
// Matches: "San Francisco", "San Diego", but not "Mission San Juan"
```

### `.exactMatch()`
Search for exact text matches only.

```typescript
find({ url: '...' }).text('CA').exactMatch()
// Matches only "CA", not "California" or "CAT"
```

### `.layers(layerArray)`
Specify which layers to search (for Map Services).

```typescript
find({ url: 'MapServer' }).layers([0, 1, 3])
```

### `.spatialRel(relationship)`
Set spatial relationship for geometry filtering.

```typescript
find({ url: '...' }).spatialRel('esriSpatialRelIntersects')
```

### `.geometry(geom)`
Add spatial filter to the search.

```typescript
find({ url: '...' })
  .text('Restaurant')
  .geometry({
    type: 'Polygon',
    coordinates: [/* boundary coordinates */]
  })
```

## Usage Examples

### Basic Text Search

```typescript
import { find } from 'esri-gl';

// Find all features containing "School"
const schools = await find({
  url: 'https://services.arcgis.com/.../Facilities/FeatureServer/0'
})
.text('School')
.fields(['NAME', 'ADDRESS', 'TYPE']);

console.log(`Found ${schools.features.length} school facilities`);
```

### Multi-Field Search

```typescript
// Search across multiple fields for business names
const businessSearch = await find({
  url: 'https://services.arcgis.com/.../Businesses/FeatureServer/0'
})
.text('Coffee')
.fields(['BUSINESS_NAME', 'DESCRIPTION', 'CATEGORY', 'KEYWORDS']);

console.log('Coffee businesses:', businessSearch.features);
```

### Spatial Text Search

```typescript
// Find restaurants within downtown area
const downtownRestaurants = await find({
  url: 'https://services.arcgis.com/.../Restaurants/FeatureServer/0'
})
.text('Restaurant')
.geometry({
  type: 'Polygon',
  coordinates: [[
    [-122.425, 37.775],
    [-122.400, 37.775],
    [-122.400, 37.755],
    [-122.425, 37.755],
    [-122.425, 37.775]
  ]]
})
.fields(['NAME', 'ADDRESS', 'CUISINE_TYPE']);

console.log('Downtown restaurants:', downtownRestaurants.features.length);
```

### Advanced Search Interface

```typescript
class AdvancedFinder {
  private baseUrl: string;
  private searchFields: string[];

  constructor(baseUrl: string, searchFields: string[]) {
    this.baseUrl = baseUrl;
    this.searchFields = searchFields;
  }

  async fuzzySearch(searchText: string, options: any = {}) {
    const searchTerms = searchText.toLowerCase().split(' ');
    const results = [];

    // Try exact phrase first
    const exactResults = await this.performSearch(searchText, 'exact');
    if (exactResults.features.length > 0) {
      results.push(...exactResults.features);
    }

    // Then try contains search
    if (results.length < 10) {
      const containsResults = await this.performSearch(searchText, 'contains');
      const newResults = containsResults.features.filter(
        f => !results.some(existing => existing.properties.OBJECTID === f.properties.OBJECTID)
      );
      results.push(...newResults);
    }

    // Finally try individual terms
    if (results.length < 10 && searchTerms.length > 1) {
      for (const term of searchTerms) {
        if (term.length > 2) {
          const termResults = await this.performSearch(term, 'contains');
          const newResults = termResults.features.filter(
            f => !results.some(existing => existing.properties.OBJECTID === f.properties.OBJECTID)
          );
          results.push(...newResults.slice(0, 5)); // Limit individual term results
        }
      }
    }

    return {
      type: 'FeatureCollection',
      features: results.slice(0, options.limit || 20)
    };
  }

  private async performSearch(text: string, mode: 'exact' | 'contains' | 'starts') {
    const finder = find({ url: this.baseUrl })
      .text(text)
      .fields(this.searchFields);

    switch (mode) {
      case 'exact':
        return await finder.exactMatch();
      case 'starts':
        return await finder.startsWith();
      case 'contains':
      default:
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
```

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

    const finder = find({ url: serviceUrl })
      .text(searchText)
      .fields(['*']);

    if (geometry) {
      finder.geometry(geometry);
    }

    const results = await finder.contains();
    
    return {
      category,
      results: results.features,
      count: results.features.length
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
          error: error.message
        };
      }
    });

    const results = await Promise.all(searchPromises);
    
    return {
      searchText,
      categories: results,
      totalResults: results.reduce((sum, cat) => sum + cat.count, 0)
    };
  }

  async getPopularSearches(category: string, limit = 10) {
    // This would typically query a separate analytics service
    // For demo purposes, return common search terms
    const popularTerms = {
      restaurants: ['pizza', 'coffee', 'sushi', 'burger', 'mexican', 'italian'],
      schools: ['elementary', 'high school', 'middle school', 'private', 'public'],
      hospitals: ['emergency', 'clinic', 'urgent care', 'medical center'],
      parks: ['playground', 'dog park', 'trail', 'picnic', 'sports']
    };

    return popularTerms[category] || [];
  }
}

// Usage
const categoryFinder = new CategoryFinder();

// Search specific category
const restaurants = await categoryFinder.searchCategory('restaurants', 'pizza', {
  type: 'Point',
  coordinates: [-122.4194, 37.7749]
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

  const performSearch = useCallback(async (searchText: string) => {
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
  }, [serviceUrl, searchFields, onResults]);

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
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
        className="search-input"
      />
      
      {loading && <div className="search-loading">Searching...</div>}
      
      {suggestions.length > 0 && (
        <div className="search-suggestions">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="suggestion-item"
              onClick={() => setQuery(suggestion)}
            >
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
      onRemove: () => searchContainer.remove()
    };
    
    this.map.addControl(searchControl, 'top-left');

    // Add search functionality
    let searchTimeout: NodeJS.Timeout;
    searchInput.addEventListener('input', (e) => {
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
        url: 'https://services.arcgis.com/.../POI/FeatureServer/0'
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
        data: results
      });

      this.map.addLayer({
        id: this.searchLayer,
        type: 'circle',
        source: this.searchLayer,
        paint: {
          'circle-radius': 8,
          'circle-color': '#ff4444',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2
        }
      });

      // Add click handler for popups
      this.map.on('click', this.searchLayer, (e) => {
        const feature = e.features[0];
        this.popup
          .setLngLat(e.lngLat)
          .setHTML(this.formatPopup(feature))
          .addTo(this.map);
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
        features: []
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
      error: error.message
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