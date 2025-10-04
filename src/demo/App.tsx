import React, { useMemo, useState } from 'react';
import DynamicMapServiceDemo from './components/esm/DynamicMapServiceDemo';
import TiledMapServiceDemo from './components/esm/TiledMapServiceDemo';
import FeatureServiceDemo from './components/esm/FeatureServiceDemo';
import ImageServiceDemo from './components/esm/ImageServiceDemo';
import VectorTileServiceDemo from './components/esm/VectorTileServiceDemo';
import VectorBasemapStyleDemo from './components/esm/VectorBasemapStyleDemo';
import IdentifyFeaturesDemo from './components/esm/IdentifyFeaturesDemo';
import QueryDemo from './components/esm/QueryDemo';
import FindDemo from './components/esm/FindDemo';
import IdentifyImageDemo from './components/esm/IdentifyImageDemo';
import MapLibreHooksDemo from './components/react-hooks/MapLibreHooksDemo';
import ReactMapGLMapLibreDemo from './components/react-map-gl/MapLibreReactMapGLDemo';

type CategoryId = 'esm' | 'react-hooks' | 'react-map-gl';

interface DemoTab {
  id: string;
  label: string;
  component: React.ComponentType;
}

interface CategoryDefinition {
  id: CategoryId;
  label: string;
  description: string;
  tabs: DemoTab[];
}

const CATEGORY_STORAGE_KEY = 'esri-gl:demo:category';
const TAB_STORAGE_PREFIX = 'esri-gl:demo:tab:' as const;

const ESM_TABS: DemoTab[] = [
  { id: 'dynamic', label: 'Dynamic Map Service', component: DynamicMapServiceDemo },
  { id: 'tiled', label: 'Tiled Map Service', component: TiledMapServiceDemo },
  { id: 'features', label: 'Feature Service', component: FeatureServiceDemo },
  { id: 'image', label: 'Image Service', component: ImageServiceDemo },
  { id: 'vector', label: 'Vector Tile Service', component: VectorTileServiceDemo },
  { id: 'basemap', label: 'Vector Basemap Style', component: VectorBasemapStyleDemo },
  { id: 'identify', label: 'Identify Features', component: IdentifyFeaturesDemo },
  { id: 'query', label: 'Query Task', component: QueryDemo },
  { id: 'find', label: 'Find Task', component: FindDemo },
  { id: 'identify-image', label: 'Identify Image', component: IdentifyImageDemo },
];

const HOOK_TABS: DemoTab[] = [
  { id: 'hooks-maplibre', label: 'MapLibre Hooks', component: MapLibreHooksDemo },
];

const REACT_MAP_GL_TABS: DemoTab[] = [
  {
    id: 'react-map-gl-maplibre',
    label: 'MapLibre + react-map-gl',
    component: ReactMapGLMapLibreDemo,
  },
];

const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    id: 'esm',
    label: 'ESM Services',
    description: 'Direct MapLibre integrations using the esri-gl services and tasks APIs.',
    tabs: ESM_TABS,
  },
  {
    id: 'react-hooks',
    label: 'React Hooks',
    description: 'Lifecycle-managed ArcGIS services powered by esri-gl React hooks.',
    tabs: HOOK_TABS,
  },
  {
    id: 'react-map-gl',
    label: 'react-map-gl',
    description: 'Drop-in react-map-gl components and hooks for MapLibre and Mapbox projects.',
    tabs: REACT_MAP_GL_TABS,
  },
];

const safeReadStorage = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const App: React.FC = () => {
  const categoryIds = useMemo(() => CATEGORY_DEFINITIONS.map(category => category.id), []);

  const [activeCategory, setActiveCategory] = useState<CategoryId>(() => {
    const stored = safeReadStorage(CATEGORY_STORAGE_KEY);
    if (stored && categoryIds.includes(stored as CategoryId)) {
      return stored as CategoryId;
    }
    return 'esm';
  });

  const [activeTabs, setActiveTabs] = useState<Record<CategoryId, string>>(() => {
    const initial: Record<CategoryId, string> = {
      esm: ESM_TABS[0]?.id ?? '',
      'react-hooks': HOOK_TABS[0]?.id ?? '',
      'react-map-gl': REACT_MAP_GL_TABS[0]?.id ?? '',
    };

    CATEGORY_DEFINITIONS.forEach(category => {
      const stored = safeReadStorage(`${TAB_STORAGE_PREFIX}${category.id}`);
      if (stored && category.tabs.some(tab => tab.id === stored)) {
        initial[category.id] = stored;
      }
    });

    return initial;
  });

  const handleCategoryChange = (category: CategoryId) => {
    setActiveCategory(category);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(CATEGORY_STORAGE_KEY, category);
      } catch {
        // ignore storage errors
      }
    }
  };

  const handleTabChange = (category: CategoryId, tabId: string) => {
    setActiveTabs(prev => {
      const next = { ...prev, [category]: tabId };
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(`${TAB_STORAGE_PREFIX}${category}`, tabId);
        } catch {
          // ignore storage errors
        }
      }
      return next;
    });
  };

  const selectedCategory = useMemo(
    () =>
      CATEGORY_DEFINITIONS.find(category => category.id === activeCategory) ??
      CATEGORY_DEFINITIONS[0],
    [activeCategory]
  );

  const activeTabId = activeTabs[selectedCategory.id] || selectedCategory.tabs[0]?.id;
  const ActiveComponent =
    selectedCategory.tabs.find(tab => tab.id === activeTabId)?.component ||
    selectedCategory.tabs[0]?.component ||
    (() => null);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          backgroundColor: '#1f2937',
          color: 'white',
          padding: '14px 24px',
          borderBottom: '1px solid #111827',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '24px' }}>esri-gl Demo Gallery</h1>
        <p style={{ margin: '6px 0 0 0', fontSize: '14px', opacity: 0.85 }}>
          Compare direct MapLibre integrations, React hooks, and react-map-gl examples side by side.
        </p>
      </header>

      <nav
        style={{
          backgroundColor: '#f3f4f6',
          borderBottom: '1px solid #d1d5db',
          padding: '0 16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '8px',
            minWidth: 'max-content',
            padding: '12px 0',
          }}
        >
          {CATEGORY_DEFINITIONS.map(category => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              style={{
                padding: '10px 18px',
                borderRadius: '999px',
                border: '1px solid',
                borderColor: activeCategory === category.id ? '#2563eb' : '#d1d5db',
                backgroundColor: activeCategory === category.id ? '#2563eb' : 'white',
                color: activeCategory === category.id ? '#ffffff' : '#1f2937',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'background-color 0.2s ease, color 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {category.label}
            </button>
          ))}
        </div>
      </nav>

      <section
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          padding: '0 16px 12px 16px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ margin: 0, color: '#4b5563', fontSize: '14px' }}>
            {selectedCategory.description}
          </p>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
            {selectedCategory.tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(selectedCategory.id, tab.id)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: activeTabId === tab.id ? '#1d4ed8' : '#d1d5db',
                  backgroundColor: activeTabId === tab.id ? '#1d4ed8' : '#f9fafb',
                  color: activeTabId === tab.id ? '#ffffff' : '#1f2937',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main style={{ flex: 1, overflow: 'hidden' }}>
        <ActiveComponent />
      </main>
    </div>
  );
};

export default App;
