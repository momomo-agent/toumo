import { ReactNode } from 'react';
import './EditorLayout.css';

interface EditorLayoutProps {
  preview: ReactNode;
  layers: ReactNode;
  canvas: ReactNode;
  inspector: ReactNode;
}

export function EditorLayout({ preview, layers, canvas, inspector }: EditorLayoutProps) {
  return (
    <div className="editor-layout">
      {/* 左侧：Live Preview */}
      <aside className="editor-preview">
        {preview}
      </aside>
      
      {/* 右侧：编辑区三栏 */}
      <div className="editor-workspace">
        {/* 图层管理器 */}
        <aside className="editor-layers">
          {layers}
        </aside>
        
        {/* 画布 + 交互管理器 */}
        <main className="editor-canvas-area">
          {canvas}
        </main>
        
        {/* Inspector */}
        <aside className="editor-inspector">
          {inspector}
        </aside>
      </div>
    </div>
  );
}
