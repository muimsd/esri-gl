import { useMemo, useState } from 'react';
import Map, { NavigationControl, ScaleControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
	EsriDynamicLayer,
	EsriFeatureLayer,
	EsriImageLayer,
	EsriTiledLayer,
} from 'esri-gl/react-map-gl';

type LayerKey = 'dynamic' | 'feature' | 'tiled' | 'imagery';

const DEMO_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'your-mapbox-token-here';

const LAYER_COPY: Record<LayerKey, { title: string; description: string }> = {
	dynamic: {
		title: 'Dynamic Layer',
		description: 'Server-rendered USA map service with sublayer switching and layer definitions.',
	},
	feature: {
		title: 'Feature Layer',
		description: 'US States feature service with data-driven styling using POP2000.',
	},
	tiled: {
		title: 'Tiled Layer',
		description: 'Cached World Topographic Map tiles.',
	},
	imagery: {
		title: 'Imagery Layer',
		description: 'High-resolution World Imagery map service.',
	},
};

export default function ReactMapGLExample() {
	const [viewState, setViewState] = useState({
		longitude: -95.7129,
		latitude: 37.0902,
		zoom: 4,
	});
	const [visibleLayers, setVisibleLayers] = useState<Record<LayerKey, boolean>>({
		dynamic: true,
		feature: false,
		tiled: false,
		imagery: false,
	});
	const [dynamicLayers, setDynamicLayers] = useState<number[]>([0, 1, 2]);
	const [dynamicDefs, setDynamicDefs] = useState<Record<string, string>>({});
	const [featureWhere, setFeatureWhere] = useState("1=1");

	const anyLayerVisible = useMemo(() => Object.values(visibleLayers).some(Boolean), [visibleLayers]);
	const needsToken = DEMO_TOKEN === 'your-mapbox-token-here';

	const renderLayerToggle = (key: LayerKey) => (
		<button
			key={key}
			onClick={() => setVisibleLayers(prev => ({ ...prev, [key]: !prev[key] }))}
			style={{
				background: visibleLayers[key] ? '#007ACC' : '#f0f0f0',
				color: visibleLayers[key] ? '#fff' : '#333',
			}}
		>
			{visibleLayers[key] ? 'Hide' : 'Show'} {LAYER_COPY[key].title}
		</button>
	);

	return (
		<div className="example-section">
			<h2>React Map GL Integration</h2>
			<p>
				These components are the same ones used in our demos. They manage source creation, updates, and cleanup
				automatically so you can focus on map interactions. Toggle layers below to see how different service
				types stack together.
			</p>

			<div className="controls">
				{(['dynamic', 'feature', 'tiled', 'imagery'] as LayerKey[]).map(renderLayerToggle)}
			</div>

			<div style={{ margin: '12px 0', padding: '12px', background: '#f8fafc', borderRadius: 6 }}>
				<h4 style={{ margin: '0 0 12px 0' }}>Layer configuration</h4>
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
					<label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
						<span style={{ fontWeight: 600 }}>Dynamic sublayers</span>
						<select
							multiple
							value={dynamicLayers.map(String)}
							onChange={evt => {
								const selected = Array.from(evt.target.selectedOptions, option => Number(option.value));
								setDynamicLayers(selected);
							}}
							style={{ minHeight: 96 }}
						>
							<option value="0">States (0)</option>
							<option value="1">Highways (1)</option>
							<option value="2">Cities (2)</option>
						</select>
					</label>
					<label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
						<span style={{ fontWeight: 600 }}>Layer definition (layer 0)</span>
						<input
							type="text"
							placeholder="e.g. POP2000 > 1000000"
							onChange={evt => setDynamicDefs(prev => ({ ...prev, 0: evt.target.value }))}
						/>
					</label>
					<label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
						<span style={{ fontWeight: 600 }}>Feature where clause</span>
						<input
							type="text"
							value={featureWhere}
							onChange={evt => setFeatureWhere(evt.target.value)}
							placeholder="STATE_NAME LIKE 'C%'"
						/>
					</label>
				</div>
			</div>

			<div className="map-container">
				{needsToken ? (
					<div
						style={{
							height: '100%',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							background: '#f5f5f5',
							border: '2px dashed #cbd5f5',
						}}
					>
						<h3 style={{ marginBottom: 8 }}>Mapbox token required</h3>
						<p style={{ margin: 0 }}>Set <code>VITE_MAPBOX_TOKEN</code> in <code>.env</code> to run this example locally.</p>
					</div>
				) : (
					<Map
						{...viewState}
						onMove={evt => setViewState(evt.viewState)}
						mapStyle="mapbox://styles/mapbox/light-v10"
						mapboxAccessToken={DEMO_TOKEN}
						style={{ width: '100%', height: '100%' }}
					>
						<NavigationControl position="top-right" />
						<ScaleControl position="bottom-left" />
						{visibleLayers.dynamic && (
							<EsriDynamicLayer
								id="react-map-gl-dynamic"
								url="https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer"
								layers={dynamicLayers}
								layerDefs={Object.keys(dynamicDefs).length ? dynamicDefs : undefined}
								visible
							/>
						)}
						{visibleLayers.feature && (
							<EsriFeatureLayer
								id="react-map-gl-feature"
								url="https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_States/FeatureServer/0"
								where={featureWhere}
								paint={{
									'fill-color': [
										'interpolate',
										['linear'],
										['get', 'POP2000'],
										0,
										'#f0f9ff',
										1000000,
										'#38bdf8',
										5000000,
										'#0284c7',
									],
									'fill-opacity': 0.7,
									'fill-outline-color': '#1e293b',
								}}
								visible
							/>
						)}
						{visibleLayers.tiled && (
							<EsriTiledLayer
								id="react-map-gl-tiled"
								url="https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer"
								visible
							/>
						)}
						{visibleLayers.imagery && (
							<EsriImageLayer
								id="react-map-gl-imagery"
								url="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
								visible
							/>
						)}
					</Map>
				)}
			</div>

			<section style={{ marginTop: 24, display: 'grid', gap: 18 }}>
				<header style={{ fontSize: 14, color: '#475569' }}>
					<strong>Layer summary:</strong> {anyLayerVisible ? 'interactive' : 'toggle a layer above to get started'}
				</header>
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
					{(Object.keys(LAYER_COPY) as LayerKey[]).map(key => (
						<article key={key} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
							<h4 style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
								<span>{LAYER_COPY[key].title}</span>
								<span style={{ color: visibleLayers[key] ? '#16a34a' : '#94a3b8' }}>
									{visibleLayers[key] ? 'visible' : 'hidden'}
								</span>
							</h4>
							<p style={{ margin: 0, fontSize: 13, color: '#475569' }}>{LAYER_COPY[key].description}</p>
						</article>
					))}
				</div>
				<div style={{ padding: 16, background: '#e0f2fe', borderRadius: 8, fontSize: 14 }}>
					<strong>Tip:</strong> These components reuse the same Mapbox GL source IDs as the vanilla demo. State changes
					propagate to the map instantly without any manual source management code.
				</div>
			</section>
		</div>
	);
}