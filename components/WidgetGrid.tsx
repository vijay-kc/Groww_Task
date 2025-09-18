'use client';

import { useDashboard } from '@/store/dashboard-store';
import { WidgetCard } from './widgets/WidgetCard';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export function WidgetGrid() {
  const { widgets, isEditMode, updateWidgetPosition } = useDashboard();

  const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

  // Clamp positions so nothing overflows
  const clamp = (pos: { x: number; w: number }, maxCols: number) => {
    if (pos.x + pos.w > maxCols) {
      return { ...pos, x: Math.max(0, maxCols - pos.w) };
    }
    return pos;
  };

  const generateLayout = (breakpoint: keyof typeof cols): Layout[] =>
    widgets.map(widget => {
      const { x, w } = clamp(
        { x: widget.position.x, w: widget.position.w },
        cols[breakpoint]
      );

      return {
        i: widget.id,
        x,
        y: widget.position.y,
        w,
        h: widget.position.h,
        minW: widget.type === 'table' ? 4 : widget.type === 'chart' ? 3 : 2,
        minH: widget.type === 'table' ? 3 : widget.type === 'chart' ? 2 : 1,
        maxW: cols[breakpoint], // never exceed grid width
      };
    });

  const layouts = {
    lg: generateLayout('lg'),
    md: generateLayout('md'),
    sm: generateLayout('sm'),
    xs: generateLayout('xs'),
    xxs: generateLayout('xxs'),
  };

  const onLayoutChange = (layout: Layout[]) => {
    if (!isEditMode) return;

    layout.forEach(item => {
      updateWidgetPosition(item.i, {
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
      });
    });
  };

  return (
    <div className={`w-full ${isEditMode ? 'editing' : ''}`}>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={cols}
        rowHeight={100}
        onLayoutChange={onLayoutChange}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        compactType="vertical"
      >
        {widgets.map(widget => (
          <div key={widget.id}>
            <WidgetCard widget={widget} />
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}
