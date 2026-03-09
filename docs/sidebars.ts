import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
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
      label: 'React Integration',
      items: [
        'react/hooks',
        'react/react-map-gl',
      ],
    },
    'api/types',
    {
      type: 'category',
      label: 'Examples',
      items: [
        'examples/advanced',
        'examples/performance',
        'examples/real-world',
        'examples/html-viewer',
      ],
    },
  ],
};

export default sidebars;
