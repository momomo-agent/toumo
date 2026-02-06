import { useState, useEffect } from 'react';

const WELCOME_SHOWN_KEY = 'toumo-welcome-shown';

type Step = {
  icon: string;
  title: string;
  description: string;
};

const steps: Step[] = [
  {
    icon: '🎨',
    title: '绘制形状',
    description: '使用工具栏创建矩形、圆形、文字等元素',
  },
  {
    icon: '✨',
    title: '设计样式',
    description: '调整颜色、渐变、阴影等属性打造精美设计',
  },
  {
    icon: '🔗',
    title: '添加交互',
    description: '定义状态转换，创建流畅的原型动画',
  },
  {
    icon: '📱',
    title: '实时预览',
    description: '随时预览你的设计在真实设备上的效果',
  },
];

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasShown = localStorage.getItem(WELCOME_SHOWN_KEY);
    if (!hasShown) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(WELCOME_SHOWN_KEY, 'true');
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
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
          width: 480,
          background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
          borderRadius: 24,
          border: '1px solid #2a2a2a',
          boxShadow: '0 40px 100px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '32px 32px 24px',
            textAlign: 'center',
            borderBottom: '1px solid #222',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
            }}
          >
            ✦
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
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
            轻量级原型设计工具，让你的创意快速成型
          </p>
        </div>

        {/* Steps */}
        <div style={{ padding: '24px 32px' }}>
          {/* Step indicators */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 24,
            }}
          >
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                style={{
                  width: index === currentStep ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  border: 'none',
                  background: index === currentStep ? '#3b82f6' : '#333',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </div>

          {/* Current step content */}
          <div
            style={{
              textAlign: 'center',
              minHeight: 120,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                margin: '0 auto 16px',
                background: '#1f1f1f',
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                border: '1px solid #333',
              }}
            >
              {steps[currentStep].icon}
            </div>
            <h3
              style={{
                margin: '0 0 8px',
                fontSize: 18,
                fontWeight: 600,
                color: '#fff',
              }}
            >
              {steps[currentStep].title}
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: '#888',
                lineHeight: 1.6,
              }}
            >
              {steps[currentStep].description}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 32px 24px',
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
          }}
        >
          {currentStep > 0 && (
            <button
              onClick={handlePrev}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: '1px solid #333',
                borderRadius: 12,
                color: '#888',
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
                e.currentTarget.style.color = '#888';
              }}
            >
              上一步
            </button>
          )}
          <button
            onClick={handleNext}
            style={{
              padding: '12px 32px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: 'none',
              borderRadius: 12,
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
            {currentStep < steps.length - 1 ? '下一步' : '开始创建'}
          </button>
        </div>

        {/* Skip button */}
        <div style={{ textAlign: 'center', paddingBottom: 20 }}>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#555',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#888')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#555')}
          >
            跳过引导
          </button>
        </div>
      </div>
    </div>
  );
}
