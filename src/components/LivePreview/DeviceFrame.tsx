import React from 'react';

type DeviceFrameType = 'none' | 'iphone-14-pro' | 'iphone-14' | 'iphone-se' | 'android' | 'ipad';

interface DeviceFrameProps {
  type: DeviceFrameType;
  children: React.ReactNode;
  width: number;
  height: number;
}

const FRAME_CONFIGS: Record<string, {
  borderRadius: number;
  bezel: number;
  notch?: 'dynamic-island' | 'notch' | 'none';
  homeIndicator?: boolean;
}> = {
  'iphone-14-pro': { borderRadius: 47, bezel: 12, notch: 'dynamic-island', homeIndicator: true },
  'iphone-14': { borderRadius: 47, bezel: 12, notch: 'notch', homeIndicator: true },
  'iphone-se': { borderRadius: 20, bezel: 12, notch: 'none', homeIndicator: false },
  'android': { borderRadius: 20, bezel: 8, notch: 'none', homeIndicator: false },
  'ipad': { borderRadius: 18, bezel: 14, notch: 'none', homeIndicator: true },
};

export function DeviceFrame({ type, children, width, height }: DeviceFrameProps) {
  if (type === 'none') return <>{children}</>;

  const config = FRAME_CONFIGS[type] || FRAME_CONFIGS['iphone-14-pro'];
  const b = config.bezel;

  return (
    <div style={{
      position: 'relative',
      width: width + b * 2,
      height: height + b * 2,
      borderRadius: config.borderRadius + b,
      border: `${b}px solid #1a1a1a`,
      background: '#000',
      boxShadow: '0 0 0 2px #333, 0 20px 60px rgba(0,0,0,0.5)',
      overflow: 'hidden',
    }}>
      {/* Notch / Dynamic Island */}
      {config.notch === 'dynamic-island' && (
        <div style={{
          position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
          width: 120, height: 34, borderRadius: 20,
          background: '#000', zIndex: 10,
        }} />
      )}
      {config.notch === 'notch' && (
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 160, height: 30, borderRadius: '0 0 20px 20px',
          background: '#000', zIndex: 10,
        }} />
      )}

      {/* Content */}
      <div style={{ width, height, overflow: 'hidden' }}>
        {children}
      </div>

      {/* Home Indicator */}
      {config.homeIndicator && (
        <div style={{
          position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
          width: 134, height: 5, borderRadius: 3,
          background: 'rgba(255,255,255,0.3)', zIndex: 10,
        }} />
      )}
    </div>
  );
}
