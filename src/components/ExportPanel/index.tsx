import { useState, useCallback, useMemo } from 'react';
import { useEditorStore } from '../../store';
import {
  generateCSSAnimation,
  generateFramerMotionCode,
  generateSVGCode,
  generateStaticHTML,
} from '../../utils/exportGenerators';

type ExportTab = 'css-animation' | 'framer-motion' | 'svg' | 'html';

const TABS: { id: ExportTab; label: string; icon: string }[] = [
  { id: 'css-animation', label: 'CSS', icon: '🎬' },
  { id: 'framer-motion', label: 'Framer', icon: '⚛️' },
  { id: 'svg', label: 'SVG', icon: '🖼️' },
  { id: 'html', label: 'HTML', icon: '🌐' },
];

interface ExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportPanel({ isOpen, onClose }: ExportPanelProps) {
  const [tab, setTab] = useState<ExportTab>('css-animation');
  const [copied, setCopied] = useState(false);
  const store = useEditorStore();

  const code = useMemo(() => {
    const kfs = store.keyframes;
    const trs = store.transitions;
    const fs = store.frameSize;
    const bg = store.canvasBackground || '#0a0a0a';
    switch (tab) {
      case 'css-animation': return generateCSSAnimation(kfs, trs, fs);
      case 'framer-motion': return generateFramerMotionCode(kfs, trs, fs);
      case 'svg': return generateSVGCode(kfs[0], fs, bg);
      case 'html': return generateStaticHTML(kfs[0], fs, bg);
    }
  }, [tab, store.keyframes, store.transitions, store.frameSize, store.canvasBackground]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  if (!isOpen) return null;

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999 }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width:600,maxHeight:'80vh',background:'#141414',border:'1px solid #2a2a2a',borderRadius:16,overflow:'hidden',display:'flex',flexDirection:'column' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid #1f1f1f' }}>
          <h3 style={{ margin:0,fontSize:16,color:'#fff' }}>导出代码</h3>
          <button onClick={onClose} style={{ background:'none',border:'none',color:'#666',fontSize:18,cursor:'pointer' }}>✕</button>
        </div>
        <div style={{ display:'flex',gap:4,padding:'8px 20px',borderBottom:'1px solid #1f1f1f' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{ padding:'6px 12px',borderRadius:6,border:'none',
                background:tab===t.id?'#2563eb':'transparent',
                color:tab===t.id?'#fff':'#888',fontSize:12,cursor:'pointer' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <div style={{ flex:1,overflow:'auto',padding:16 }}>
          <pre style={{ margin:0,padding:16,background:'#0a0a0a',borderRadius:8,border:'1px solid #1f1f1f',fontSize:12,color:'#e5e5e5',lineHeight:1.6,whiteSpace:'pre-wrap',wordBreak:'break-all',maxHeight:'50vh',overflow:'auto' }}>
            {code}
          </pre>
        </div>
        <div style={{ padding:'12px 20px',borderTop:'1px solid #1f1f1f',display:'flex',justifyContent:'flex-end' }}>
          <button onClick={handleCopy} style={{ padding:'8px 20px',background:copied?'#22c55e':'#2563eb',border:'none',borderRadius:8,color:'#fff',fontSize:13,cursor:'pointer' }}>
            {copied ? '✓ 已复制' : '📋 复制代码'}
          </button>
        </div>
      </div>
    </div>
  );
}
