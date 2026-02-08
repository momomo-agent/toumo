/**
 * DeviceFrameShell — 设备框渲染组件
 */
import React from 'react';
import type { DeviceFrame } from './data';

export function DeviceFrameShell({ device, landscape, children }: {
  device: DeviceFrame;
  landscape?: boolean;
  children: React.ReactNode;
}) {
  const isDesktop = device.category === 'desktop';
  const bezel = isDesktop ? 0 : 12;
  const w = landscape ? device.height : device.width;
  const h = landscape ? device.width : device.height;

  if (isDesktop) {
    return (
      <div style={{
        width: w, height: h,
        background: '#050506',
        border: '2px solid rgba(255,255,255,0.12)',
        borderRadius: 8,
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}>
        {children}
      </div>
    );
  }

  return (
    <div style={{
      width: w + bezel * 2,
      height: h + bezel * 2,
      borderRadius: device.radius + bezel,
      background: '#1a1a1a',
      border: '2px solid rgba(255,255,255,0.12)',
      padding: bezel,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        width: w, height: h,
        borderRadius: device.radius,
        background: '#050506',
        position: 'relative', overflow: 'hidden',
      }}>
        {!landscape && device.notch === 'island' && (
          <div style={{
            position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
            width: 120, height: 36, borderRadius: 18, background: '#000', zIndex: 100,
          }} />
        )}
        {!landscape && device.notch === 'notch' && (
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: 160, height: 34, borderRadius: '0 0 20px 20px', background: '#000', zIndex: 100,
          }} />
        )}
        {!landscape && device.notch === 'punch' && (
          <div style={{
            position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
            width: 12, height: 12, borderRadius: '50%', background: '#000', zIndex: 100,
          }} />
        )}
        {children}
      </div>
    </div>
  );
}
