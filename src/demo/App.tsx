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

// import MapLibreHooksDemo from './components/react-hooks/MapLibreHooksDemo';
import DynamicMapServiceHooksDemo from './components/react-hooks/DynamicMapServiceHooksDemo';
import TiledMapServiceHooksDemo from './components/react-hooks/TiledMapServiceHooksDemo';
import FeatureServiceHooksDemo from './components/react-hooks/FeatureServiceHooksDemo';
import ImageServiceHooksDemo from './components/react-hooks/ImageServiceHooksDemo';
import VectorTileServiceHooksDemo from './components/react-hooks/VectorTileServiceHooksDemo';
import VectorBasemapStyleHooksDemo from './components/react-hooks/VectorBasemapStyleHooksDemo';
import IdentifyFeaturesHooksDemo from './components/react-hooks/IdentifyFeaturesHooksDemo';
import QueryHooksDemo from './components/react-hooks/QueryHooksDemo';
import FindHooksDemo from './components/react-hooks/FindHooksDemo';

// import ReactMapGLMapLibreDemo from './components/react-map-gl/MapLibreReactMapGLDemo';
import DynamicMapServiceReactMapGLDemo from './components/react-map-gl/DynamicMapServiceReactMapGLDemo';
import TiledMapServiceReactMapGLDemo from './components/react-map-gl/TiledMapServiceReactMapGLDemo';
import FeatureServiceReactMapGLDemo from './components/react-map-gl/FeatureServiceReactMapGLDemo';
import ImageServiceReactMapGLDemo from './components/react-map-gl/ImageServiceReactMapGLDemo';
import VectorTileServiceReactMapGLDemo from './components/react-map-gl/VectorTileServiceReactMapGLDemo';
import VectorBasemapStyleReactMapGLDemo from './components/react-map-gl/VectorBasemapStyleReactMapGLDemo';
import IdentifyFeaturesReactMapGLDemo from './components/react-map-gl/IdentifyFeaturesReactMapGLDemo';
import IdentifyImageReactMapGLDemo from './components/react-map-gl/IdentifyImageReactMapGLDemo';

type CategoryId = 'esm' | 'react-hooks' | 'react-map-gl';

interface DemoTab {
  id: string;
  label: string;
  component: React.ComponentType;
}

interface CategoryDefinition {
  id: CategoryId;
  label: string;
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
  {
    id: 'hooks-dynamic',
    label: 'Dynamic Map Service',
    component: DynamicMapServiceHooksDemo,
  },
  {
    id: 'hooks-tiled',
    label: 'Tiled Map Service',
    component: TiledMapServiceHooksDemo,
  },
  {
    id: 'hooks-feature',
    label: 'Feature Service',
    component: FeatureServiceHooksDemo,
  },
  {
    id: 'hooks-image',
    label: 'Image Service',
    component: ImageServiceHooksDemo,
  },
  {
    id: 'hooks-vector-tile',
    label: 'Vector Tile Service',
    component: VectorTileServiceHooksDemo,
  },
  {
    id: 'hooks-vector-basemap',
    label: 'Vector Basemap Style',
    component: VectorBasemapStyleHooksDemo,
  },
  {
    id: 'hooks-identify-features',
    label: 'Identify Features',
    component: IdentifyFeaturesHooksDemo,
  },
  {
    id: 'hooks-query',
    label: 'Query Task',
    component: QueryHooksDemo,
  },
  {
    id: 'hooks-find',
    label: 'Find Task',
    component: FindHooksDemo,
  },
];

const REACT_MAP_GL_TABS: DemoTab[] = [
  {
    id: 'react-map-gl-dynamic',
    label: 'Dynamic Map Service',
    component: DynamicMapServiceReactMapGLDemo,
  },
  {
    id: 'react-map-gl-tiled',
    label: 'Tiled Map Service',
    component: TiledMapServiceReactMapGLDemo,
  },
  {
    id: 'react-map-gl-feature',
    label: 'Feature Service',
    component: FeatureServiceReactMapGLDemo,
  },
  {
    id: 'react-map-gl-image',
    label: 'Image Service',
    component: ImageServiceReactMapGLDemo,
  },
  {
    id: 'react-map-gl-vector-tile',
    label: 'Vector Tile Service',
    component: VectorTileServiceReactMapGLDemo,
  },
  {
    id: 'react-map-gl-vector-basemap',
    label: 'Vector Basemap Style',
    component: VectorBasemapStyleReactMapGLDemo,
  },
  {
    id: 'react-map-gl-identify-features',
    label: 'Identify Features',
    component: IdentifyFeaturesReactMapGLDemo,
  },
  {
    id: 'react-map-gl-identify-image',
    label: 'Identify Image',
    component: IdentifyImageReactMapGLDemo,
  },
];

const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    id: 'esm',
    label: 'ESM Services',
    tabs: ESM_TABS,
  },
  {
    id: 'react-hooks',
    label: 'React Hooks',
    tabs: HOOK_TABS,
  },
  {
    id: 'react-map-gl',
    label: 'react-map-gl',
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
    <div className="shell">
      <header className="shell-header">
        <span className="shell-logo">esri-gl</span>
        <span className="shell-version">v0.10.0</span>
        <nav className="shell-categories">
          {CATEGORY_DEFINITIONS.map(category => (
            <button
              key={category.id}
              className="shell-category"
              data-active={activeCategory === category.id}
              onClick={() => handleCategoryChange(category.id)}
            >
              {category.label}
            </button>
          ))}
        </nav>
        <a
          className="shell-github"
          href="https://github.com/esri-gl/esri-gl"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </a>
      </header>
      <div className="shell-tabs">
        {selectedCategory.tabs.map(tab => (
          <button
            key={tab.id}
            className="shell-tab"
            data-active={activeTabId === tab.id}
            onClick={() => handleTabChange(selectedCategory.id, tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <main className="shell-main">
        <ActiveComponent />
      </main>
    </div>
  );
};

export default App;
