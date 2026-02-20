import type { CSSProperties } from 'react';

export const DEMO_CONTAINER_STYLE: CSSProperties = {
  display: 'flex',
  height: '100%',
  width: '100%',
};

export const DEMO_SIDEBAR_STYLE: CSSProperties = {
  width: '280px',
  padding: '14px 16px',
  borderRight: '1px solid #e4e4e7',
  backgroundColor: '#fafafa',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  overflow: 'auto',
};

export const DEMO_SECTION_TITLE_STYLE: CSSProperties = {
  margin: '0 0 4px 0',
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#71717a',
  paddingLeft: '8px',
  borderLeft: '2px solid #059669',
};

export const DEMO_FOOTER_STYLE: CSSProperties = {
  fontSize: '12px',
  color: '#a1a1aa',
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
  fontSize: '12px',
  color: '#71717a',
};

export function createBadgeStyle(dotColor: string, textColor = '#71717a'): CSSProperties {
  return {
    ...DEMO_STATUS_BADGE_STYLE,
    color: textColor,
    paddingLeft: '13px',
    backgroundImage: `radial-gradient(circle 3.5px at 3.5px 50%, ${dotColor} 3.5px, transparent 3.5px)`,
    backgroundRepeat: 'no-repeat',
  };
}
