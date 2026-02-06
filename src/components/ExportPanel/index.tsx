import { useState, useCallback } from 'react';
import { useEditorStore } from '../../store';
import type { KeyElement, ShapeStyle } from '../../types';
import './styles.css';

type ExportFormat = 'react' | 'vue' | 'html' | 'swiftui';

interface ExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportPanel({ isOpen, onClose }: ExportPanelProps) {
  const [format, setFormat] = useState<ExportFormat>('react');
  const [copied, setCopied] = useState(false);
  const [styleMode, setStyleMode] = useState<'inline' | 'css'>('inline');

  const { keyframes, selectedKeyframeId, frameSize } = useEditorStore();
  const selectedKeyframe = keyframes.find((kf) => kf.id === selectedKeyframeId);
  const elements = selectedKeyframe?.keyElements || [];

  const handleCopy = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const generatedCode = generateCode(elements, format, styleMode, frameSize);

  if (!isOpen) return null;

  return (
    <div className="export-panel-overlay" onClick={onClose}>
      <div className="export-panel" onClick={(e) => e.stopPropagation()}>
        <div className="export-panel-header">
          <h2>Export Code</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="export-panel-options">
          <div className="format-selector">
            <label>Format:</label>
            <div className="format-buttons">
              {(['react', 'vue', 'html', 'swiftui'] as ExportFormat[]).map((f) => (
                <button
                  key={f}
                  className={`format-btn ${format === f ? 'active' : ''}`}
                  onClick={() => setFormat(f)}
                >
                  {f === 'react' && '⚛️ React'}
                  {f === 'vue' && '💚 Vue'}
                  {f === 'html' && '🌐 HTML/CSS'}
                  {f === 'swiftui' && '🍎 SwiftUI'}
                </button>
              ))}
            </div>
          </div>

          {(format === 'react' || format === 'html') && (
            <div className="style-mode-selector">
              <label>Style Mode:</label>
              <div className="style-buttons">
                <button
                  className={`style-btn ${styleMode === 'inline' ? 'active' : ''}`}
                  onClick={() => setStyleMode('inline')}
                >
                  Inline
                </button>
                <button
                  className={`style-btn ${styleMode === 'css' ? 'active' : ''}`}
                  onClick={() => setStyleMode('css')}
                >
                  CSS Classes
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="export-panel-preview">
          <div className="code-header">
            <span className="code-lang">
              {format === 'react' && 'component.tsx'}
              {format === 'vue' && 'Component.vue'}
              {format === 'html' && 'index.html'}
              {format === 'swiftui' && 'ContentView.swift'}
            </span>
            <button
              className={`copy-btn ${copied ? 'copied' : ''}`}
              onClick={() => handleCopy(generatedCode)}
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
          <pre className="code-preview">
            <code>{generatedCode}</code>
          </pre>
        </div>

        {styleMode === 'css' && (format === 'react' || format === 'html') && (
          <div className="export-panel-preview css-preview">
            <div className="code-header">
              <span className="code-lang">styles.css</span>
              <button
                className="copy-btn"
                onClick={() => handleCopy(generateCSS(elements))}
              >
                📋 Copy CSS
              </button>
            </div>
            <pre className="code-preview">
              <code>{generateCSS(elements)}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions
function generateCode(
  elements: KeyElement[],
  format: ExportFormat,
  styleMode: 'inline' | 'css',
  frameSize: { width: number; height: number }
): string {
  switch (format) {
    case 'react':
      return generateReactCode(elements, styleMode, frameSize);
    case 'vue':
      return generateVueCode(elements, frameSize);
    case 'html':
      return generateHTMLCode(elements, styleMode, frameSize);
    case 'swiftui':
      return generateSwiftUICode(elements, frameSize);
    default:
      return '';
  }
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '').replace(/^[0-9]/, '_$&') || 'Element';
}

function getClassName(element: KeyElement): string {
  return sanitizeName(element.name).toLowerCase().replace(/\s+/g, '-');
}

function styleToInline(style: ShapeStyle | undefined, element: KeyElement): string {
  if (!style) return '';
  
  const styles: string[] = [];
  
  // Position & Size
  styles.push(`position: 'absolute'`);
  styles.push(`left: ${element.position.x}`);
  styles.push(`top: ${element.position.y}`);
  styles.push(`width: ${element.size.width}`);
  styles.push(`height: ${element.size.height}`);
  
  // Background
  if (style.gradientType && style.gradientType !== 'none' && style.gradientStops?.length) {
    const stops = style.gradientStops.map(s => `${s.color} ${s.position}%`).join(', ');
    if (style.gradientType === 'linear') {
      styles.push(`background: 'linear-gradient(${style.gradientAngle || 180}deg, ${stops})'`);
    } else {
      styles.push(`background: 'radial-gradient(circle, ${stops})'`);
    }
  } else if (style.fill) {
    styles.push(`backgroundColor: '${style.fill}'`);
  }
  
  // Opacity
  if (style.fillOpacity !== undefined && style.fillOpacity !== 1) {
    styles.push(`opacity: ${style.fillOpacity}`);
  }
  
  // Border
  if (style.stroke && style.strokeWidth) {
    styles.push(`border: '${style.strokeWidth}px ${style.strokeStyle || 'solid'} ${style.stroke}'`);
  }
  
  // Border Radius
  if (style.borderRadius) {
    styles.push(`borderRadius: ${style.borderRadius}`);
  }
  
  // Shadow
  if (style.shadowBlur || style.shadowOffsetX || style.shadowOffsetY) {
    const x = style.shadowOffsetX || 0;
    const y = style.shadowOffsetY || 0;
    const blur = style.shadowBlur || 0;
    const spread = style.shadowSpread || 0;
    const color = style.shadowColor || 'rgba(0,0,0,0.25)';
    styles.push(`boxShadow: '${x}px ${y}px ${blur}px ${spread}px ${color}'`);
  }
  
  // Text styles
  if (element.shapeType === 'text') {
    if (style.fontSize) styles.push(`fontSize: ${style.fontSize}`);
    if (style.fontWeight) styles.push(`fontWeight: '${style.fontWeight}'`);
    if (style.color || style.textColor) styles.push(`color: '${style.color || style.textColor}'`);
    if (style.textAlign) styles.push(`textAlign: '${style.textAlign}'`);
    if (style.fontFamily) styles.push(`fontFamily: '${style.fontFamily}'`);
    if (style.lineHeight) styles.push(`lineHeight: ${style.lineHeight}`);
    if (style.letterSpacing) styles.push(`letterSpacing: ${style.letterSpacing}`);
  }
  
  // Rotation
  if (style.rotation) {
    styles.push(`transform: 'rotate(${style.rotation}deg)'`);
  }
  
  return styles.join(',\n    ');
}

// Generate React component code
function generateReactCode(
  elements: KeyElement[],
  styleMode: 'inline' | 'css',
  frameSize: { width: number; height: number }
): string {
  const componentName = 'DesignComponent';
  
  const renderElement = (el: KeyElement, indent: string = '      '): string => {
    const className = getClassName(el);
    const isText = el.shapeType === 'text';
    const isImage = el.shapeType === 'image';
    
    if (styleMode === 'css') {
      if (isText) {
        return `${indent}<div className="${className}">${el.text || ''}</div>`;
      }
      if (isImage) {
        return `${indent}<img className="${className}" src="${el.style?.imageSrc || ''}" alt="${el.name}" />`;
      }
      return `${indent}<div className="${className}" />`;
    }
    
    // Inline styles
    const inlineStyle = styleToInline(el.style, el);
    if (isText) {
      return `${indent}<div
${indent}  style={{
${indent}    ${inlineStyle}
${indent}  }}
${indent}>
${indent}  ${el.text || ''}
${indent}</div>`;
    }
    if (isImage) {
      return `${indent}<img
${indent}  src="${el.style?.imageSrc || ''}"
${indent}  alt="${el.name}"
${indent}  style={{
${indent}    ${inlineStyle}
${indent}  }}
${indent}/>`;
    }
    return `${indent}<div
${indent}  style={{
${indent}    ${inlineStyle}
${indent}  }}
${indent}/>`;
  };

  const elementsJSX = elements.map(el => renderElement(el)).join('\n');

  return `import React from 'react';
${styleMode === 'css' ? "import './styles.css';\n" : ''}
export function ${componentName}() {
  return (
    <div
      style={{
        position: 'relative',
        width: ${frameSize.width},
        height: ${frameSize.height},
      }}
    >
${elementsJSX}
    </div>
  );
}
`;
}

// Generate CSS classes
function generateCSS(elements: KeyElement[]): string {
  const cssRules = elements.map(el => {
    const className = getClassName(el);
    const style = el.style;
    const rules: string[] = [];
    
    rules.push(`  position: absolute;`);
    rules.push(`  left: ${el.position.x}px;`);
    rules.push(`  top: ${el.position.y}px;`);
    rules.push(`  width: ${el.size.width}px;`);
    rules.push(`  height: ${el.size.height}px;`);
    
    if (style) {
      if (style.gradientType && style.gradientType !== 'none' && style.gradientStops?.length) {
        const stops = style.gradientStops.map(s => `${s.color} ${s.position}%`).join(', ');
        if (style.gradientType === 'linear') {
          rules.push(`  background: linear-gradient(${style.gradientAngle || 180}deg, ${stops});`);
        } else {
          rules.push(`  background: radial-gradient(circle, ${stops});`);
        }
      } else if (style.fill) {
        rules.push(`  background-color: ${style.fill};`);
      }
      
      if (style.fillOpacity !== undefined && style.fillOpacity !== 1) {
        rules.push(`  opacity: ${style.fillOpacity};`);
      }
      
      if (style.stroke && style.strokeWidth) {
        rules.push(`  border: ${style.strokeWidth}px ${style.strokeStyle || 'solid'} ${style.stroke};`);
      }
      
      if (style.borderRadius) {
        rules.push(`  border-radius: ${style.borderRadius}px;`);
      }
      
      if (style.shadowBlur || style.shadowOffsetX || style.shadowOffsetY) {
        const x = style.shadowOffsetX || 0;
        const y = style.shadowOffsetY || 0;
        const blur = style.shadowBlur || 0;
        const spread = style.shadowSpread || 0;
        const color = style.shadowColor || 'rgba(0,0,0,0.25)';
        rules.push(`  box-shadow: ${x}px ${y}px ${blur}px ${spread}px ${color};`);
      }
      
      if (el.shapeType === 'text') {
        if (style.fontSize) rules.push(`  font-size: ${style.fontSize}px;`);
        if (style.fontWeight) rules.push(`  font-weight: ${style.fontWeight};`);
        if (style.color || style.textColor) rules.push(`  color: ${style.color || style.textColor};`);
        if (style.textAlign) rules.push(`  text-align: ${style.textAlign};`);
        if (style.fontFamily) rules.push(`  font-family: ${style.fontFamily};`);
      }
      
      if (style.rotation) {
        rules.push(`  transform: rotate(${style.rotation}deg);`);
      }
    }
    
    return `.${className} {\n${rules.join('\n')}\n}`;
  });
  
  return cssRules.join('\n\n');
}

// Generate Vue component code
function generateVueCode(
  elements: KeyElement[],
  frameSize: { width: number; height: number }
): string {
  const renderElement = (el: KeyElement): string => {
    const className = getClassName(el);
    const isText = el.shapeType === 'text';
    const isImage = el.shapeType === 'image';
    
    if (isText) {
      return `    <div class="${className}">${el.text || ''}</div>`;
    }
    if (isImage) {
      return `    <img class="${className}" src="${el.style?.imageSrc || ''}" alt="${el.name}" />`;
    }
    return `    <div class="${className}" />`;
  };

  const elementsHTML = elements.map(el => renderElement(el)).join('\n');
  const css = generateCSS(elements);

  return `<template>
  <div class="design-container">
${elementsHTML}
  </div>
</template>

<script setup lang="ts">
// Component logic here
</script>

<style scoped>
.design-container {
  position: relative;
  width: ${frameSize.width}px;
  height: ${frameSize.height}px;
}

${css}
</style>
`;
}

// Generate HTML/CSS code
function generateHTMLCode(
  elements: KeyElement[],
  styleMode: 'inline' | 'css',
  frameSize: { width: number; height: number }
): string {
  const renderElement = (el: KeyElement): string => {
    const className = getClassName(el);
    const isText = el.shapeType === 'text';
    const isImage = el.shapeType === 'image';
    
    if (styleMode === 'css') {
      if (isText) {
        return `    <div class="${className}">${el.text || ''}</div>`;
      }
      if (isImage) {
        return `    <img class="${className}" src="${el.style?.imageSrc || ''}" alt="${el.name}">`;
      }
      return `    <div class="${className}"></div>`;
    }
    
    // Inline styles
    const inlineCSS = styleToCSS(el.style, el);
    if (isText) {
      return `    <div style="${inlineCSS}">${el.text || ''}</div>`;
    }
    if (isImage) {
      return `    <img src="${el.style?.imageSrc || ''}" alt="${el.name}" style="${inlineCSS}">`;
    }
    return `    <div style="${inlineCSS}"></div>`;
  };

  const elementsHTML = elements.map(el => renderElement(el)).join('\n');

  if (styleMode === 'css') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Design Export</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="design-container">
${elementsHTML}
  </div>
</body>
</html>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Design Export</title>
  <style>
    .design-container {
      position: relative;
      width: ${frameSize.width}px;
      height: ${frameSize.height}px;
    }
  </style>
</head>
<body>
  <div class="design-container">
${elementsHTML}
  </div>
</body>
</html>`;
}

// Convert style to inline CSS string
function styleToCSS(style: ShapeStyle | undefined, element: KeyElement): string {
  if (!style) return '';
  
  const rules: string[] = [];
  
  rules.push(`position: absolute`);
  rules.push(`left: ${element.position.x}px`);
  rules.push(`top: ${element.position.y}px`);
  rules.push(`width: ${element.size.width}px`);
  rules.push(`height: ${element.size.height}px`);
  
  if (style.fill) {
    rules.push(`background-color: ${style.fill}`);
  }
  
  if (style.borderRadius) {
    rules.push(`border-radius: ${style.borderRadius}px`);
  }
  
  if (style.stroke && style.strokeWidth) {
    rules.push(`border: ${style.strokeWidth}px solid ${style.stroke}`);
  }
  
  if (element.shapeType === 'text') {
    if (style.fontSize) rules.push(`font-size: ${style.fontSize}px`);
    if (style.color || style.textColor) rules.push(`color: ${style.color || style.textColor}`);
  }
  
  return rules.join('; ');
}

// Generate SwiftUI code
function generateSwiftUICode(
  elements: KeyElement[],
  frameSize: { width: number; height: number }
): string {
  const hexToSwiftUIColor = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return `Color(red: ${r.toFixed(3)}, green: ${g.toFixed(3)}, blue: ${b.toFixed(3)})`;
  };

  const renderElement = (el: KeyElement): string => {
    const style = el.style;
    const isText = el.shapeType === 'text';
    const isEllipse = el.shapeType === 'ellipse';
    const isImage = el.shapeType === 'image';
    
    let view = '';
    
    if (isText) {
      view = `Text("${el.text || ''}")`;
      if (style?.fontSize) view += `\n                .font(.system(size: ${style.fontSize}))`;
      if (style?.fontWeight === 'bold') view += `\n                .fontWeight(.bold)`;
      if (style?.color || style?.textColor) {
        view += `\n                .foregroundColor(${hexToSwiftUIColor(style.color || style.textColor || '#000000')})`;
      }
    } else if (isImage) {
      view = `Image("placeholder")\n                .resizable()\n                .aspectRatio(contentMode: .fill)`;
    } else if (isEllipse) {
      view = `Ellipse()`;
      if (style?.fill) view += `\n                .fill(${hexToSwiftUIColor(style.fill)})`;
    } else {
      view = `RoundedRectangle(cornerRadius: ${style?.borderRadius || 0})`;
      if (style?.fill) view += `\n                .fill(${hexToSwiftUIColor(style.fill)})`;
    }
    
    // Add frame
    view += `\n                .frame(width: ${el.size.width}, height: ${el.size.height})`;
    
    // Add position
    view += `\n                .position(x: ${el.position.x + el.size.width / 2}, y: ${el.position.y + el.size.height / 2})`;
    
    // Add stroke if present
    if (style?.stroke && style?.strokeWidth && !isText) {
      view += `\n                .overlay(`;
      if (isEllipse) {
        view += `\n                    Ellipse().stroke(${hexToSwiftUIColor(style.stroke)}, lineWidth: ${style.strokeWidth})`;
      } else {
        view += `\n                    RoundedRectangle(cornerRadius: ${style?.borderRadius || 0}).stroke(${hexToSwiftUIColor(style.stroke)}, lineWidth: ${style.strokeWidth})`;
      }
      view += `\n                )`;
    }
    
    return `            ${view}`;
  };

  const elementsSwift = elements.map(el => renderElement(el)).join('\n\n');

  return `import SwiftUI

struct ContentView: View {
    var body: some View {
        ZStack {
${elementsSwift}
        }
        .frame(width: ${frameSize.width}, height: ${frameSize.height})
    }
}

#Preview {
    ContentView()
}
`;
}
