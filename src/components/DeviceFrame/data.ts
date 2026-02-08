/**
 * DeviceFrame — 设备框数据
 */

export type DeviceCategory = 'none' | 'iphone' | 'android' | 'ipad' | 'desktop';

export interface DeviceFrame {
  id: string;
  label: string;
  width: number;
  height: number;
  radius: number;
  notch: 'none' | 'island' | 'notch' | 'punch';
  category: DeviceCategory;
  icon: string;
}

export const DEVICE_FRAMES: DeviceFrame[] = [
  { id: 'none', label: '无边框', width: 0, height: 0, radius: 0, notch: 'none', category: 'none', icon: '🖼️' },
  { id: 'iphone15pro', label: 'iPhone 15 Pro', width: 393, height: 852, radius: 55, notch: 'island', category: 'iphone', icon: '📱' },
  { id: 'iphone14', label: 'iPhone 14', width: 390, height: 844, radius: 47, notch: 'notch', category: 'iphone', icon: '📱' },
  { id: 'iphonese', label: 'iPhone SE', width: 375, height: 667, radius: 0, notch: 'none', category: 'iphone', icon: '📱' },
  { id: 'pixel7', label: 'Pixel 7', width: 412, height: 915, radius: 28, notch: 'punch', category: 'android', icon: '📱' },
  { id: 'galaxys23', label: 'Galaxy S23', width: 360, height: 780, radius: 24, notch: 'punch', category: 'android', icon: '📱' },
  { id: 'ipadmini', label: 'iPad Mini', width: 744, height: 1133, radius: 18, notch: 'none', category: 'ipad', icon: '📋' },
  { id: 'ipadpro11', label: 'iPad Pro 11"', width: 834, height: 1194, radius: 18, notch: 'none', category: 'ipad', icon: '📋' },
  { id: 'desktop1080', label: 'Desktop 1080p', width: 1920, height: 1080, radius: 0, notch: 'none', category: 'desktop', icon: '🖥️' },
  { id: 'desktop1440', label: 'Desktop 1440p', width: 2560, height: 1440, radius: 0, notch: 'none', category: 'desktop', icon: '🖥️' },
  { id: 'macbook14', label: 'MacBook 14"', width: 1512, height: 982, radius: 0, notch: 'none', category: 'desktop', icon: '💻' },
  { id: 'macbook16', label: 'MacBook 16"', width: 1728, height: 1117, radius: 0, notch: 'none', category: 'desktop', icon: '💻' },
];

export const DEVICE_CATEGORIES: { id: DeviceCategory; label: string; icon: string }[] = [
  { id: 'none', label: '无', icon: '🖼️' },
  { id: 'iphone', label: 'iPhone', icon: '' },
  { id: 'android', label: 'Android', icon: '🤖' },
  { id: 'ipad', label: 'iPad', icon: '📋' },
  { id: 'desktop', label: '桌面', icon: '🖥️' },
];
