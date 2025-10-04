import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
	useDynamicMapService,
	useImageService,
	useTiledMapService,
} from 'esri-gl/react';
import type { Map as EsriMap } from 'esri-gl';

type ActiveService = 'dynamic' | 'tiled' | 'image';

const SERVICE_OPTIONS = {
	dynamic: {
		url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
		layers: [0, 1, 2],
		transparent: true,
	},
	tiled: {
		url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
	},
	image: {
		url: 'https://elevation3d.arcgisonline.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer',
		format: 'jpgpng',
	},
} satisfies {
	dynamic: Parameters<typeof useDynamicMapService>[0]['options'];
	tiled: Parameters<typeof useTiledMapService>[0]['options'];
	image: Parameters<typeof useImageService>[0]['options'];
};

const LAYER_CONFIG: Record<ActiveService, { layerId: string; sourceId: string }> = {
	dynamic: { layerId: 'hooks-dynamic-layer', sourceId: 'hooks-dynamic' },
	tiled: { layerId: 'hooks-tiled-layer', sourceId: 'hooks-tiled' },
	image: { layerId: 'hooks-image-layer', sourceId: 'hooks-image' },
};

const SERVICE_LABEL: Record<ActiveService, string> = {
	dynamic: 'Dynamic Map Service',
	tiled: 'Tiled Map Service',
	image: 'Image Service',
};

export default function HooksExample() {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [map, setMap] = useState<maplibregl.Map | null>(null);
	const [activeService, setActiveService] = useState<ActiveService>('dynamic');
	const [isSwitching, setIsSwitching] = useState(false);

	useEffect(() => {
		if (map || !containerRef.current) {
			return;
		}

		const mapInstance = new maplibregl.Map({
			container: containerRef.current,
			style: {
				version: 8,
				sources: {
					baseline: {
						type: 'raster',
						tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
						tileSize: 256,
						attribution: '© OpenStreetMap contributors',
					},
				},
				layers: [
					{
						id: 'baseline',
						type: 'raster',
						source: 'baseline',
					},
				],
			},
			center: [-95.7129, 37.0902],
			zoom: 4,
		});

		const resize = () => mapInstance.resize();
		mapInstance.on('load', () => {
			setMap(mapInstance);
			resize();
		});
		window.addEventListener('resize', resize);

		return () => {
			window.removeEventListener('resize', resize);
			mapInstance.remove();
			setMap(null);
		};
	}, [map]);

	const typedMap = map as unknown as EsriMap | null;

	const dynamicResult = useDynamicMapService({
		sourceId: LAYER_CONFIG.dynamic.sourceId,
		map: activeService === 'dynamic' && typedMap ? typedMap : null,
		options: SERVICE_OPTIONS.dynamic,
	});

	const tiledResult = useTiledMapService({
		sourceId: LAYER_CONFIG.tiled.sourceId,
		map: activeService === 'tiled' && typedMap ? typedMap : null,
		options: SERVICE_OPTIONS.tiled,
	});

	const imageResult = useImageService({
		sourceId: LAYER_CONFIG.image.sourceId,
		map: activeService === 'image' && typedMap ? typedMap : null,
		options: SERVICE_OPTIONS.image,
	});

	const serviceState = useMemo(() => ({
		dynamic: dynamicResult,
		tiled: tiledResult,
		image: imageResult,
	}), [dynamicResult, tiledResult, imageResult]);

	useEffect(() => {
		if (!map) {
			return;
		}

		const { layerId, sourceId } = LAYER_CONFIG[activeService];
		const allLayerIds = Object.values(LAYER_CONFIG).map(config => config.layerId);

		allLayerIds.forEach(id => {
			if (map.getLayer(id)) {
				map.removeLayer(id);
			}
		});

		const activeServiceState = serviceState[activeService];
		if (!activeServiceState.service || !map.getSource(sourceId)) {
			return;
		}

		map.addLayer({
			id: layerId,
			type: 'raster',
			source: sourceId,
		});

		return () => {
			allLayerIds.forEach(id => {
				if (map.getLayer(id)) {
					map.removeLayer(id);
				}
			});
		};
	}, [map, activeService, serviceState]);

	const { loading, error, service } = serviceState[activeService];

	return (
		<div className="example-section">
			<h2>React Hooks Example</h2>
			<p>
				This sample mirrors the in-repo demos and showcases how the esri-gl React hooks handle
				service lifecycles. Toggle between different service types to see sources and layers swap
				cleanly on the same MapLibre map instance.
			</p>

			<div className="controls">
				{(Object.keys(LAYER_CONFIG) as ActiveService[]).map(key => (
					<button
						key={key}
						onClick={() => {
							if (isSwitching || activeService === key) {
								return;
							}
							setIsSwitching(true);
							setActiveService(key);
							setTimeout(() => setIsSwitching(false), 350);
						}}
						disabled={isSwitching}
						style={{
							background: activeService === key ? '#007ACC' : '#f0f0f0',
							color: activeService === key ? '#fff' : '#333',
						}}
					>
						{SERVICE_LABEL[key]}
					</button>
				))}
			</div>

			{loading && <div className="status loading">Loading {SERVICE_LABEL[activeService]}…</div>}
			{error && (
				<div className="status error">
					Failed to load {SERVICE_LABEL[activeService]}: {error.message}
				</div>
			)}
			{!loading && !error && service && (
				<div className="status success">{SERVICE_LABEL[activeService]} ready</div>
			)}

			<div className="map-container" ref={containerRef} />

			<aside style={{ marginTop: 24, fontSize: 14, color: '#475569' }}>
				<h4 style={{ marginBottom: 8 }}>Runtime snapshot</h4>
				<ul>
					<li>
						<strong>Map status:</strong> {map ? 'Initialised' : 'Starting up'}
					</li>
					<li>
						<strong>Active service:</strong> {SERVICE_LABEL[activeService]}
					</li>
					<li>
						<strong>Source in map:</strong> {map?.getSource(LAYER_CONFIG[activeService].sourceId) ? 'yes' : 'no'}
					</li>
					<li>
						<strong>Layer in map:</strong> {map?.getLayer(LAYER_CONFIG[activeService].layerId) ? 'yes' : 'no'}
					</li>
				</ul>
			</aside>
		</div>
	);
}