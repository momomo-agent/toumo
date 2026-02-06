import React, { useState, useCallback } from 'react';
import { useEditorStore } from '../../store';
import type { KeyElement, ShapeStyle, ShapeType } from '../../types';
import './styles.css';

// 生成唯一 ID
const generateId = () => `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 组件分类
type ComponentCategory = 'basic' | 'form' | 'navigation' | 'feedback';

// 预置组件元素数据
interface PresetElementData {
  name: string;
  shapeType: ShapeType;
  size: { width: number; height: number };
  position?: { x: number; y: number };
  style: ShapeStyle;
  text?: string;
}

// 预置组件定义
interface PresetComponent {
  id: string;
  name: string;
  category: ComponentCategory;
  icon: string;
  description: string;
  // 生成元素的工厂函数
  createElements: () => PresetElementData[];
}

// 根据 ID 查找预置组件
export const findPresetComponent = (id: string): PresetComponent | undefined =>
  PRESET_COMPONENTS.find((c) => c.id === id);

// 创建完整的 KeyElement
export const createKeyElement = (data: PresetElementData, position: { x: number; y: number }): KeyElement => ({
  id: generateId(),
  name: data.name,
  category: 'content',
  isKeyElement: true,
  attributes: [],
  position,
  size: data.size,
  shapeType: data.shapeType,
  style: data.style,
  text: data.text,
});

// 组件分类配置
const CATEGORIES: { id: ComponentCategory; name: string; icon: string }[] = [
  { id: 'basic', name: '基础', icon: '⬜' },
  { id: 'form', name: '表单', icon: '📝' },
  { id: 'navigation', name: '导航', icon: '🧭' },
  { id: 'feedback', name: '反馈', icon: '💬' },
];

// 预置组件列表
const PRESET_COMPONENTS: PresetComponent[] = [
  // 基础组件
  {
    id: 'button-primary',
    name: 'Primary Button',
    category: 'basic',
    icon: '🔵',
    description: '主要操作按钮',
    createElements: () => [{
      name: 'Primary Button',
      shapeType: 'rectangle',
      size: { width: 120, height: 44 },
      style: {
        fill: '#3b82f6',
        fillOpacity: 1,
        stroke: '',
        strokeWidth: 0,
        strokeOpacity: 1,
        borderRadius: 8,
        cursor: 'pointer',
      } as ShapeStyle,
      text: 'Button',
    }],
  },
  {
    id: 'button-secondary',
    name: 'Secondary Button',
    category: 'basic',
    icon: '⚪',
    description: '次要操作按钮',
    createElements: () => [{
      name: 'Secondary Button',
      shapeType: 'rectangle',
      size: { width: 120, height: 44 },
      style: {
        fill: 'transparent',
        fillOpacity: 1,
        stroke: '#3b82f6',
        strokeWidth: 2,
        strokeOpacity: 1,
        borderRadius: 8,
        cursor: 'pointer',
      } as ShapeStyle,
      text: 'Button',
    }],
  },
  {
    id: 'button-ghost',
    name: 'Ghost Button',
    category: 'basic',
    icon: '👻',
    description: '幽灵按钮',
    createElements: () => [{
      name: 'Ghost Button',
      shapeType: 'rectangle',
      size: { width: 120, height: 44 },
      style: {
        fill: 'transparent',
        fillOpacity: 1,
        stroke: '',
        strokeWidth: 0,
        strokeOpacity: 1,
        borderRadius: 8,
        cursor: 'pointer',
        color: '#3b82f6',
      } as ShapeStyle,
      text: 'Button',
    }],
  },
  {
    id: 'card',
    name: 'Card',
    category: 'basic',
    icon: '🃏',
    description: '卡片容器',
    createElements: () => [{
      name: 'Card',
      shapeType: 'rectangle',
      size: { width: 300, height: 180 },
      style: {
        fill: '#1a1a1a',
        fillOpacity: 1,
        stroke: '#333333',
        strokeWidth: 1,
        strokeOpacity: 1,
        borderRadius: 12,
        shadowColor: '#000000',
        shadowOffsetX: 0,
        shadowOffsetY: 4,
        shadowBlur: 12,
      } as ShapeStyle,
    }],
  },
  // 表单组件
  {
    id: 'input',
    name: 'Input',
    category: 'form',
    icon: '📝',
    description: '文本输入框',
    createElements: () => [{
      name: 'Input',
      shapeType: 'rectangle',
      size: { width: 280, height: 44 },
      style: {
        fill: '#0a0a0a',
        fillOpacity: 1,
        stroke: '#333333',
        strokeWidth: 1,
        strokeOpacity: 1,
        borderRadius: 8,
      } as ShapeStyle,
      text: 'Placeholder...',
    }],
  },
  {
    id: 'switch-on',
    name: 'Switch (On)',
    category: 'form',
    icon: '🟢',
    description: '开关 - 开启状态',
    createElements: () => [
      {
        name: 'Switch Track',
        shapeType: 'rectangle',
        size: { width: 51, height: 31 },
        position: { x: 0, y: 0 },
        style: {
          fill: '#34c759',
          fillOpacity: 1,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 16,
        } as ShapeStyle,
      },
      {
        name: 'Switch Thumb',
        shapeType: 'ellipse',
        size: { width: 27, height: 27 },
        position: { x: 22, y: 2 },
        style: {
          fill: '#ffffff',
          fillOpacity: 1,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 14,
          shadowColor: '#00000040',
          shadowOffsetX: 0,
          shadowOffsetY: 2,
          shadowBlur: 4,
        } as ShapeStyle,
      },
    ],
  },
  {
    id: 'switch-off',
    name: 'Switch (Off)',
    category: 'form',
    icon: '⚫',
    description: '开关 - 关闭状态',
    createElements: () => [
      {
        name: 'Switch Track',
        shapeType: 'rectangle',
        size: { width: 51, height: 31 },
        position: { x: 0, y: 0 },
        style: {
          fill: '#39393d',
          fillOpacity: 1,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 16,
        } as ShapeStyle,
      },
      {
        name: 'Switch Thumb',
        shapeType: 'ellipse',
        size: { width: 27, height: 27 },
        position: { x: 2, y: 2 },
        style: {
          fill: '#ffffff',
          fillOpacity: 1,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 14,
          shadowColor: '#00000040',
          shadowOffsetX: 0,
          shadowOffsetY: 2,
          shadowBlur: 4,
        } as ShapeStyle,
      },
    ],
  },
  // 导航组件
  {
    id: 'tab-bar',
    name: 'Tab Bar',
    category: 'navigation',
    icon: '📑',
    description: 'iOS 风格底部标签栏',
    createElements: () => [
      {
        name: 'Tab Bar Background',
        shapeType: 'rectangle',
        size: { width: 390, height: 83 },
        position: { x: 0, y: 0 },
        style: {
          fill: '#1c1c1e',
          fillOpacity: 0.95,
          stroke: '#38383a',
          strokeWidth: 0.5,
          strokeOpacity: 1,
          borderRadius: 0,
          backdropBlur: 20,
        } as ShapeStyle,
      },
      {
        name: 'Tab 1',
        shapeType: 'text',
        size: { width: 78, height: 49 },
        position: { x: 0, y: 8 },
        text: '🏠\nHome',
        style: {
          fill: 'transparent',
          fillOpacity: 1,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 0,
          color: '#0a84ff',
          fontSize: 10,
          textAlign: 'center',
        } as ShapeStyle,
      },
      {
        name: 'Tab 2',
        shapeType: 'text',
        size: { width: 78, height: 49 },
        position: { x: 78, y: 8 },
        text: '🔍\nSearch',
        style: {
          fill: 'transparent',
          fillOpacity: 1,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 0,
          color: '#8e8e93',
          fontSize: 10,
          textAlign: 'center',
        } as ShapeStyle,
      },
      {
        name: 'Tab 3',
        shapeType: 'text',
        size: { width: 78, height: 49 },
        position: { x: 156, y: 8 },
        text: '➕\nAdd',
        style: {
          fill: 'transparent',
          fillOpacity: 1,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 0,
          color: '#8e8e93',
          fontSize: 10,
          textAlign: 'center',
        } as ShapeStyle,
      },
      {
        name: 'Tab 4',
        shapeType: 'text',
        size: { width: 78, height: 49 },
        position: { x: 234, y: 8 },
        text: '💬\nChat',
        style: {
          fill: 'transparent',
          fillOpacity: 1,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 0,
          color: '#8e8e93',
          fontSize: 10,
          textAlign: 'center',
        } as ShapeStyle,
      },
      {
        name: 'Tab 5',
        shapeType: 'text',
        size: { width: 78, height: 49 },
        position: { x: 312, y: 8 },
        text: '👤\nProfile',
        style: {
          fill: 'transparent',
          fillOpacity: 1,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 0,
          color: '#8e8e93',
          fontSize: 10,
          textAlign: 'center',
        } as ShapeStyle,
      },
      {
        name: 'Home Indicator',
        shapeType: 'rectangle',
        size: { width: 134, height: 5 },
        position: { x: 128, y: 70 },
        style: {
          fill: '#ffffff',
          fillOpacity: 1,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 3,
        } as ShapeStyle,
      },
    ],
  },
  {
    id: 'nav-bar',
    name: 'Navigation Bar',
    category: 'navigation',
    icon: '🔝',
    description: 'iOS 风格顶部导航栏',
    createElements: () => [
      {
        name: 'Nav Bar Background',
        shapeType: 'rectangle',
        size: { width: 390, height: 91 },
        position: { x: 0, y: 0 },
        style: {
          fill: '#1c1c1e',
          fillOpacity: 0.95,
          stroke: '#38383a',
          strokeWidth: 0.5,
          strokeOpacity: 1,
          borderRadius: 0,
          backdropBlur: 20,
        } as ShapeStyle,
      },
      {
        name: 'Back Button',
        shapeType: 'text',
        size: { width: 60, height: 44 },
        position: { x: 8, y: 47 },
        text: '‹ Back',
        style: {
          fill: 'transparent',
          fillOpacity: 1,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 0,
          color: '#0a84ff',
          fontSize: 17,
        } as ShapeStyle,
      },
      {
        name: 'Title',
        shapeType: 'text',
        size: { width: 200, height: 44 },
        position: { x: 95, y: 47 },
        text: 'Title',
        style: {
          fill: 'transparent',
          fillOpacity: 1,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 0,
          color: '#ffffff',
          fontSize: 17,
          fontWeight: '600',
          textAlign: 'center',
        } as ShapeStyle,
      },
    ],
  },
  // 反馈组件
  {
    id: 'modal',
    name: 'Modal',
    category: 'feedback',
    icon: '📦',
    description: '模态弹窗',
    createElements: () => [
      {
        name: 'Modal Backdrop',
        shapeType: 'rectangle',
        size: { width: 390, height: 844 },
        position: { x: 0, y: 0 },
        style: {
          fill: '#000000',
          fillOpacity: 0.5,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 0,
        } as ShapeStyle,
      },
      {
        name: 'Modal Content',
        shapeType: 'rectangle',
        size: { width: 300, height: 200 },
        position: { x: 45, y: 322 },
        style: {
          fill: '#2c2c2e',
          fillOpacity: 1,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 14,
        } as ShapeStyle,
      },
      {
        name: 'Modal Title',
        shapeType: 'text',
        size: { width: 260, height: 30 },
        position: { x: 65, y: 342 },
        text: 'Modal Title',
        style: {
          fill: 'transparent',
          fillOpacity: 1,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 0,
          color: '#ffffff',
          fontSize: 17,
          fontWeight: '600',
          textAlign: 'center',
        } as ShapeStyle,
      },
      {
        name: 'Modal Message',
        shapeType: 'text',
        size: { width: 260, height: 60 },
        position: { x: 65, y: 380 },
        text: 'This is a modal message that provides information to the user.',
        style: {
          fill: 'transparent',
          fillOpacity: 1,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 0,
          color: '#8e8e93',
          fontSize: 13,
          textAlign: 'center',
        } as ShapeStyle,
      },
      {
        name: 'Modal Button',
        shapeType: 'rectangle',
        size: { width: 260, height: 44 },
        position: { x: 65, y: 458 },
        text: 'OK',
        style: {
          fill: '#0a84ff',
          fillOpacity: 1,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 10,
          color: '#ffffff',
          fontSize: 17,
          fontWeight: '600',
          textAlign: 'center',
        } as ShapeStyle,
      },
    ],
  },
  {
    id: 'alert',
    name: 'Alert',
    category: 'feedback',
    icon: '⚠️',
    description: 'iOS 风格警告弹窗',
    createElements: () => [
      {
        name: 'Alert Background',
        shapeType: 'rectangle',
        size: { width: 270, height: 140 },
        position: { x: 0, y: 0 },
        style: {
          fill: '#2c2c2e',
          fillOpacity: 0.95,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 14,
          backdropBlur: 20,
        } as ShapeStyle,
      },
      {
        name: 'Alert Title',
        shapeType: 'text',
        size: { width: 230, height: 24 },
        position: { x: 20, y: 20 },
        text: 'Alert Title',
        style: {
          fill: 'transparent',
          fillOpacity: 1,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 0,
          color: '#ffffff',
          fontSize: 17,
          fontWeight: '600',
          textAlign: 'center',
        } as ShapeStyle,
      },
      {
        name: 'Alert Message',
        shapeType: 'text',
        size: { width: 230, height: 40 },
        position: { x: 20, y: 48 },
        text: 'This is an alert message.',
        style: {
          fill: 'transparent',
          fillOpacity: 1,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 0,
          color: '#8e8e93',
          fontSize: 13,
          textAlign: 'center',
        } as ShapeStyle,
      },
      {
        name: 'Alert Divider',
        shapeType: 'rectangle',
        size: { width: 270, height: 0.5 },
        position: { x: 0, y: 95 },
        style: {
          fill: '#545458',
          fillOpacity: 0.65,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 0,
        } as ShapeStyle,
      },
      {
        name: 'Alert Button',
        shapeType: 'text',
        size: { width: 270, height: 44 },
        position: { x: 0, y: 96 },
        text: 'OK',
        style: {
          fill: 'transparent',
          fillOpacity: 1,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 0,
          color: '#0a84ff',
          fontSize: 17,
          fontWeight: '600',
          textAlign: 'center',
        } as ShapeStyle,
      },
    ],
  },
  {
    id: 'toast',
    name: 'Toast',
    category: 'feedback',
    icon: '🍞',
    description: '轻提示',
    createElements: () => [{
      name: 'Toast',
      shapeType: 'rectangle',
      size: { width: 200, height: 44 },
      style: {
        fill: '#2c2c2e',
        fillOpacity: 0.95,
        stroke: '',
        strokeWidth: 0,
        strokeOpacity: 1,
        borderRadius: 22,
        backdropBlur: 20,
        color: '#ffffff',
        fontSize: 15,
        textAlign: 'center',
      } as ShapeStyle,
      text: 'Toast message',
    }],
  },
  // 基础 - 分割线
  {
    id: 'divider',
    name: 'Divider',
    category: 'basic',
    icon: '➖',
    description: '分割线',
    createElements: () => [{
      name: 'Divider',
      shapeType: 'rectangle',
      size: { width: 350, height: 1 },
      style: {
        fill: '#38383a',
        fillOpacity: 0.65,
        stroke: '',
        strokeWidth: 0,
        strokeOpacity: 1,
        borderRadius: 0,
      } as ShapeStyle,
    }],
  },
  // 基础 - 头像
  {
    id: 'avatar',
    name: 'Avatar',
    category: 'basic',
    icon: '👤',
    description: '圆形头像占位',
    createElements: () => [{
      name: 'Avatar',
      shapeType: 'ellipse',
      size: { width: 48, height: 48 },
      style: {
        fill: '#3b82f6',
        fillOpacity: 1,
        stroke: '',
        strokeWidth: 0,
        strokeOpacity: 1,
        borderRadius: 24,
        color: '#ffffff',
        fontSize: 18,
        textAlign: 'center',
      } as ShapeStyle,
      text: 'A',
    }],
  },
  // 基础 - 徽标
  {
    id: 'badge',
    name: 'Badge',
    category: 'basic',
    icon: '🔴',
    description: '数字徽标',
    createElements: () => [{
      name: 'Badge',
      shapeType: 'ellipse',
      size: { width: 22, height: 22 },
      style: {
        fill: '#ef4444',
        fillOpacity: 1,
        stroke: '',
        strokeWidth: 0,
        strokeOpacity: 1,
        borderRadius: 11,
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
      } as ShapeStyle,
      text: '3',
    }],
  },
  // 表单 - 搜索栏
  {
    id: 'search-bar',
    name: 'Search Bar',
    category: 'form',
    icon: '🔍',
    description: 'iOS 风格搜索栏',
    createElements: () => [{
      name: 'Search Bar',
      shapeType: 'rectangle',
      size: { width: 358, height: 36 },
      style: {
        fill: '#1c1c1e',
        fillOpacity: 1,
        stroke: '',
        strokeWidth: 0,
        strokeOpacity: 1,
        borderRadius: 10,
        color: '#8e8e93',
        fontSize: 15,
        textAlign: 'center',
      } as ShapeStyle,
      text: '🔍 Search',
    }],
  },
  // 表单 - 复选框
  {
    id: 'checkbox',
    name: 'Checkbox',
    category: 'form',
    icon: '☑️',
    description: '复选框',
    createElements: () => [
      {
        name: 'Checkbox Box',
        shapeType: 'rectangle',
        size: { width: 22, height: 22 },
        position: { x: 0, y: 0 },
        style: {
          fill: '#3b82f6',
          fillOpacity: 1,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 6,
        } as ShapeStyle,
        text: '✓',
      },
      {
        name: 'Checkbox Label',
        shapeType: 'text',
        size: { width: 100, height: 22 },
        position: { x: 30, y: 0 },
        text: 'Option',
        style: {
          fill: 'transparent',
          fillOpacity: 1,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 0,
          color: '#ffffff',
          fontSize: 15,
        } as ShapeStyle,
      },
    ],
  },
  // 导航 - 列表项
  {
    id: 'list-item',
    name: 'List Item',
    category: 'navigation',
    icon: '📋',
    description: 'iOS 风格列表项',
    createElements: () => [
      {
        name: 'List Item BG',
        shapeType: 'rectangle',
        size: { width: 390, height: 44 },
        position: { x: 0, y: 0 },
        style: {
          fill: '#1c1c1e',
          fillOpacity: 1,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 0,
        } as ShapeStyle,
      },
      {
        name: 'List Item Label',
        shapeType: 'text',
        size: { width: 300, height: 44 },
        position: { x: 16, y: 0 },
        text: 'Settings',
        style: {
          fill: 'transparent',
          fillOpacity: 1,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 0,
          color: '#ffffff',
          fontSize: 17,
        } as ShapeStyle,
      },
      {
        name: 'List Item Arrow',
        shapeType: 'text',
        size: { width: 20, height: 44 },
        position: { x: 360, y: 0 },
        text: '›',
        style: {
          fill: 'transparent',
          fillOpacity: 1,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 0,
          color: '#48484a',
          fontSize: 22,
          textAlign: 'center',
        } as ShapeStyle,
      },
      {
        name: 'List Item Divider',
        shapeType: 'rectangle',
        size: { width: 374, height: 0.5 },
        position: { x: 16, y: 43.5 },
        style: {
          fill: '#38383a',
          fillOpacity: 0.6,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 0,
        } as ShapeStyle,
      },
    ],
  },
  // 导航 - Status Bar
  {
    id: 'status-bar',
    name: 'Status Bar',
    category: 'navigation',
    icon: '📶',
    description: 'iOS 状态栏',
    createElements: () => [
      {
        name: 'Status Bar BG',
        shapeType: 'rectangle',
        size: { width: 390, height: 47 },
        position: { x: 0, y: 0 },
        style: {
          fill: '#000000',
          fillOpacity: 0,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 0,
        } as ShapeStyle,
      },
      {
        name: 'Time',
        shapeType: 'text',
        size: { width: 54, height: 21 },
        position: { x: 32, y: 15 },
        text: '9:41',
        style: {
          fill: 'transparent',
          fillOpacity: 1,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 0,
          color: '#ffffff',
          fontSize: 15,
          fontWeight: '600',
        } as ShapeStyle,
      },
      {
        name: 'Icons',
        shapeType: 'text',
        size: { width: 70, height: 21 },
        position: { x: 300, y: 15 },
        text: '📶 🔋',
        style: {
          fill: 'transparent',
          fillOpacity: 1,
          stroke: '',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: 0,
          color: '#ffffff',
          fontSize: 12,
          textAlign: 'right',
        } as ShapeStyle,
      },
    ],
  },
];

export const ComponentLibrary: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedComponent, setDraggedComponent] = useState<PresetComponent | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { addElement, selectedKeyframeId, frameSize } = useEditorStore();

  // 过滤组件
  const filteredComponents = PRESET_COMPONENTS.filter((comp) => {
    const matchesCategory = selectedCategory === 'all' || comp.category === selectedCategory;
    const matchesSearch = comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // 处理拖拽开始
  const handleDragStart = useCallback((e: React.DragEvent, component: PresetComponent) => {
    setDraggedComponent(component);
    // Use a custom MIME type that Canvas recognizes
    e.dataTransfer.setData('application/toumo-library-component', component.id);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  // 处理拖拽结束
  const handleDragEnd = useCallback(() => {
    setDraggedComponent(null);
  }, []);

  // 处理点击添加组件
  const handleAddComponent = useCallback((component: PresetComponent) => {
    if (!selectedKeyframeId) return;

    const elementsData = component.createElements();
    const centerX = frameSize.width / 2;
    const centerY = frameSize.height / 2;

    // 计算组件边界框
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    elementsData.forEach((el) => {
      const pos = el.position || { x: 0, y: 0 };
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + el.size.width);
      maxY = Math.max(maxY, pos.y + el.size.height);
    });
    const totalWidth = maxX - minX;
    const totalHeight = maxY - minY;

    elementsData.forEach((elementData) => {
      const basePosition = elementData.position || { x: 0, y: 0 };

      // 计算居中位置
      const offsetX = centerX - totalWidth / 2 + (basePosition.x - minX);
      const offsetY = centerY - totalHeight / 2 + (basePosition.y - minY);

      const keyElement = createKeyElement(elementData, { x: offsetX, y: offsetY });
      addElement(keyElement);
    });
  }, [selectedKeyframeId, frameSize, addElement]);

  if (isCollapsed) {
    return (
      <div className="component-library collapsed">
        <button
          className="collapse-toggle"
          onClick={() => setIsCollapsed(false)}
          title="展开组件库"
        >
          📦
        </button>
      </div>
    );
  }

  return (
    <div className="component-library">
      <div className="library-header">
        <h3>组件库</h3>
        <button
          className="collapse-toggle"
          onClick={() => setIsCollapsed(true)}
          title="收起组件库"
        >
          ‹
        </button>
      </div>

      {/* 搜索框 */}
      <div className="library-search">
        <input
          type="text"
          placeholder="搜索组件..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 分类标签 */}
      <div className="library-categories">
        <button
          className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          全部
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* 组件列表 */}
      <div className="library-components">
        {filteredComponents.map((component) => (
          <div
            key={component.id}
            className={`component-item ${draggedComponent?.id === component.id ? 'dragging' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, component)}
            onDragEnd={handleDragEnd}
            onClick={() => handleAddComponent(component)}
            title={component.description}
          >
            <div className="component-preview">
              <ComponentPreview component={component} />
            </div>
            <div className="component-info">
              <span className="component-name">{component.name}</span>
              <span className="component-desc">{component.description}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredComponents.length === 0 && (
        <div className="library-empty">
          没有找到匹配的组件
        </div>
      )}
    </div>
  );
};

// 构建渐变 CSS
const buildGradientBg = (style: ShapeStyle): string | undefined => {
  if (!style.gradientType || style.gradientType === 'none' || !style.gradientStops?.length) return undefined;
  const stops = style.gradientStops.map((s) => `${s.color} ${s.position}%`).join(', ');
  if (style.gradientType === 'radial') return `radial-gradient(circle, ${stops})`;
  return `linear-gradient(${style.gradientAngle ?? 180}deg, ${stops})`;
};

// 组件缩略图预览
const ComponentPreview: React.FC<{ component: PresetComponent }> = ({ component }) => {
  const elements = component.createElements();

  // 计算边界框
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  elements.forEach((el) => {
    const pos = el.position || { x: 0, y: 0 };
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x + el.size.width);
    maxY = Math.max(maxY, pos.y + el.size.height);
  });

  const width = maxX - minX;
  const height = maxY - minY;

  // 自适应缩放：适配 48×36 预览区域
  const maxW = 48;
  const maxH = 36;
  const scale = Math.min(maxW / width, maxH / height, 0.4);

  return (
    <div
      className="preview-container"
      style={{
        width: width * scale,
        height: height * scale,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {elements.map((el, index) => {
        const pos = el.position || { x: 0, y: 0 };
        const style = el.style || {} as ShapeStyle;
        const gradient = buildGradientBg(style);
        const isText = el.shapeType === 'text';
        const isEllipse = el.shapeType === 'ellipse';

        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: (pos.x - minX) * scale,
              top: (pos.y - minY) * scale,
              width: el.size.width * scale,
              height: el.size.height * scale,
              backgroundColor: gradient ? undefined : (style.fill || '#3b82f6'),
              background: gradient || undefined,
              opacity: style.fillOpacity ?? 1,
              borderRadius: isEllipse ? '50%' : (style.borderRadius || 0) * scale,
              border: style.strokeWidth
                ? `${Math.max(0.5, style.strokeWidth * scale)}px solid ${style.stroke}`
                : 'none',
              boxShadow: style.shadowBlur
                ? `${(style.shadowOffsetX || 0) * scale}px ${(style.shadowOffsetY || 0) * scale}px ${style.shadowBlur * scale}px ${style.shadowColor || '#00000040'}`
                : undefined,
              // 文字渲染
              ...(el.text ? {
                display: 'flex',
                alignItems: 'center',
                justifyContent: (style.textAlign as string) === 'center' ? 'center' : 'flex-start',
                color: style.color || '#fff',
                fontSize: Math.max(4, (style.fontSize || 14) * scale),
                fontWeight: style.fontWeight as any,
                lineHeight: 1.2,
                overflow: 'hidden',
                whiteSpace: 'nowrap' as const,
                paddingLeft: isText ? 0 : 2,
              } : {}),
            }}
          >
            {el.text ? el.text.split('\n')[0] : null}
          </div>
        );
      })}
    </div>
  );
};

export default ComponentLibrary;
