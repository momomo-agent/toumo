/**
 * exportPrototype.ts
 * Generates a standalone interactive HTML prototype from Toumo project data.
 * The output is a single HTML file with no external dependencies.
 */

import type { Keyframe, Transition, Interaction, Variable, Size } from '../types';

export interface ExportOptions {
  projectName?: string;
  canvasBackground?: string;
  frameSize: Size;
  keyframes: Keyframe[];
  transitions: Transition[];
  interactions: Interaction[];
  variables: Variable[];
}

/**
 * Strip large binary data (images > threshold) to keep file small.
 * Keeps small data URIs, replaces large ones with a placeholder color.
 */
function stripLargeImages(keyframes: Keyframe[], maxBytes = 50000): Keyframe[] {
  return keyframes.map(kf => ({
    ...kf,
    keyElements: kf.keyElements.map(el => {
      if (el.style?.imageSrc && el.style.imageSrc.length > maxBytes) {
        return {
          ...el,
          style: { ...el.style, imageSrc: undefined, fill: el.style.fill || '#333' },
        };
      }
      return el;
    }),
  }));
}

/**
 * Main export function — returns a complete standalone HTML string.
 */
export function exportPrototype(options: ExportOptions): string {
  const {
    projectName = 'Toumo Prototype',
    canvasBackground = '#0d0d0e',
    frameSize,
    keyframes: rawKeyframes,
    transitions,
    interactions,
    variables,
  } = options;

  // Strip large images to keep file size down
  const keyframes = stripLargeImages(rawKeyframes);

  // Serialize project data as JSON
  const projectJSON = JSON.stringify({
    keyframes,
    transitions,
    interactions,
    variables,
    frameSize,
    canvasBackground,
  });

  // Build the HTML
  return buildHTML(projectName, projectJSON, frameSize, canvasBackground);
}

function buildHTML(
  title: string,
  projectJSON: string,
  frameSize: Size,
  canvasBackground: string,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no">
<title>${escapeHtml(title)}</title>
${buildCSS(frameSize, canvasBackground)}
</head>
<body>
<div id="app">
  <div id="device-frame">
    <div id="notch"></div>
    <div id="canvas"></div>
  </div>
  <div id="controls">
    <span id="state-name"></span>
    <button id="btn-reset" title="Reset">↺</button>
  </div>
  <div id="branding">Made with <span style="color:#2563eb">Toumo</span></div>
</div>
<script>
${buildRuntime(projectJSON)}
</script>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// --- CSS builder ---
function buildCSS(frameSize: Size, canvasBackground: string): string {
  return `<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:#0a0a0b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
#app{width:100%;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column}
#device-frame{
  position:relative;
  width:${frameSize.width + 24}px;
  height:${frameSize.height + 24}px;
  border-radius:55px;
  background:#1a1a1a;
  border:2px solid rgba(255,255,255,0.12);
  padding:12px;
  box-shadow:0 8px 32px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.06);
  transform-origin:center;
}
#notch{
  position:absolute;top:10px;left:50%;transform:translateX(-50%);
  width:120px;height:36px;border-radius:18px;background:#000;z-index:100;
}
#canvas{
  width:${frameSize.width}px;
  height:${frameSize.height}px;
  background:${canvasBackground};
  border-radius:43px;
  position:relative;
  overflow:hidden;
}
.el{position:absolute;transition:all .3s ease-out;cursor:default}
.el.interactive{cursor:pointer}
.el img{width:100%;height:100%;object-fit:cover;pointer-events:none;display:block}
.el .text{white-space:pre-wrap;word-break:break-word}
#controls{
  position:fixed;bottom:20px;left:50%;transform:translateX(-50%);
  display:flex;align-items:center;gap:10px;
  background:rgba(30,30,32,0.95);backdrop-filter:blur(12px);
  border-radius:14px;padding:8px 18px;
  border:1px solid rgba(255,255,255,0.1);
  box-shadow:0 8px 32px rgba(0,0,0,0.4);
  opacity:1;transition:opacity .3s ease;z-index:1000;
}
#state-name{color:#fff;font-weight:600;font-size:13px;white-space:nowrap}
#btn-reset{
  background:rgba(255,255,255,0.08);color:#ccc;
  border:1px solid rgba(255,255,255,0.12);
  border-radius:8px;padding:5px 12px;font-size:12px;cursor:pointer;
}
#btn-reset:hover{background:rgba(255,255,255,0.15)}
#branding{
  position:fixed;bottom:6px;right:14px;
  color:rgba(255,255,255,0.2);font-size:11px;z-index:1000;
}
</style>`;
}

// --- Runtime JS builder ---
function buildRuntime(projectJSON: string): string {
  // Escape the JSON for embedding in a script tag
  const safeJSON = projectJSON.replace(/<\//g, '<\\/').replace(/<!--/g, '<\\!--');

  return `(function(){
"use strict";

// ── Project Data ──
var P = ${safeJSON};
var keyframes = P.keyframes;
var transitions = P.transitions;
var interactions = P.interactions || [];
var variables = P.variables || [];
var frameSize = P.frameSize;
var canvasBg = P.canvasBackground || '#0d0d0e';

// ── State ──
var currentKfId = keyframes[0] ? keyframes[0].id : '';
var isTransitioning = false;
var varValues = {};
variables.forEach(function(v){ varValues[v.id] = v.defaultValue; });

// ── DOM refs ──
var canvas = document.getElementById('canvas');
var stateName = document.getElementById('state-name');
var btnReset = document.getElementById('btn-reset');
var deviceFrame = document.getElementById('device-frame');

// ── Responsive scaling ──
function updateScale(){
  var fw = frameSize.width + 24;
  var fh = frameSize.height + 24;
  var s = Math.min(window.innerWidth * 0.92 / fw, window.innerHeight * 0.88 / fh, 1);
  deviceFrame.style.transform = 'scale(' + s + ')';
}
updateScale();
window.addEventListener('resize', updateScale);

// ── Easing map ──
var easings = {
  'linear':'linear','ease':'ease','ease-in':'ease-in','ease-out':'ease-out',
  'ease-in-out':'ease-in-out','spring':'cubic-bezier(0.175,0.885,0.32,1.275)',
  'spring-gentle':'cubic-bezier(0.34,1.56,0.64,1)',
  'spring-bouncy':'cubic-bezier(0.68,-0.55,0.265,1.55)'
};
function getEasing(t){
  if(t.cubicBezier){var c=t.cubicBezier;return 'cubic-bezier('+c[0]+','+c[1]+','+c[2]+','+c[3]+')';}
  return easings[t.curve]||t.curve||'ease-out';
}

// ── Render current keyframe ──
function render(){
  var kf = keyframes.find(function(k){return k.id===currentKfId;});
  if(!kf) return;
  stateName.textContent = kf.name || 'Preview';
  canvas.innerHTML = '';
  var els = kf.keyElements || [];
  // Sort by zIndex
  els = els.slice().sort(function(a,b){return (a.zIndex||0)-(b.zIndex||0);});
  els.forEach(function(el){
    if(el.visible === false) return;
    var div = document.createElement('div');
    div.className = 'el';
    div.dataset.id = el.id;
    var s = el.style || {};
    // Position & size
    div.style.left = el.position.x + 'px';
    div.style.top = el.position.y + 'px';
    div.style.width = el.size.width + 'px';
    div.style.height = el.size.height + 'px';
    // Visual properties
    div.style.opacity = s.opacity != null ? s.opacity : 1;
    div.style.borderRadius = (s.borderRadius||0) + 'px';
    // Fill (gradient or solid)
    if(s.gradientType && s.gradientType !== 'none' && s.gradientStops && s.gradientStops.length >= 2){
      var stops = s.gradientStops.map(function(gs){return gs.color+' '+(gs.position*100)+'%';}).join(',');
      if(s.gradientType==='radial'){
        div.style.background='radial-gradient(circle,'+stops+')';
      } else {
        div.style.background='linear-gradient('+(s.gradientAngle||0)+'deg,'+stops+')';
      }
    } else {
      var fill = s.fill || 'transparent';
      div.style.backgroundColor = fill;
      if(s.fillOpacity != null && s.fillOpacity < 1 && fill !== 'transparent'){
        div.style.opacity = (s.opacity != null ? s.opacity : 1) * s.fillOpacity;
      }
    }
    // Overflow
    div.style.overflow = s.overflow || 'hidden';
    // Rotation & transforms
    var transforms = [];
    if(s.rotation) transforms.push('rotate('+s.rotation+'deg)');
    if(s.scale && s.scale !== 1) transforms.push('scale('+s.scale+')');
    if(s.skewX) transforms.push('skewX('+s.skewX+'deg)');
    if(s.skewY) transforms.push('skewY('+s.skewY+'deg)');
    if(transforms.length) div.style.transform = transforms.join(' ');
    // Shadow
    if(s.shadowColor && s.shadowBlur){
      div.style.boxShadow=(s.shadowX||0)+'px '+(s.shadowY||0)+'px '+s.shadowBlur+'px '+(s.shadowSpread||0)+'px '+s.shadowColor;
    }
    // Border
    if(s.stroke && s.strokeWidth){
      div.style.border=s.strokeWidth+'px solid '+s.stroke;
    }
    // Filters
    var filters = [];
    if(s.blur) filters.push('blur('+s.blur+'px)');
    if(s.brightness != null && s.brightness !== 1) filters.push('brightness('+s.brightness+')');
    if(s.contrast != null && s.contrast !== 1) filters.push('contrast('+s.contrast+')');
    if(s.saturate != null && s.saturate !== 1) filters.push('saturate('+s.saturate+')');
    if(s.hueRotate) filters.push('hue-rotate('+s.hueRotate+'deg)');
    if(s.grayscale) filters.push('grayscale('+s.grayscale+')');
    if(filters.length) div.style.filter = filters.join(' ');
    // Backdrop blur
    if(s.backdropBlur) div.style.backdropFilter = 'blur('+s.backdropBlur+'px)';
    // Image
    if(el.shapeType==='image' || s.imageSrc){
      if(s.imageSrc){
        var img = document.createElement('img');
        img.src = s.imageSrc;
        img.alt = el.name || '';
        img.style.objectFit = s.objectFit || 'cover';
        img.draggable = false;
        div.appendChild(img);
      }
    }
    // Text
    var isText = el.shapeType==='text' || (el.text != null && el.text !== '');
    if(isText){
      var txt = document.createElement('div');
      txt.className = 'text';
      txt.style.fontSize = (s.fontSize||16)+'px';
      txt.style.color = s.color || '#000';
      if(s.fontWeight) txt.style.fontWeight = s.fontWeight;
      if(s.textAlign) txt.style.textAlign = s.textAlign;
      if(s.fontFamily) txt.style.fontFamily = s.fontFamily;
      if(s.letterSpacing) txt.style.letterSpacing = s.letterSpacing+'px';
      if(s.lineHeight) txt.style.lineHeight = s.lineHeight;
      if(s.fontStyle) txt.style.fontStyle = s.fontStyle;
      if(s.textDecoration) txt.style.textDecoration = s.textDecoration;
      txt.style.padding = (s.padding != null ? s.padding : 4) + 'px';
      txt.textContent = el.text || el.name || '';
      div.appendChild(txt);
    }
    // Prototype link interactivity
    var hasLink = el.prototypeLink && el.prototypeLink.enabled && el.prototypeLink.targetFrameId;
    // Check if element has interactions
    var hasInteraction = interactions.some(function(i){return i.elementId===el.id && i.enabled;});
    if(hasLink || hasInteraction) div.classList.add('interactive');
    // Tap on prototype link
    if(hasLink){
      div.addEventListener('click', function(e){
        e.stopPropagation();
        navigateTo(el.prototypeLink.targetFrameId, el.prototypeLink.transition);
      });
    }
    // Interaction handlers
    if(hasInteraction){
      bindInteractions(div, el.id);
    }
    canvas.appendChild(div);
  });
  // Setup transition triggers (canvas-level tap/hover/drag)
  setupTransitionTriggers();
}

// ── Navigation (prototype links) ──
var navHistory = [];
function navigateTo(targetId, transition){
  if(isTransitioning) return;
  if(targetId === 'back'){
    targetId = navHistory.pop();
    if(!targetId) return;
  } else {
    navHistory.push(currentKfId);
  }
  if(!keyframes.find(function(k){return k.id===targetId;})) return;
  var dur = (transition && transition.duration) || 300;
  var type = (transition && transition.type) || 'dissolve';
  isTransitioning = true;
  if(type === 'instant'){
    currentKfId = targetId;
    render();
    isTransitioning = false;
    return;
  }
  // Dissolve animation
  canvas.style.transition = 'opacity '+dur+'ms ease-out';
  canvas.style.opacity = '0';
  setTimeout(function(){
    currentKfId = targetId;
    render();
    canvas.style.opacity = '1';
    setTimeout(function(){ isTransitioning = false; canvas.style.transition = ''; }, dur);
  }, dur / 2);
}

// ── Transition triggers (keyframe-level) ──
var canvasClickHandler = null;
var canvasHoverHandler = null;
function setupTransitionTriggers(){
  // Remove old handlers
  if(canvasClickHandler){ canvas.removeEventListener('click', canvasClickHandler); canvasClickHandler = null; }
  if(canvasHoverHandler){ canvas.removeEventListener('mouseenter', canvasHoverHandler); canvasHoverHandler = null; }
  var avail = transitions.filter(function(t){return t.from === currentKfId;});
  avail.forEach(function(t){
    var trigger = t.trigger;
    if(t.triggers && t.triggers.length) trigger = t.triggers[0].type;
    if(trigger === 'tap'){
      canvasClickHandler = function(){ executeTransition(t); };
      canvas.addEventListener('click', canvasClickHandler);
    }
    if(trigger === 'hover'){
      canvasHoverHandler = function(){ executeTransition(t); };
      canvas.addEventListener('mouseenter', canvasHoverHandler);
    }
    if(trigger === 'timer'){
      var delay = 1000;
      if(t.triggers && t.triggers.length){
        var tt = t.triggers.find(function(tr){return tr.type==='timer';});
        if(tt && tt.timerDelay) delay = tt.timerDelay;
      }
      setTimeout(function(){ executeTransition(t); }, delay);
    }
  });
}

function executeTransition(t){
  if(isTransitioning) return;
  isTransitioning = true;
  var dur = t.duration || 300;
  var easing = getEasing(t);
  // Update transition timing on all elements
  var elDivs = canvas.querySelectorAll('.el');
  elDivs.forEach(function(d){ d.style.transition = 'all '+dur+'ms '+easing; });
  setTimeout(function(){
    currentKfId = t.to;
    render();
    setTimeout(function(){ isTransitioning = false; }, dur);
  }, t.delay || 0);
}

// ── Interaction binding ──
function bindInteractions(div, elementId){
  var elInteractions = interactions.filter(function(i){
    return i.elementId === elementId && i.enabled;
  });
  elInteractions.forEach(function(inter){
    var gesture = inter.gesture;
    if(!gesture) return;
    if(gesture.type === 'tap'){
      div.addEventListener('click', function(e){
        e.stopPropagation();
        runActions(inter.actions);
      });
    }
    if(gesture.type === 'hover' || gesture.type === 'hoverEnter'){
      div.addEventListener('mouseenter', function(){
        runActions(inter.actions);
      });
    }
    if(gesture.type === 'hoverLeave'){
      div.addEventListener('mouseleave', function(){
        runActions(inter.actions);
      });
    }
    if(gesture.type === 'press'){
      div.addEventListener('mousedown', function(){
        runActions(inter.actions);
      });
      div.addEventListener('touchstart', function(){
        runActions(inter.actions);
      });
    }
    if(gesture.type === 'release'){
      div.addEventListener('mouseup', function(){
        runActions(inter.actions);
      });
      div.addEventListener('touchend', function(){
        runActions(inter.actions);
      });
    }
    if(gesture.type === 'longPress'){
      var timer = null;
      var delay = gesture.duration || 500;
      div.addEventListener('mousedown', function(){
        timer = setTimeout(function(){ runActions(inter.actions); }, delay);
      });
      div.addEventListener('mouseup', function(){ clearTimeout(timer); });
      div.addEventListener('mouseleave', function(){ clearTimeout(timer); });
      div.addEventListener('touchstart', function(){
        timer = setTimeout(function(){ runActions(inter.actions); }, delay);
      });
      div.addEventListener('touchend', function(){ clearTimeout(timer); });
    }
  });
}

// ── Run interaction actions ──
function runActions(actions){
  if(!actions) return;
  actions.forEach(function(action){
    if(action.type === 'navigate' && action.targetFrameId){
      navigateTo(action.targetFrameId, action.animation ? {type:'dissolve',duration:action.animation.duration||300} : null);
    }
    if(action.type === 'goToState' && action.targetStateId){
      // goToState = navigate to a keyframe
      var kf = keyframes.find(function(k){return k.id === action.targetStateId;});
      if(kf){
        navigateTo(kf.id, action.animation ? {type:'dissolve',duration:action.animation.duration||300} : null);
      }
    }
    if(action.type === 'setVariable' && action.variableId){
      var op = action.variableOperation || 'set';
      if(op === 'set') varValues[action.variableId] = action.variableValue;
      else if(op === 'toggle') varValues[action.variableId] = !varValues[action.variableId];
      else if(op === 'increment') varValues[action.variableId] = (Number(varValues[action.variableId])||0) + (Number(action.variableValue)||1);
      else if(op === 'decrement') varValues[action.variableId] = (Number(varValues[action.variableId])||0) - (Number(action.variableValue)||1);
    }
    if(action.type === 'openUrl' && action.url){
      window.open(action.url, action.openInNewTab ? '_blank' : '_self');
    }
  });
}

// ── Reset ──
btnReset.addEventListener('click', function(){
  currentKfId = keyframes[0] ? keyframes[0].id : '';
  navHistory = [];
  variables.forEach(function(v){ varValues[v.id] = v.defaultValue; });
  isTransitioning = false;
  canvas.style.transition = '';
  canvas.style.opacity = '1';
  render();
});

// ── Auto-hide controls ──
var controlsEl = document.getElementById('controls');
var hideTimer = setTimeout(function(){ controlsEl.style.opacity = '0'; }, 4000);
document.addEventListener('mousemove', function(){
  controlsEl.style.opacity = '1';
  clearTimeout(hideTimer);
  hideTimer = setTimeout(function(){ controlsEl.style.opacity = '0'; }, 4000);
});

// ── Init ──
render();

})();`;
}

/**
 * Download the exported HTML as a file.
 */
export function downloadPrototype(html: string, filename = 'prototype.html'): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate a data URI from the HTML (for sharing as a link).
 */
export function htmlToDataUri(html: string): string {
  return 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
}
