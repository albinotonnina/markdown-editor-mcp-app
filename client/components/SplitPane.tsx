import { useState, useRef, useEffect, ReactNode } from 'react';

interface SplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  defaultSize?: number; // percentage
}

export function SplitPane({ left, right, defaultSize = 50 }: SplitPaneProps) {
  const [leftWidth, setLeftWidth] = useState(defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Constrain to 20-80%
      if (newLeftWidth >= 20 && newLeftWidth <= 80) {
        setLeftWidth(newLeftWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  return (
    <div
      ref={containerRef}
      className="split-pane"
      style={{ display: 'flex', height: '100%', overflow: 'hidden' }}
    >
      <div
        className="split-pane-left"
        style={{
          width: `${leftWidth}%`,
          overflow: 'auto',
          height: '100%',
        }}
      >
        {left}
      </div>

      <div
        className="split-pane-divider"
        onMouseDown={handleMouseDown}
        style={{
          width: '4px',
          cursor: 'col-resize',
          backgroundColor: isDragging ? '#0078d4' : '#3c3c3c',
          flexShrink: 0,
          transition: isDragging ? 'none' : 'background-color 0.2s',
        }}
      />

      <div
        className="split-pane-right"
        style={{
          flex: 1,
          overflow: 'auto',
          height: '100%',
        }}
      >
        {right}
      </div>
    </div>
  );
}
