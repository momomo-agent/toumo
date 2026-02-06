/**
 * Example project data for the onboarding flow.
 * Demonstrates core features:
 *   - 3 keyframes (首页 → 详情页 → 设置页)
 *   - Multiple triggers (tap, hover, mouseEnter)
 *   - Different transitions (smartAnimate, dissolve, push)
 *   - Prototype links with varied easings
 */

const baseStyle = {
  fill: '#3b82f6',
  fillOpacity: 1,
  stroke: '',
  strokeWidth: 0,
  strokeOpacity: 1,
  borderRadius: 8,
};

const darkCard = {
  ...baseStyle,
  fill: '#141414',
  borderRadius: 16,
  stroke: '#1f1f1f',
  strokeWidth: 1,
};

export function createOnboardingProject() {
  return {
    version: '1.0',
    keyframes: [
      createFrame1(),
      createFrame2(),
      createFrame3(),
    ],
    transitions: [
      {
        id: 'onboard-trans-1',
        from: 'onboard-frame-1',
        to: 'onboard-frame-2',
        trigger: 'tap',
        duration: 400,
        delay: 0,
        curve: 'ease-out',
      },
      {
        id: 'onboard-trans-2',
        from: 'onboard-frame-2',
        to: 'onboard-frame-3',
        trigger: 'tap',
        duration: 350,
        delay: 0,
        curve: 'ease-in-out',
      },
      {
        id: 'onboard-trans-3',
        from: 'onboard-frame-2',
        to: 'onboard-frame-1',
        trigger: 'tap',
        duration: 300,
        delay: 0,
        curve: 'ease-out',
      },
      {
        id: 'onboard-trans-4',
        from: 'onboard-frame-3',
        to: 'onboard-frame-1',
        trigger: 'tap',
        duration: 400,
        delay: 0,
        curve: 'spring',
      },
    ],
    functionalStates: [],
    components: [],
    frameSize: { width: 390, height: 844 },
    canvasBackground: '#0a0a0a',
    interactions: [],
    variables: [],
  };
}

// ─── Frame 1: 首页 ───────────────────────────────────────

function createFrame1() {
  return {
    id: 'onboard-frame-1',
    name: '首页',
    summary: '应用首页 — 欢迎卡片 + CTA 按钮 + 底部导航',
    keyElements: [
      // Status bar
      {
        id: 'ob-statusbar', name: '状态栏', category: 'content' as const,
        isKeyElement: true, attributes: [],
        shapeType: 'rectangle' as const,
        position: { x: 0, y: 0 }, size: { width: 390, height: 54 },
        style: { ...baseStyle, fill: '#0a0a0a', borderRadius: 0 },
        zIndex: 20,
      },
      {
        id: 'ob-time', name: '时间', category: 'content' as const,
        isKeyElement: true, attributes: [],
        shapeType: 'text' as const,
        position: { x: 24, y: 16 }, size: { width: 50, height: 22 },
        text: '9:41',
        style: { ...baseStyle, fill: '#fff', fontSize: 15, fontWeight: 600 },
        zIndex: 21,
      },
      // Hero card with gradient
      {
        id: 'ob-hero', name: '主卡片', category: 'content' as const,
        isKeyElement: true, attributes: [],
        shapeType: 'rectangle' as const,
        position: { x: 20, y: 74 }, size: { width: 350, height: 180 },
        style: {
          ...baseStyle, borderRadius: 20,
          gradientType: 'linear' as const, gradientAngle: 135,
          gradientStops: [
            { color: '#3b82f6', position: 0 },
            { color: '#8b5cf6', position: 100 },
          ],
        },
        zIndex: 5,
      },
      {
        id: 'ob-hero-emoji', name: '图标', category: 'content' as const,
        isKeyElement: true, attributes: [],
        shapeType: 'text' as const,
        position: { x: 44, y: 100 }, size: { width: 40, height: 40 },
        text: '✦',
        style: { ...baseStyle, fill: '#fff', fontSize: 32 },
        zIndex: 6,
      },
      {
        id: 'ob-hero-title', name: '标题', category: 'content' as const,
        isKeyElement: true, attributes: [],
        shapeType: 'text' as const,
        position: { x: 44, y: 148 }, size: { width: 300, height: 28 },
        text: '欢迎使用 Toumo',
        style: { ...baseStyle, fill: '#fff', fontSize: 22, fontWeight: 700 },
        zIndex: 6,
      },
      {
        id: 'ob-hero-sub', name: '副标题', category: 'content' as const,
        isKeyElement: true, attributes: [],
        shapeType: 'text' as const,
        position: { x: 44, y: 180 }, size: { width: 300, height: 20 },
        text: '5 分钟创建你的第一个动效',
        style: { ...baseStyle, fill: 'rgba(255,255,255,0.7)', fontSize: 14 },
        zIndex: 6,
      },
      // CTA Button → tap → Frame 2 (smartAnimate)
      {
        id: 'ob-cta', name: 'CTA 按钮', category: 'content' as const,
        isKeyElement: true, attributes: [],
        shapeType: 'rectangle' as const,
        position: { x: 20, y: 280 }, size: { width: 350, height: 52 },
        style: { ...baseStyle, fill: '#22c55e', borderRadius: 14 },
        zIndex: 5,
        prototypeLink: {
          enabled: true,
          targetFrameId: 'onboard-frame-2',
          trigger: 'tap' as const,
          transition: {
            type: 'smartAnimate' as const,
            duration: 400,
            easing: 'easeOut' as const,
          },
        },
      },
      {
        id: 'ob-cta-text', name: '按钮文字', category: 'content' as const,
        isKeyElement: true, attributes: [],
        shapeType: 'text' as const,
        position: { x: 140, y: 294 }, size: { width: 120, height: 24 },
        text: '开始探索 →',
        style: { ...baseStyle, fill: '#fff', fontSize: 16, fontWeight: 600 },
        zIndex: 6,
      },
      // Feature list items
      ...createFeatureItem('ob-f1', '🎨', '丰富的设计工具', 360),
      ...createFeatureItem('ob-f2', '⚡', '流畅的交互动效', 420),
      ...createFeatureItem('ob-f3', '📱', '真实设备预览', 480),
      // Settings icon → hover → Frame 3 (dissolve)
      {
        id: 'ob-settings-btn', name: '设置入口', category: 'content' as const,
        isKeyElement: true, attributes: [],
        shapeType: 'rectangle' as const,
        position: { x: 330, y: 556 }, size: { width: 40, height: 40 },
        style: { ...darkCard, borderRadius: 12 },
        zIndex: 5,
        prototypeLink: {
          enabled: true,
          targetFrameId: 'onboard-frame-3',
          trigger: 'hover' as const,
          transition: {
            type: 'dissolve' as const,
            duration: 250,
            easing: 'ease' as const,
          },
        },
      },
      {
        id: 'ob-settings-icon', name: '设置图标', category: 'content' as const,
        isKeyElement: true, attributes: [],
        shapeType: 'text' as const,
        position: { x: 340, y: 564 }, size: { width: 20, height: 20 },
        text: '⚙',
        style: { ...baseStyle, fill: '#888', fontSize: 16 },
        zIndex: 6,
      },
      // Bottom tab bar
      ...createTabBar('ob'),
    ],
  };
}

// ─── Frame 2: 详情页 ─────────────────────────────────────

function createFrame2() {
  return {
    id: 'onboard-frame-2',
    name: '详情页',
    summary: '点击按钮后 — 成功卡片 + 统计数据 + 继续按钮',
    keyElements: [
      // Status bar
      {
        id: 'ob2-statusbar', name: '状态栏', category: 'content' as const,
        isKeyElement: true, attributes: [],
        shapeType: 'rectangle' as const,
        position: { x: 0, y: 0 }, size: { width: 390, height: 54 },
        style: { ...baseStyle, fill: '#0a0a0a', borderRadius: 0 },
        zIndex: 20,
      },
      // Back button → tap → Frame 1
      {
        id: 'ob2-back', name: '返回按钮', category: 'content' as const,
        isKeyElement: true, attributes: [],
        shapeType: 'text' as const,
        position: { x: 16, y: 16 }, size: { width: 60, height: 22 },
        text: '← 返回',
        style: { ...baseStyle, fill: '#3b82f6', fontSize: 14, fontWeight: 500 },
        zIndex: 21,
        prototypeLink: {
          enabled: true,
          targetFrameId: 'onboard-frame-1',
          trigger: 'tap' as const,
          transition: {
            type: 'smartAnimate' as const,
            duration: 300,
            easing: 'easeOut' as const,
          },
        },
      },
      // Success card
      {
        id: 'ob2-card', name: '成功卡片', category: 'content' as const,
        isKeyElement: true, attributes: [],
        shapeType: 'rectangle' as const,
        position: { x: 20, y: 74 }, size: { width: 350, height: 200 },
        style: {
          ...baseStyle, borderRadius: 20,
          gradientType: 'linear' as const, gradientAngle: 135,
          gradientStops: [
            { color: '#22c55e', position: 0 },
            { color: '#06b6d4', position: 100 },
          ],
        },
        zIndex: 5,
      },
      {
        id: 'ob2-check', name: '勾选图标', category: 'content' as const,
        isKeyElement: true, attributes: [],
        shapeType: 'text' as const,
        position: { x: 160, y: 110 }, size: { width: 60, height: 50 },
        text: '✓',
        style: { ...baseStyle, fill: '#fff', fontSize: 42, fontWeight: 700 },
        zIndex: 6,
      },
      {
        id: 'ob2-title', name: '成功标题', category: 'content' as const,
        isKeyElement: true, attributes: [],
        shapeType: 'text' as const,
        position: { x: 100, y: 170 }, size: { width: 200, height: 28 },
        text: '太棒了！🎉',
        style: { ...baseStyle, fill: '#fff', fontSize: 22, fontWeight: 700 },
        zIndex: 6,
      },
      {
        id: 'ob2-desc', name: '描述文字', category: 'content' as const,
        isKeyElement: true, attributes: [],
        shapeType: 'text' as const,
        position: { x: 60, y: 204 }, size: { width: 280, height: 20 },
        text: '你已经学会了基本操作',
        style: { ...baseStyle, fill: 'rgba(255,255,255,0.7)', fontSize: 14 },
        zIndex: 6,
      },
      // Stats cards
      ...createStatCard('ob2-stat1', 20, 300, '3', '页面', '#3b82f6'),
      ...createStatCard('ob2-stat2', 202, 300, '4', '交互', '#22c55e'),
      // Continue button → tap → Frame 3 (push)
      {
        id: 'ob2-continue', name: '继续按钮', category: 'content' as const,
        isKeyElement: true, attributes: [],
        shapeType: 'rectangle' as const,
        position: { x: 20, y: 430 }, size: { width: 350, height: 48 },
        style: {
          ...baseStyle, borderRadius: 14,
          gradientType: 'linear' as const, gradientAngle: 90,
          gradientStops: [
            { color: '#8b5cf6', position: 0 },
            { color: '#ec4899', position: 100 },
          ],
        },
        zIndex: 5,
        prototypeLink: {
          enabled: true,
          targetFrameId: 'onboard-frame-3',
          trigger: 'tap' as const,
          transition: {
            type: 'push' as const,
            direction: 'left' as const,
            duration: 350,
            easing: 'easeInOut' as const,
          },
        },
      },
      {
        id: 'ob2-continue-text', name: '继续文字', category: 'content' as const,
        isKeyElement: true, attributes: [],
        shapeType: 'text' as const,
        position: { x: 140, y: 444 }, size: { width: 120, height: 20 },
        text: '查看设置 →',
        style: { ...baseStyle, fill: '#fff', fontSize: 14, fontWeight: 600 },
        zIndex: 6,
      },
      // Bottom tab bar
      ...createTabBar('ob2'),
    ],
  };
}

// ─── Frame 3: 设置页 ─────────────────────────────────────

function createFrame3() {
  return {
    id: 'onboard-frame-3',
    name: '设置页',
    summary: '设置页面 — 展示 mouseEnter 触发 + 不同过渡效果',
    keyElements: [
      // Status bar
      {
        id: 'ob3-statusbar', name: '状态栏', category: 'content' as const,
        isKeyElement: true, attributes: [],
        shapeType: 'rectangle' as const,
        position: { x: 0, y: 0 }, size: { width: 390, height: 54 },
        style: { ...baseStyle, fill: '#0a0a0a', borderRadius: 0 },
        zIndex: 20,
      },
      // Header
      {
        id: 'ob3-header', name: '页面标题', category: 'content' as const,
        isKeyElement: true, attributes: [],
        shapeType: 'text' as const,
        position: { x: 20, y: 70 }, size: { width: 200, height: 30 },
        text: '设置',
        style: { ...baseStyle, fill: '#fff', fontSize: 24, fontWeight: 700 },
        zIndex: 6,
      },
      // Settings rows
      ...createSettingsRow('ob3-row1', '🎨', '主题', '深色模式', 120),
      ...createSettingsRow('ob3-row2', '🔔', '通知', '已开启', 186),
      ...createSettingsRow('ob3-row3', '🌐', '语言', '简体中文', 252),
      // Danger zone card
      {
        id: 'ob3-danger-card', name: '危险区域', category: 'content' as const,
        isKeyElement: true, attributes: [],
        shapeType: 'rectangle' as const,
        position: { x: 20, y: 340 }, size: { width: 350, height: 56 },
        style: { ...baseStyle, fill: '#1a0a0a', borderRadius: 14, stroke: '#3a1515', strokeWidth: 1 },
        zIndex: 3,
      },
      {
        id: 'ob3-danger-text', name: '重置文字', category: 'content' as const,
        isKeyElement: true, attributes: [],
        shapeType: 'text' as const,
        position: { x: 40, y: 358 }, size: { width: 120, height: 20 },
        text: '重置所有设置',
        style: { ...baseStyle, fill: '#ef4444', fontSize: 14, fontWeight: 500 },
        zIndex: 4,
      },
      // Home button → mouseEnter → Frame 1 (moveIn)
      {
        id: 'ob3-home-btn', name: '返回首页', category: 'content' as const,
        isKeyElement: true, attributes: [],
        shapeType: 'rectangle' as const,
        position: { x: 20, y: 430 }, size: { width: 350, height: 48 },
        style: { ...darkCard, borderRadius: 14 },
        zIndex: 5,
        prototypeLink: {
          enabled: true,
          targetFrameId: 'onboard-frame-1',
          trigger: 'mouseEnter' as const,
          transition: {
            type: 'moveIn' as const,
            direction: 'right' as const,
            duration: 400,
            easing: 'spring' as const,
          },
        },
      },
      {
        id: 'ob3-home-text', name: '返回首页文字', category: 'content' as const,
        isKeyElement: true, attributes: [],
        shapeType: 'text' as const,
        position: { x: 150, y: 444 }, size: { width: 100, height: 20 },
        text: '← 返回首页',
        style: { ...baseStyle, fill: '#3b82f6', fontSize: 14, fontWeight: 500 },
        zIndex: 6,
      },
      // Bottom tab bar
      ...createTabBar('ob3'),
    ],
  };
}

// ─── Helpers ──────────────────────────────────────────────

function createFeatureItem(prefix: string, emoji: string, text: string, y: number) {
  return [
    {
      id: `${prefix}-bg`, name: `${text}背景`, category: 'content' as const,
      isKeyElement: true, attributes: [],
      shapeType: 'rectangle' as const,
      position: { x: 20, y }, size: { width: 350, height: 48 },
      style: { ...darkCard, borderRadius: 12 },
      zIndex: 3,
    },
    {
      id: `${prefix}-icon`, name: `${text}图标`, category: 'content' as const,
      isKeyElement: true, attributes: [],
      shapeType: 'text' as const,
      position: { x: 36, y: y + 12 }, size: { width: 24, height: 24 },
      text: emoji,
      style: { ...baseStyle, fill: '#fff', fontSize: 18 },
      zIndex: 4,
    },
    {
      id: `${prefix}-text`, name: text, category: 'content' as const,
      isKeyElement: true, attributes: [],
      shapeType: 'text' as const,
      position: { x: 68, y: y + 14 }, size: { width: 260, height: 20 },
      text,
      style: { ...baseStyle, fill: '#ccc', fontSize: 14 },
      zIndex: 4,
    },
  ];
}

function createStatCard(prefix: string, x: number, y: number, num: string, label: string, color: string) {
  return [
    {
      id: `${prefix}-bg`, name: `${label}卡片`, category: 'content' as const,
      isKeyElement: true, attributes: [],
      shapeType: 'rectangle' as const,
      position: { x, y }, size: { width: 168, height: 100 },
      style: { ...darkCard },
      zIndex: 5,
    },
    {
      id: `${prefix}-num`, name: `${label}数字`, category: 'content' as const,
      isKeyElement: true, attributes: [],
      shapeType: 'text' as const,
      position: { x: x + 16, y: y + 20 }, size: { width: 60, height: 30 },
      text: num,
      style: { ...baseStyle, fill: color, fontSize: 28, fontWeight: 700 },
      zIndex: 6,
    },
    {
      id: `${prefix}-label`, name: `${label}标签`, category: 'content' as const,
      isKeyElement: true, attributes: [],
      shapeType: 'text' as const,
      position: { x: x + 16, y: y + 58 }, size: { width: 80, height: 16 },
      text: label,
      style: { ...baseStyle, fill: '#888', fontSize: 12 },
      zIndex: 6,
    },
  ];
}

function createSettingsRow(prefix: string, emoji: string, title: string, value: string, y: number) {
  return [
    {
      id: `${prefix}-bg`, name: `${title}行`, category: 'content' as const,
      isKeyElement: true, attributes: [],
      shapeType: 'rectangle' as const,
      position: { x: 20, y }, size: { width: 350, height: 54 },
      style: { ...darkCard, borderRadius: 14 },
      zIndex: 3,
    },
    {
      id: `${prefix}-icon`, name: `${title}图标`, category: 'content' as const,
      isKeyElement: true, attributes: [],
      shapeType: 'text' as const,
      position: { x: 36, y: y + 16 }, size: { width: 24, height: 24 },
      text: emoji,
      style: { ...baseStyle, fill: '#fff', fontSize: 18 },
      zIndex: 4,
    },
    {
      id: `${prefix}-title`, name: title, category: 'content' as const,
      isKeyElement: true, attributes: [],
      shapeType: 'text' as const,
      position: { x: 68, y: y + 18 }, size: { width: 120, height: 18 },
      text: title,
      style: { ...baseStyle, fill: '#eee', fontSize: 14, fontWeight: 500 },
      zIndex: 4,
    },
    {
      id: `${prefix}-value`, name: `${title}值`, category: 'content' as const,
      isKeyElement: true, attributes: [],
      shapeType: 'text' as const,
      position: { x: 280, y: y + 18 }, size: { width: 80, height: 18 },
      text: value,
      style: { ...baseStyle, fill: '#666', fontSize: 13 },
      zIndex: 4,
    },
  ];
}

function createTabBar(prefix: string) {
  const tabs = [
    { icon: '🏠', label: '首页' },
    { icon: '🔍', label: '发现' },
    { icon: '👤', label: '我的' },
  ];
  return [
    {
      id: `${prefix}-tabbar`, name: '底部导航', category: 'content' as const,
      isKeyElement: true, attributes: [],
      shapeType: 'rectangle' as const,
      position: { x: 0, y: 778 }, size: { width: 390, height: 66 },
      style: { ...baseStyle, fill: '#111', borderRadius: 0, stroke: '#222', strokeWidth: 1 },
      zIndex: 10,
    },
    ...tabs.flatMap((tab, i) => [
      {
        id: `${prefix}-tab${i}-icon`, name: `${tab.label}图标`, category: 'content' as const,
        isKeyElement: true, attributes: [],
        shapeType: 'text' as const,
        position: { x: 55 + i * 130, y: 790 }, size: { width: 24, height: 24 },
        text: tab.icon,
        style: { ...baseStyle, fill: '#fff', fontSize: 18 },
        zIndex: 11,
      },
      {
        id: `${prefix}-tab${i}-label`, name: `${tab.label}文字`, category: 'content' as const,
        isKeyElement: true, attributes: [],
        shapeType: 'text' as const,
        position: { x: 45 + i * 130, y: 816 }, size: { width: 44, height: 14 },
        text: tab.label,
        style: { ...baseStyle, fill: i === 0 ? '#3b82f6' : '#666', fontSize: 10 },
        zIndex: 11,
      },
    ]),
  ];
}
