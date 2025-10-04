import type { CSSProperties } from 'react';

export const DEMO_CONTAINER_STYLE: CSSProperties = {
  display: 'flex',
  height: '100%',
  width: '100%',
};

export const DEMO_SIDEBAR_STYLE: CSSProperties = {
  width: '320px',
  padding: '16px',
  borderRight: '1px solid #e5e7eb',
  backgroundColor: '#f9fafb',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  overflow: 'auto',
};

export const DEMO_SECTION_TITLE_STYLE: CSSProperties = {
  margin: '0 0 6px 0',
  fontSize: '14px',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#6b7280',
};

export const DEMO_FOOTER_STYLE: CSSProperties = {
  fontSize: '12px',
  color: '#9ca3af',
  marginTop: 'auto',
};

export const DEMO_MAP_CONTAINER_STYLE: CSSProperties = {
  flex: 1,
  position: 'relative',
};

export const DEMO_STATUS_BADGE_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 8px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: 600,
  backgroundColor: '#e5e7eb',
  color: '#1f2937',
};

export function createBadgeStyle(background: string, color = '#1f2937'): CSSProperties {
  return {
    ...DEMO_STATUS_BADGE_STYLE,
    backgroundColor: background,
    color,
  };
}
