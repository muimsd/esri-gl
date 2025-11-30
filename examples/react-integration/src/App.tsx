import { Fragment, useMemo, useState, type ReactNode } from 'react';
import AdvancedFeaturesExample from './components/AdvancedFeaturesExample';
import HooksExample from './components/HooksExample';
import IdentifyExample from './components/IdentifyExample';
import MapLibreIntegrationExample from './components/MapLibreIntegrationExample';
import ReactMapGLExample from './components/ReactMapGLExample';

type TabId = 'hooks' | 'mapgl' | 'identify' | 'maplibre' | 'advanced';

interface TabDefinition {
	readonly id: TabId;
	readonly label: string;
	readonly description: string;
	readonly component: ReactNode;
}

const TABS: TabDefinition[] = [
	{
		id: 'hooks',
		label: 'React Hooks',
		description: 'Lifecycle-managed services with the esri-gl React hook helpers.',
		component: <HooksExample />,
	},
	{
		id: 'mapgl',
		label: 'React Map GL',
		description: 'Full react-map-gl integration using Esri service components.',
		component: <ReactMapGLExample />,
	},
	{
		id: 'identify',
		label: 'Identify Features',
		description: 'Task-based identify workflow on MapLibre maps.',
		component: <IdentifyExample />,
	},
	{
		id: 'maplibre',
		label: 'MapLibre Direct',
		description: 'Vanilla MapLibre service wiring without React abstractions.',
		component: <MapLibreIntegrationExample />,
	},
	{
		id: 'advanced',
		label: 'Advanced Config',
		description: 'Demonstrates live layer filtering and metadata.',
		component: <AdvancedFeaturesExample />,
	},
];

function App() {
	const [activeTab, setActiveTab] = useState<TabId>('hooks');
	const activeDefinition = useMemo(
		() => TABS.find(tab => tab.id === activeTab) ?? TABS[0],
		[activeTab],
	);

	return (
		<div>
			<header style={{ marginBottom: 40 }}>
				<h1>Esri GL React Integration Examples</h1>
				<p>
					Explore the same examples that power the interactive docs site. Tabs below swap between hook-based
					and component-based integrations for MapLibre GL JS and react-map-gl.
				</p>
				<nav
					role="tablist"
					aria-label="Esri GL example picker"
					style={{
						display: 'flex',
						flexWrap: 'wrap',
						gap: 8,
					}}
				>
					{TABS.map(tab => {
						const isActive = tab.id === activeDefinition.id;
						return (
							<button
								key={tab.id}
								role="tab"
								aria-selected={isActive}
								aria-controls={`tab-panel-${tab.id}`}
								onClick={() => setActiveTab(tab.id)}
								style={{
									padding: '8px 16px',
									borderRadius: 18,
									border: '1px solid #cbd5f5',
									background: isActive ? '#1d4ed8' : '#f1f5f9',
									color: isActive ? '#fff' : '#1e293b',
									cursor: 'pointer',
								}}
							>
								{tab.label}
							</button>
						);
					})}
				</nav>
				<p style={{ marginTop: 12, color: '#475569' }}>{activeDefinition.description}</p>
			</header>
			<main>
				{TABS.map(tab => (
					<Fragment key={tab.id}>
						{activeDefinition.id === tab.id && (
							<section id={`tab-panel-${tab.id}`} role="tabpanel">
								{tab.component}
							</section>
						)}
					</Fragment>
				))}
			</main>
		</div>
	);
}

export default App;