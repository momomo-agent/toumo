/**
 * Example project data for the onboarding flow.
 * Creates a simple but complete demo: two frames with a button interaction.
 * Demonstrates: elements, states, transitions, and preview.
 */

const baseStyle = {
  fill: '#3b82f6',
  fillOpacity: 1,
  stroke: '',
  strokeWidth: 0,
  strokeOpacity: 1,
  borderRadius: 8,
};

export function createOnboardingProject() {
  return {
    version: '1.0',
    keyframes: [
      {
        id: 'onboard-frame-1',
        name: '首页',
        summary: '应用首页 — 展示欢迎卡片和操作按钮',
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
          // Hero card
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
          // CTA Button
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
          // Feature list
          ...createFeatureItem('ob-f1', '🎨', '丰富的设计工具', 360),
          ...createFeatureItem('ob-f2', '⚡', '流畅的交互动效', 420),
          ...createFeatureItem('ob-f3', '📱', '真实设备预览', 480),
        ],
      },
      {
        id: 'onboard-frame-2',
        name: '详情页',
        summary: '点击按钮后的详情页面',
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
          // Back button
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
          // Info cards
          {
            id: 'ob2-info1', name: '信息卡片1', category: 'content' as const,
            isKeyElement: true, attributes: [],
            shapeType: 'rectangle' as const,
            position: { x: 20, y: 300 }, size: { width: 168, height: 100 },
            style: { ...baseStyle, fill: '#1a1a1a', borderRadius: 16, stroke: '#222', strokeWidth: 1 },
            zIndex: 5,
          },
          {
            id: 'ob2-info1-num', name: '数字1', category: 'content' as const,
            isKeyElement: true, attributes: [],
            shapeType: 'text' as const,
            position: { x: 36, y: 320 }, size: { width: 60, height: 30 },
            text: '2',
            style: { ...baseStyle, fill: '#3b82f6', fontSize: 28, fontWeight: 700 },
            zIndex: 6,
          },
          {
            id: 'ob2-info1-label', name: '标签1', category: 'content' as const,
            isKeyElement: true, attributes: [],
            shapeType: 'text' as const,
            position: { x: 36, y: 358 }, size: { width: 80, height: 16 },
            text: '页面',
            style: { ...baseStyle, fill: '#888', fontSize: 12 },
            zIndex: 6,
          },
          {
            id: 'ob2-info2', name: '信息卡片2', category: 'content' as const,
            isKeyElement: true, attributes: [],
            shapeType: 'rectangle' as const,
            position: { x: 202, y: 300 }, size: { width: 168, height: 100 },
            style: { ...baseStyle, fill: '#1a1a1a', borderRadius: 16, stroke: '#222', strokeWidth: 1 },
            zIndex: 5,
          },
          {
            id: 'ob2-info2-num', name: '数字2', category: 'content' as const,
            isKeyElement: true, attributes: [],
            shapeType: 'text' as const,
            position: { x: 218, y: 320 }, size: { width: 60, height: 30 },
            text: '1',
            style: { ...baseStyle, fill: '#22c55e', fontSize: 28, fontWeight: 700 },
            zIndex: 6,
          },
          {
            id: 'ob2-info2-label', name: '标签2', category: 'content' as const,
            isKeyElement: true, attributes: [],
            shapeType: 'text' as const,
            position: { x: 218, y: 358 }, size: { width: 80, height: 16 },
            text: '交互',
            style: { ...baseStyle, fill: '#888', fontSize: 12 },
            zIndex: 6,
          },
        ],
      },
    ],
    transitions: [
      {
        id: 'onboard-trans-1',
        from: 'onboard-frame-1',
        to: 'onboard-frame-2',
        trigger: { type: 'tap' },
        animation: {
          type: 'spring',
          duration: 400,
          easing: 'ease-out',
        },
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

function createFeatureItem(prefix: string, emoji: string, text: string, y: number) {
  return [
    {
      id: `${prefix}-bg`, name: `${text}背景`, category: 'content' as const,
      isKeyElement: true, attributes: [],
      shapeType: 'rectangle' as const,
      position: { x: 20, y }, size: { width: 350, height: 48 },
      style: { ...baseStyle, fill: '#141414', borderRadius: 12, stroke: '#1f1f1f', strokeWidth: 1 },
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
