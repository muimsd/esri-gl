import React from 'react';
import type { CSSProperties } from 'react';

const OVERLAY_STYLE: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(255,255,255,0.6)',
  zIndex: 10,
  pointerEvents: 'none',
};

const SPINNER_STYLE: CSSProperties = {
  width: 36,
  height: 36,
  border: '3px solid #e5e7eb',
  borderTopColor: '#2563eb',
  borderRadius: '50%',
  animation: 'esri-gl-spin 0.8s linear infinite',
};

const LABEL_STYLE: CSSProperties = {
  marginTop: 10,
  fontSize: 13,
  color: '#4b5563',
};

/** Translucent overlay with a CSS spinner shown while feature data is loading. */
export const MapLoader: React.FC<{ message?: string }> = ({ message }) => (
  <>
    {/* Inject keyframes once – harmless if duplicated */}
    <style>{`@keyframes esri-gl-spin { to { transform: rotate(360deg); } }`}</style>
    <div style={OVERLAY_STYLE}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={SPINNER_STYLE} />
        {message && <div style={LABEL_STYLE}>{message}</div>}
      </div>
    </div>
  </>
);
