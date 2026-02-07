import { useState, useEffect } from 'react';

// ============ SVG Illustrations ============

function QuickStartSVG() {
  return (
    <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 320 }}>
      {/* Canvas background */}
      <rect x="20" y="10" width="280" height="180" rx="12" fill="#1a1a2e" stroke="#2563eb" strokeWidth="1.5" />
      {/* Grid dots */}
      {[60,100,140,180,220,260].map(x => [40,80,120,160].map(y => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" fill="#333" />
      )))}
      {/* Rectangle element */}
      <rect x="60" y="50" width="100" height="70" rx="8" fill="#3b82f6" fillOpacity="0.8" />
      {/* Selection handles */}
      <rect x="56" y="46" width="108" height="78" rx="2" fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 2" />
      <circle cx="60" cy="50" r="3" fill="#fff" stroke="#3b82f6" strokeWidth="1.5" />
      <circle cx="164" cy="50" r="3" fill="#fff" stroke="#3b82f6" strokeWidth="1.5" />
      <circle cx="60" cy="124" r="3" fill="#fff" stroke="#3b82f6" strokeWidth="1.5" />
      <circle cx="164" cy="124" r="3" fill="#fff" stroke="#3b82f6" strokeWidth="1.5" />
      {/* Ellipse element */}
      <ellipse cx="230" cy="100" rx="40" ry="30" fill="#8b5cf6" fillOpacity="0.7" />
      {/* Text element */}
      <text x="80" y="92" fill="#fff" fontSize="14" fontWeight="600">Hello</text>
      {/* Cursor */}
      <path d="M200 60 L200 80 L210 74 L218 88 L224 85 L216 71 L226 68 Z" fill="#fff" />
      {/* Toolbar hint */}
      <rect x="40" y="160" width="20" height="20" rx="4" fill="#2563eb" fillOpacity="0.3" />
      <rect x="65" y="160" width="20" height="20" rx="4" fill="#333" />
      <rect x="90" y="160" width="20" height="20" rx="4" fill="#333" />
      <text x="45" y="174" fill="#3b82f6" fontSize="10" fontWeight="bold">V</text>
      <text x="71" y="174" fill="#888" fontSize="10">R</text>
      <text x="96" y="174" fill="#888" fontSize="10">O</text>
    </svg>
  );
}

function StateTransitionSVG() {
  return (
    <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 320 }}>
      {/* State A */}
      <rect x="20" y="40" width="100" height="120" rx="10" fill="#1a1a2e" stroke="#3b82f6" strokeWidth="1.5" />
      <text x="45" y="30" fill="#3b82f6" fontSize="11" fontWeight="600">State A</text>
      <rect x="35" y="60" width="70" height="30" rx="6" fill="#3b82f6" />
      <rect x="35" y="100" width="70" height="20" rx="4" fill="#333" />
      <rect x="35" y="128" width="50" height="16" rx="4" fill="#22c55e" fillOpacity="0.6" />
      {/* Arrow */}
      <path d="M130 100 L190 100" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 3" />
      <path d="M185 94 L195 100 L185 106" fill="#f59e0b" />
      {/* Transition label */}
      <rect x="140" y="78" width="40" height="18" rx="4" fill="#f59e0b" fillOpacity="0.15" />
      <text x="147" y="91" fill="#f59e0b" fontSize="9" fontWeight="500">0.3s</text>
      {/* State B */}
      <rect x="200" y="40" width="100" height="120" rx="10" fill="#1a1a2e" stroke="#8b5cf6" strokeWidth="1.5" />
      <text x="225" y="30" fill="#8b5cf6" fontSize="11" fontWeight="600">State B</text>
      <rect x="215" y="60" width="70" height="20" rx="6" fill="#8b5cf6" />
      <rect x="215" y="90" width="70" height="30" rx="4" fill="#333" />
      <rect x="215" y="128" width="70" height="16" rx="4" fill="#ef4444" fillOpacity="0.6" />
      {/* Keyframe dots */}
      <circle cx="70" cy="175" r="5" fill="#3b82f6" />
      <circle cx="160" cy="175" r="5" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2" fillOpacity="0.3" />
      <circle cx="250" cy="175" r="5" fill="#8b5cf6" />
      <line x1="75" y1="175" x2="155" y2="175" stroke="#444" strokeWidth="1" />
      <line x1="165" y1="175" x2="245" y2="175" stroke="#444" strokeWidth="1" />
      <text x="130" y="195" fill="#666" fontSize="9">Timeline</text>
    </svg>
  );
}

function SmartAnimateSVG() {
  return (
    <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 320 }}>
      {/* Curve editor background */}
      <rect x="20" y="10" width="180" height="140" rx="8" fill="#111" stroke="#2a2a2a" strokeWidth="1" />
      {/* Grid */}
      <line x1="20" y1="75" x2="200" y2="75" stroke="#222" strokeWidth="0.5" />
      <line x1="110" y1="10" x2="110" y2="150" stroke="#222" strokeWidth="0.5" />
      {/* Bezier curve */}
      <path d="M30 140 C70 140, 80 20, 190 20" stroke="#3b82f6" strokeWidth="2.5" fill="none" />
      {/* Control points */}
      <line x1="30" y1="140" x2="70" y2="140" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 2" />
      <line x1="190" y1="20" x2="80" y2="20" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 2" />
      <circle cx="30" cy="140" r="4" fill="#3b82f6" />
      <circle cx="70" cy="140" r="4" fill="#fff" stroke="#3b82f6" strokeWidth="1.5" />
      <circle cx="80" cy="20" r="4" fill="#fff" stroke="#3b82f6" strokeWidth="1.5" />
      <circle cx="190" cy="20" r="4" fill="#3b82f6" />
      {/* Labels */}
      <text x="30" y="165" fill="#666" fontSize="9">0s</text>
      <text x="180" y="165" fill="#666" fontSize="9">1s</text>
      {/* Presets panel */}
      <rect x="220" y="10" width="80" height="180" rx="8" fill="#161617" stroke="#2a2a2a" strokeWidth="1" />
      <text x="232" y="30" fill="#888" fontSize="9" fontWeight="600">PRESETS</text>
      {/* Preset items */}
      {['ease', 'ease-in', 'ease-out', 'spring'].map((name, i) => (
        <g key={name}>
          <rect x="228" y={40 + i * 38} width="64" height="30" rx="5" fill={i === 3 ? '#2563eb20' : '#1a1a1a'} stroke={i === 3 ? '#2563eb' : '#333'} strokeWidth="1" />
          <text x="238" y={59 + i * 38} fill={i === 3 ? '#3b82f6' : '#aaa'} fontSize="9">{name}</text>
        </g>
      ))}
      {/* Spring icon */}
      <path d="M275 155 Q280 148, 285 155 Q290 162, 295 155" stroke="#3b82f6" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function InteractionSVG() {
  return (
    <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 320 }}>
      {/* Phone frame */}
      <rect x="30" y="10" width="110" height="180" rx="16" fill="#0a0a0b" stroke="#333" strokeWidth="1.5" />
      <rect x="38" y="25" width="94" height="150" rx="4" fill="#1a1a2e" />
      {/* Button in phone */}
      <rect x="50" y="110" width="70" height="28" rx="8" fill="#3b82f6" />
      <text x="65" y="128" fill="#fff" fontSize="10" fontWeight="500">点击我</text>
      {/* Tap gesture */}
      <circle cx="85" cy="124" r="18" fill="#3b82f6" fillOpacity="0.15" />
      <circle cx="85" cy="124" r="12" fill="#3b82f6" fillOpacity="0.1" />
      {/* Finger icon */}
      <circle cx="85" cy="124" r="5" fill="#fff" fillOpacity="0.6" />
      {/* Connection line */}
      <path d="M140 124 C170 124, 170 80, 200 80" stroke="#22c55e" strokeWidth="2" strokeDasharray="5 3" />
      <circle cx="200" cy="80" r="4" fill="#22c55e" />
      {/* Target screen */}
      <rect x="190" y="10" width="110" height="180" rx="16" fill="#0a0a0b" stroke="#333" strokeWidth="1.5" />
      <rect x="198" y="25" width="94" height="150" rx="4" fill="#1a1a2e" />
      {/* New content */}
      <rect x="210" y="40" width="70" height="50" rx="8" fill="#8b5cf6" fillOpacity="0.6" />
      <rect x="210" y="100" width="70" height="12" rx="3" fill="#333" />
      <rect x="210" y="118" width="50" height="12" rx="3" fill="#333" />
      {/* Trigger labels */}
      <text x="55" y="165" fill="#666" fontSize="8">tap</text>
      <text x="220" y="165" fill="#666" fontSize="8">navigate</text>
      {/* Trigger type badges */}
      <g transform="translate(50, 55)">
        {['Tap', 'Drag', 'Hover'].map((t, i) => (
          <g key={t}>
            <rect x={i * 30} y="0" width="26" height="14" rx="3" fill={i === 0 ? '#22c55e20' : '#1a1a1a'} stroke={i === 0 ? '#22c55e' : '#333'} strokeWidth="0.8" />
            <text x={i * 30 + 5} y="10" fill={i === 0 ? '#22c55e' : '#666'} fontSize="7">{t}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function AutoLayoutSVG() {
  return (
    <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 320 }}>
      {/* Container */}
      <rect x="30" y="20" width="260" height="160" rx="12" fill="#111" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="6 3" />
      <text x="40" y="15" fill="#2563eb" fontSize="10" fontWeight="600">Auto Layout</text>
      {/* Row items */}
      <rect x="50" y="45" width="60" height="50" rx="8" fill="#3b82f6" fillOpacity="0.7" />
      <rect x="125" y="45" width="60" height="50" rx="8" fill="#8b5cf6" fillOpacity="0.7" />
      <rect x="200" y="45" width="60" height="50" rx="8" fill="#22c55e" fillOpacity="0.7" />
      {/* Spacing indicators */}
      <line x1="112" y1="70" x2="123" y2="70" stroke="#f59e0b" strokeWidth="1.5" />
      <text x="114" y="64" fill="#f59e0b" fontSize="8">16</text>
      <line x1="187" y1="70" x2="198" y2="70" stroke="#f59e0b" strokeWidth="1.5" />
      <text x="189" y="64" fill="#f59e0b" fontSize="8">16</text>
      {/* Padding indicators */}
      <line x1="35" y1="45" x2="35" y2="95" stroke="#ef4444" strokeWidth="1" strokeDasharray="2 2" />
      <line x1="35" y1="45" x2="48" y2="45" stroke="#ef4444" strokeWidth="1" />
      <text x="36" y="42" fill="#ef4444" fontSize="7">pad</text>
      {/* Alignment icons */}
      <g transform="translate(50, 115)">
        {/* Align left */}
        <rect x="0" y="0" width="40" height="28" rx="5" fill="#1a1a2e" stroke="#333" strokeWidth="1" />
        <line x1="8" y1="6" x2="8" y2="22" stroke="#3b82f6" strokeWidth="1.5" />
        <rect x="12" y="8" width="18" height="4" rx="1" fill="#3b82f6" fillOpacity="0.6" />
        <rect x="12" y="16" width="12" height="4" rx="1" fill="#3b82f6" fillOpacity="0.6" />
        {/* Align center */}
        <rect x="50" y="0" width="40" height="28" rx="5" fill="#2563eb15" stroke="#2563eb" strokeWidth="1" />
        <line x1="70" y1="6" x2="70" y2="22" stroke="#3b82f6" strokeWidth="1.5" />
        <rect x="59" y="8" width="22" height="4" rx="1" fill="#3b82f6" fillOpacity="0.6" />
        <rect x="62" y="16" width="16" height="4" rx="1" fill="#3b82f6" fillOpacity="0.6" />
        {/* Distribute */}
        <rect x="100" y="0" width="40" height="28" rx="5" fill="#1a1a2e" stroke="#333" strokeWidth="1" />
        <rect x="108" y="8" width="8" height="12" rx="2" fill="#8b5cf6" fillOpacity="0.6" />
        <rect x="120" y="8" width="8" height="12" rx="2" fill="#8b5cf6" fillOpacity="0.6" />
        <rect x="132" y="8" width="8" height="12" rx="2" fill="#8b5cf6" fillOpacity="0.6" />
      </g>
      {/* Direction arrow */}
      <path d="M155 110 L175 110" stroke="#888" strokeWidth="1.5" />
      <path d="M172 106 L178 110 L172 114" fill="#888" />
      <text x="155" y="108" fill="#666" fontSize="8">row</text>
    </svg>
  );
}

function ExportSVG() {
  return (
    <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 320 }}>
      {/* Export cards */}
      {[
        { x: 20, label: 'CSS', color: '#3b82f6', icon: '{ }' },
        { x: 100, label: 'Framer', color: '#8b5cf6', icon: 'F' },
        { x: 180, label: 'Lottie', color: '#22c55e', icon: '▶' },
        { x: 260, label: 'GIF', color: '#f59e0b', icon: '◉' },
      ].map(({ x, label, color, icon }) => (
        <g key={label}>
          <rect x={x} y="20" width="60" height="70" rx="10" fill="#111" stroke={color} strokeWidth="1.5" />
          <text x={x + 30} y="55" fill={color} fontSize="16" fontWeight="bold" textAnchor="middle">{icon}</text>
          <text x={x + 30} y="78" fill="#aaa" fontSize="9" textAnchor="middle">{label}</text>
        </g>
      ))}
      {/* Share section */}
      <rect x="40" y="110" width="240" height="70" rx="10" fill="#161617" stroke="#2a2a2a" strokeWidth="1" />
      <text x="60" y="135" fill="#888" fontSize="10" fontWeight="600">🔗 分享链接</text>
      {/* URL bar */}
      <rect x="60" y="145" width="180" height="24" rx="6" fill="#0a0a0b" stroke="#333" strokeWidth="1" />
      <text x="70" y="161" fill="#555" fontSize="9">toumo.app/share/abc123...</text>
      {/* Copy button */}
      <rect x="248" y="145" width="24" height="24" rx="6" fill="#2563eb" />
      <text x="254" y="161" fill="#fff" fontSize="10">📋</text>
      {/* Download arrow */}
      <path d="M160 95 L160 105" stroke="#888" strokeWidth="2" />
      <path d="M154 101 L160 108 L166 101" stroke="#888" strokeWidth="2" fill="none" />
    </svg>
  );
}

// ============ Chapter Data ============

const chapters = [
  {
    id: 'quick-start',
    title: '快速开始',
    subtitle: '创建第一个动效原型',
    icon: '🚀',
    color: '#3b82f6',
    Illustration: QuickStartSVG,
    content: [
      {
        heading: '画布操作',
        text: '使用鼠标滚轮缩放画布，按住空格键拖拽平移。底部状态栏可快速切换 50%/100%/200% 缩放比例，或点击 Fit 自适应窗口。',
      },
      {
        heading: '添加元素',
        text: '工具栏提供 5 种基础工具：选择 (V)、矩形 (R)、椭圆 (O)、文字 (T)、手型 (H)。按快捷键即可切换，在画布上拖拽绘制。还可以按 I 导入图片，或直接拖拽图片文件到画布。',
      },
      {
        heading: '基本属性',
        text: '选中元素后，右侧检查器面板可编辑位置、尺寸、填充色、描边、圆角、旋转等属性。支持渐变填充、阴影、滤镜、混合模式等高级样式。',
      },
    ],
  },
  {
    id: 'state-transition',
    title: '状态与过渡',
    subtitle: 'Keyframe 概念与触发器',
    icon: '🔄',
    color: '#f59e0b',
    Illustration: StateTransitionSVG,
    content: [
      {
        heading: 'Keyframe 状态',
        text: '左侧 Variants 面板管理所有状态（Keyframe）。每个状态是画面的一个快照，包含所有元素的位置、样式等信息。点击 "+ Add State" 添加新状态。',
      },
      {
        heading: '添加过渡',
        text: '在 Timeline 时间轴中，连接两个状态即可创建过渡动画。设置持续时间、延迟、缓动曲线，Toumo 会自动计算中间帧。',
      },
      {
        heading: '触发器设置',
        text: '过渡可以绑定触发器：点击、悬停、拖拽、滚动、定时器等。在 Interaction Manager 中配置触发条件和目标状态。',
      },
    ],
  },
  {
    id: 'smart-animate',
    title: 'Smart Animate',
    subtitle: '自动补间与物理动画',
    icon: '✨',
    color: '#8b5cf6',
    Illustration: SmartAnimateSVG,
    content: [
      {
        heading: '自动补间动画',
        text: 'Smart Animate 会自动匹配两个状态中同名元素，计算位置、大小、颜色、透明度等属性的差值，生成流畅的补间动画。',
      },
      {
        heading: '曲线预设',
        text: '内置 ease、ease-in、ease-out、ease-in-out 等常用缓动曲线。可视化曲线编辑器支持自定义贝塞尔控制点，精确调整动画节奏。',
      },
      {
        heading: '弹簧物理',
        text: '选择 spring 预设启用弹簧物理引擎。调节刚度 (stiffness)、阻尼 (damping)、质量 (mass) 参数，实现自然的弹性回弹效果。',
      },
    ],
  },
  {
    id: 'interaction',
    title: '交互设计',
    subtitle: 'Prototype Link 与触发器',
    icon: '👆',
    color: '#22c55e',
    Illustration: InteractionSVG,
    content: [
      {
        heading: 'Prototype Link',
        text: '在元素上创建 Prototype Link，连接到目标状态。预览模式下点击元素即可触发状态切换，模拟真实的交互流程。',
      },
      {
        heading: '多种触发器',
        text: '支持 Tap（点击）、Drag（拖拽）、Hover（悬停）、Scroll（滚动）、Timer（定时器）五种触发方式。每种触发器可配置独立的动画参数。',
      },
      {
        heading: '变量与条件',
        text: 'Interaction Manager 支持定义变量和条件逻辑。根据变量值决定跳转目标，实现复杂的交互分支。',
      },
    ],
  },
  {
    id: 'auto-layout',
    title: 'Auto Layout',
    subtitle: '自动布局系统',
    icon: '📐',
    color: '#06b6d4',
    Illustration: AutoLayoutSVG,
    content: [
      {
        heading: '自动布局',
        text: '选中多个元素后启用 Auto Layout，子元素会按行或列自动排列。调整容器大小时，子元素自动重新分布。',
      },
      {
        heading: '间距与内边距',
        text: '设置元素间距 (gap) 和容器内边距 (padding)，保持一致的视觉节奏。支持水平分布和垂直分布快捷操作。',
      },
      {
        heading: '对齐方式',
        text: '提供左对齐、居中、右对齐、顶部、垂直居中、底部 6 种对齐方式。多选 3 个以上元素时还可使用等距分布。',
      },
    ],
  },
  {
    id: 'export-share',
    title: '导出分享',
    subtitle: '多格式导出与协作',
    icon: '📦',
    color: '#ef4444',
    Illustration: ExportSVG,
    content: [
      {
        heading: '多格式导出',
        text: '支持导出为 CSS 动画代码、Framer Motion 组件、Lottie JSON、GIF 动图、PNG 截图、SVG 矢量图。点击顶部 Export 按钮选择格式。',
      },
      {
        heading: '分享链接',
        text: '点击 Share 按钮生成分享链接，包含完整的项目数据。接收者打开链接即可查看预览，或进入编辑模式继续修改。',
      },
      {
        heading: '项目文件',
        text: '使用 Save 保存为 .json 项目文件，Load 加载已有项目。支持拖拽导入图片资源，所有数据本地存储，自动保存。',
      },
    ],
  },
];

// ============ Styles ============

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0a0a0b',
    color: '#e5e5e5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", sans-serif',
    overflowX: 'hidden' as const,
  },
  header: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
    background: 'rgba(10,10,11,0.85)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid #1a1a1a',
    padding: '0 24px',
    height: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hero: {
    textAlign: 'center' as const,
    padding: '80px 24px 60px',
    background: 'linear-gradient(180deg, #0a0a0b 0%, #111 100%)',
  },
  nav: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
    padding: '0 24px 48px',
    maxWidth: 800,
    margin: '0 auto',
  },
  content: {
    maxWidth: 860,
    margin: '0 auto',
    padding: '0 24px 80px',
  },
};

// ============ Main Component ============

export function TutorialPage() {
  const [activeChapter, setActiveChapter] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const sections = chapters.map(c => document.getElementById(c.id));
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = sections[i];
        if (el && el.getBoundingClientRect().top < 200) {
          setActiveChapter(chapters[i].id);
          return;
        }
      }
      setActiveChapter(null);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBack = () => {
    window.location.hash = '';
    window.location.reload();
  };

  return (
    <div style={styles.page}>
      {/* Sticky Header */}
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handleBack}
            style={{
              background: 'none',
              border: '1px solid #333',
              borderRadius: 8,
              color: '#aaa',
              padding: '6px 14px',
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#aaa'; }}
          >
            ← 返回编辑器
          </button>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Toumo</span>
          <span style={{ color: '#555', fontSize: 13 }}>教程</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {chapters.map(c => (
            <a
              key={c.id}
              href={`#${c.id}`}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                color: activeChapter === c.id ? c.color : '#666',
                background: activeChapter === c.id ? `${c.color}15` : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {c.icon}
            </a>
          ))}
        </div>
      </header>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={{
          display: 'inline-block',
          padding: '6px 16px',
          borderRadius: 20,
          background: 'linear-gradient(135deg, #3b82f620, #8b5cf620)',
          border: '1px solid #3b82f630',
          fontSize: 12,
          color: '#8b5cf6',
          marginBottom: 24,
        }}>
          ✨ Toumo 动效设计工具教程
        </div>
        <h1 style={{
          fontSize: 42,
          fontWeight: 800,
          margin: '0 0 16px',
          background: 'linear-gradient(135deg, #fff 0%, #888 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.2,
        }}>
          从零开始，掌握动效设计
        </h1>
        <p style={{ color: '#777', fontSize: 16, maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
          6 个章节带你从基础操作到高级交互，快速上手 Toumo 动效原型工具。
        </p>
      </section>

      {/* Chapter Navigation */}
      <nav style={styles.nav}>
        {chapters.map(c => (
          <a
            key={c.id}
            href={`#${c.id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 10,
              background: '#161617',
              border: '1px solid #222',
              color: '#ccc',
              textDecoration: 'none',
              fontSize: 13,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = c.color;
              e.currentTarget.style.background = `${c.color}10`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#222';
              e.currentTarget.style.background = '#161617';
            }}
          >
            <span>{c.icon}</span>
            <span>{c.title}</span>
          </a>
        ))}
      </nav>

      {/* Chapter Content */}
      <main style={styles.content}>
        {chapters.map((chapter, idx) => (
          <ChapterSection key={chapter.id} chapter={chapter} index={idx} />
        ))}
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '40px 24px',
        borderTop: '1px solid #1a1a1a',
        color: '#444',
        fontSize: 13,
      }}>
        <p>Toumo — 让动效设计触手可及</p>
        <button
          onClick={handleBack}
          style={{
            marginTop: 16,
            padding: '10px 28px',
            borderRadius: 10,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            border: 'none',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          开始创作 →
        </button>
      </footer>
    </div>
  );
}

// ============ Chapter Section Component ============

type ChapterData = typeof chapters[number];

function ChapterSection({ chapter, index }: { chapter: ChapterData; index: number }) {
  const { id, title, subtitle, icon, color, Illustration, content } = chapter;
  const isEven = index % 2 === 0;

  return (
    <section
      id={id}
      style={{
        marginBottom: 64,
        scrollMarginTop: 80,
      }}
    >
      {/* Chapter header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
      }}>
        <span style={{
          fontSize: 12,
          color: '#555',
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <div style={{
          height: 1,
          flex: 1,
          background: `linear-gradient(90deg, ${color}40, transparent)`,
        }} />
      </div>

      {/* Card */}
      <div style={{
        background: '#111',
        border: '1px solid #1a1a1a',
        borderRadius: 16,
        overflow: 'hidden',
      }}>
        {/* Top: illustration + title */}
        <div style={{
          display: 'flex',
          flexDirection: isEven ? 'row' : 'row-reverse',
          flexWrap: 'wrap',
          minHeight: 240,
        }}>
          {/* Illustration */}
          <div style={{
            flex: '1 1 300px',
            padding: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `radial-gradient(ellipse at ${isEven ? '30%' : '70%'} 50%, ${color}08, transparent)`,
          }}>
            <Illustration />
          </div>

          {/* Title area */}
          <div style={{
            flex: '1 1 280px',
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: 32, marginBottom: 8 }}>{icon}</span>
            <h2 style={{
              fontSize: 28,
              fontWeight: 700,
              margin: '0 0 8px',
              color: '#fff',
            }}>
              {title}
            </h2>
            <p style={{
              fontSize: 14,
              color: '#888',
              margin: 0,
            }}>
              {subtitle}
            </p>
          </div>
        </div>

        {/* Content cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 1,
          background: '#1a1a1a',
          borderTop: '1px solid #1a1a1a',
        }}>
          {content.map((item, i) => (
            <ContentCard
              key={i}
              heading={item.heading}
              text={item.text}
              color={color}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ Content Card ============

function ContentCard({ heading, text, color, index }: {
  heading: string;
  text: string;
  color: string;
  index: number;
}) {
  return (
    <div style={{
      padding: 24,
      background: '#111',
      transition: 'background 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = '#161617'; }}
      onMouseLeave={e => { e.currentTarget.style.background = '#111'; }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
      }}>
        <span style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: `${color}20`,
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
        }}>
          {index + 1}
        </span>
        <h3 style={{
          fontSize: 14,
          fontWeight: 600,
          margin: 0,
          color: '#e5e5e5',
        }}>
          {heading}
        </h3>
      </div>
      <p style={{
        fontSize: 13,
        color: '#888',
        margin: 0,
        lineHeight: 1.7,
      }}>
        {text}
      </p>
    </div>
  );
}
