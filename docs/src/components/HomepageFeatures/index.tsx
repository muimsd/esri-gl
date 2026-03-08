import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Three Entry Points',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Import from <code>esri-gl</code> for vanilla JS, <code>esri-gl/react</code> for
        12 React hooks, or <code>esri-gl/react-map-gl</code> for 6 ready-made components.
        Get started with just a few lines of code.
      </>
    ),
  },
  {
    title: 'Comprehensive Service Coverage',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        6 services and 4 tasks covering Dynamic Maps, Feature Services, Image Services,
        Tiled Maps, Vector Tiles, and Vector Basemap Styles with a
        high-performance <code>Service-Source</code> architecture.
      </>
    ),
  },
  {
    title: 'TypeScript First, Fully Tested',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Fully typed API verified by 727 tests across 31 suites. Production-ready
        with comprehensive support for ArcGIS REST services on MapLibre GL JS
        and Mapbox GL JS.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
