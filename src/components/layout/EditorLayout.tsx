import type { ReactNode } from 'react';
import './EditorLayout.css';

interface Props {
  preview: ReactNode;
  layers: ReactNode;
  canvas: ReactNode;
  inspector: ReactNode;
}

export function EditorLayout({ preview, layers, canvas, inspector }: Props) {
  return (
    <div className="editor-layout">
      <aside className="editor-preview">{preview}</aside>
      <div className="editor-workspace">
        <aside className="editor-layers">{layers}</aside>
        <main className="editor-canvas-area">{canvas}</main>
        <aside className="editor-inspector">{inspector}</aside>
      </div>
    </div>
  );
}
