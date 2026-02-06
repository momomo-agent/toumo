import { useState, useEffect } from 'react';

const WELCOME_SHOWN_KEY = 'toumo-welcome-shown';
const DONT_SHOW_KEY = 'toumo-welcome-dont-show';

interface WelcomeModalProps {
  onLoadExample?: () => void;
}

export function WelcomeModal({ onLoadExample }: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const dontShow = localStorage.getItem(DONT_SHOW_KEY);
    if (!dontShow) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(DONT_SHOW_KEY, 'true');
    }
    localStorage.setItem(WELCOME_SHOWN_KEY, 'true');
    setIsOpen(false);
  };

  const handleLoadExample = () => {
    onLoadExample?.();
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          width: 420,
          background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
          borderRadius: 20,
          border: '1px solid #2a2a2a',
          boxShadow: '0 40px 100px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '28px 28px 20px', textAlign: 'center' }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: '0 auto 14px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
            }}
          >
            ✦
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '-0.5px',
            }}
          >
            欢迎使用 Toumo
          </h1>
          <p
            style={{
              margin: '8px 0 0',
              fontSize: 14,
              color: '#888',
              lineHeight: 1.5,
            }}
          >
            轻量级原型设计工具
          </p>
        </div>

        {/* Quick Start Tips */}
        <div
          style={{
            padding: '16px 28px',
            background: '#141414',
            borderTop: '1px solid #222',
            borderBottom: '1px solid #222',
          }}
        >
          <h3
            style={{
              margin: '0 0 12px',
              fontSize: 13,
              fontWeight: 600,
              color: '#888',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            快速开始
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <ShortcutTip keyName="R" description="创建矩形" />
            <ShortcutTip keyName="T" description="添加文字" />
            <ShortcutTip keyName="O" description="创建圆形" />
            <ShortcutTip keyName="V" description="选择工具" />
          </div>
        </div>

        {/* Buttons */}
        <div style={{ padding: '20px 28px', display: 'flex', gap: 10 }}>
          <button
            onClick={handleLoadExample}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'transparent',
              border: '1px solid #333',
              borderRadius: 10,
              color: '#ccc',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#555';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#333';
              e.currentTarget.style.color = '#ccc';
            }}
          >
            加载示例项目
          </button>
          <button
            onClick={handleClose}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
            }}
          >
            开始创建
          </button>
        </div>

        {/* Don't show again checkbox */}
        <div
          style={{
            padding: '0 28px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <input
            type="checkbox"
            id="dont-show-again"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <label
            htmlFor="dont-show-again"
            style={{
              fontSize: 12,
              color: '#666',
              cursor: 'pointer',
            }}
          >
            不再显示
          </label>
        </div>
      </div>
    </div>
  );
}

function ShortcutTip({ keyName, description }: { keyName: string; description: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <kbd
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          background: '#222',
          border: '1px solid #333',
          borderRadius: 6,
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {keyName}
      </kbd>
      <span style={{ fontSize: 13, color: '#aaa' }}>{description}</span>
    </div>
  );
}
