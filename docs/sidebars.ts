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
      ],
    },
    {
      type: 'category',
      label: 'Tasks',
      items: [
        'tasks/overview',
        'tasks/identify-features',
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
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      items: [
        'examples/basic',
        'examples/advanced',
      ],
    },
  ],
};

export default sidebars;
