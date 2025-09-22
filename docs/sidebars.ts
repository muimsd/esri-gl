import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // Main documentation sidebar
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Services',
      items: [
        'services/overview',
        'services/dynamic-map-service',
        'services/tiled-map-service',
        'services/image-service',
        'services/feature-service',
        'services/vector-tile-service',
        'services/vector-basemap-style',
      ],
    },
    {
      type: 'category',
      label: 'Tasks',
      items: [
        'tasks/overview',
        'tasks/identify-features',
        'tasks/identify-image',
        'tasks/query', 
        'tasks/find',
      ],
    },
    {
      type: 'category', 
      label: 'API Reference',
      items: [
        'api/dynamic-map-service',
        'api/tiled-map-service',
        'api/image-service',
        'api/feature-service',
        'api/vector-tile-service',
        'api/vector-basemap-style',
        'api/identify-features',
        'api/identify-image',
        'api/query',
        'api/find',
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      items: [
        'examples/basic',
        'examples/advanced',
        'examples/performance',
        'examples/real-world',
        'examples/html-viewer',
      ],
    },
  ],
};

export default sidebars;
