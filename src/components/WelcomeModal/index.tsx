import { useState, useEffect, useCallback } from 'react';
import { StepIllustration } from './StepIllustration';
import { createOnboardingProject } from './exampleProject';

const DONT_SHOW_KEY = 'toumo-welcome-dont-show';

interface WelcomeModalProps {
  onLoadExample?: (project?: ReturnType<typeof createOnboardingProject>) => void;
}

const STEPS = [
  { icon: '🎨', title: '创建元素', subtitle: '用工具栏快速绘制形状和文字', tips: [['R','矩形'],['O','圆形'],['T','文字']] },
  { icon: '✨', title: '添加状态', subtitle: '为元素定义不同的视觉状态', tips: [['1','添加新状态'],['2','修改属性'],['3','每个状态=一个画面']] },
  { icon: '⚡', title: '设置交互', subtitle: '定义状态之间的触发和过渡动画', tips: [['1','选择触发方式'],['2','设置动画类型'],['3','调整时长和缓动']] },
  { icon: '📱', title: '预览效果', subtitle: '实时查看你的交互原型', tips: [['▶','点击预览'],['↔','设备框架测试'],['📤','分享给团队']] },
];

export function WelcomeModal({ onLoadExample }: WelcomeModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [skip, setSkip] = useState(false);

  useEffect(() => { if (!localStorage.getItem(DONT_SHOW_KEY)) setOpen(true); }, []);

  const close = useCallback(() => {
    if (skip) localStorage.setItem(DONT_SHOW_KEY, 'true');
    setOpen(false);
  }, [skip]);

  if (!open) return null;

  const s = STEPS[step];
  const last = step === STEPS.length - 1;
  const pct = ((step + 1) / STEPS.length) * 100;

  const next = () => {
    if (!last) { setStep(n => n + 1); return; }
    if (onLoadExample) onLoadExample(createOnboardingProject());
    close();
  };

  return (
    <div onClick={close} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999 }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:420,background:'linear-gradient(180deg,#1a1a1a,#0d0d0d)',borderRadius:20,border:'1px solid #2a2a2a',boxShadow:'0 40px 100px rgba(0,0,0,0.5)',overflow:'hidden' }}>
        <div style={{ height:3,background:'#1a1a1a' }}>
          <div style={{ height:3,width:`${pct}%`,background:'linear-gradient(90deg,#3b82f6,#8b5cf6)',transition:'width 0.3s' }} />
        </div>
        <div style={{ padding:'24px 24px 12px',textAlign:'center' }}>
          <div style={{ width:48,height:48,margin:'0 auto 8px',background:'#1f1f1f',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid #333' }}>
            <span style={{ fontSize:22 }}>{s.icon}</span>
          </div>
          <div style={{ fontSize:11,color:'#555',marginBottom:4 }}>Step {step+1} / {STEPS.length}</div>
          <h2 style={{ margin:'0 0 4px',fontSize:20,fontWeight:700,color:'#fff' }}>{s.title}</h2>
          <p style={{ margin:0,fontSize:13,color:'#888' }}>{s.subtitle}</p>
        </div>
        <div style={{ padding:'8px 24px 12px',display:'flex',justifyContent:'center' }}>
          <StepIllustration step={step} />
        </div>
        <div style={{ display:'flex',justifyContent:'center',gap:6,padding:'4px 0 12px' }}>
          {STEPS.map((_,i) => <div key={i} style={{ width:i===step?16:6,height:6,borderRadius:3,background:i===step?'#3b82f6':'#333',transition:'all 0.3s' }} />)}
        </div>
        <div style={{ padding:'0 28px 12px' }}>
          {s.tips.map(([k,d],i) => (
            <div key={i} style={{ display:'flex',alignItems:'center',gap:10,padding:'6px 0',borderBottom:i<s.tips.length-1?'1px solid #1a1a1a':'none' }}>
              <span style={{ display:'inline-flex',alignItems:'center',justifyContent:'center',minWidth:28,height:24,padding:'0 6px',background:'#1a1a1a',border:'1px solid #333',borderRadius:6,color:'#ccc',fontSize:12,fontFamily:'monospace',fontWeight:600 }}>{k}</span>
              <span style={{ fontSize:12,color:'#aaa' }}>{d}</span>
            </div>
          ))}
        </div>
        <div style={{ textAlign:'center',paddingBottom:8 }}>
          <label style={{ fontSize:11,color:'#555',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:4 }}>
            <input type="checkbox" checked={skip} onChange={e=>setSkip(e.target.checked)} /> 不再显示
          </label>
        </div>
        <div style={{ display:'flex',justifyContent:'center',gap:12,padding:'8px 24px 20px' }}>
          <button onClick={step===0?close:()=>setStep(n=>n-1)} style={{ padding:'10px 20px',background:'transparent',border:'1px solid #333',borderRadius:10,color:'#888',fontSize:13,cursor:'pointer' }}>
            {step===0?'跳过':'上一步'}
          </button>
          <button onClick={next} style={{ padding:'10px 28px',background:'linear-gradient(135deg,#3b82f6,#2563eb)',border:'none',borderRadius:10,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',boxShadow:'0 4px 12px rgba(59,130,246,0.3)' }}>
            {last?'开始创作 🚀':'下一步'}
          </button>
        </div>
      </div>
    </div>
  );
}
