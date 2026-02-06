import GIF from 'gif.js';

export interface GifExportOptions {
  width: number;
  height: number;
  fps: number;
  quality: number; // 1-30, lower = better
}

export function createGifEncoder(options: GifExportOptions): GIF {
  return new GIF({
    workers: 2,
    quality: options.quality,
    width: options.width,
    height: options.height,
    workerScript: '/gif.worker.js',
    repeat: 0, // loop forever
  });
}

export function addFrameToGif(
  gif: GIF,
  canvas: HTMLCanvasElement,
  delay: number,
) {
  gif.addFrame(canvas, { delay, copy: true });
}

export function renderGif(
  gif: GIF,
  onProgress: (percent: number) => void,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    gif.on('progress', onProgress);
    gif.on('finished', (blob: Blob) => resolve(blob));
    gif.on('abort', () => reject(new Error('GIF encoding aborted')));
    gif.render();
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
