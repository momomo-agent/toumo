type AlignmentLine = {
  type: 'vertical' | 'horizontal';
  position: number;
};

interface AlignmentGuidesProps {
  lines: AlignmentLine[];
  canvasWidth: number;
  canvasHeight: number;
}

export function AlignmentGuides({ lines, canvasWidth, canvasHeight }: AlignmentGuidesProps) {
  return (
    <>
      {lines.map((line, index) => (
        <div
          key={`${line.type}-${index}-${line.position}`}
          style={{
            position: 'absolute',
            background: '#f43f5e',
            pointerEvents: 'none',
            ...(line.type === 'vertical'
              ? { left: line.position, top: 0, width: 1, height: canvasHeight }
              : { top: line.position, left: 0, width: canvasWidth, height: 1 }),
          }}
        />
      ))}
    </>
  );
}

export type { AlignmentLine };
