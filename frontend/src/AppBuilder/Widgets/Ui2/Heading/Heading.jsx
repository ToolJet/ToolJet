import React, { useLayoutEffect, useRef, useState } from 'react';
import { useAutoHeight } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { clampLines, typeClasses } from '@/AppBuilder/Widgets/Ui2/_shared/looks/typeLook';
import { fitsContentInView } from '@/AppBuilder/_helpers/dynamicHeightPolicy';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { textAlign } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { useTextActions } from '@/AppBuilder/Widgets/Ui2/_shared/textActions';

const HEADING = {
  h1: 'scroll-m-20 text-4xl font-extrabold tracking-tight',
  h2: 'scroll-m-20 text-3xl font-semibold tracking-tight',
  h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
  h4: 'scroll-m-20 text-xl font-semibold tracking-tight',
};

export const ShadHeading = (props) => {
  const ref = useRef(null);
  const tagRef = useRef(null);
  useAutoHeight(props, ref);
  const { properties, handlers, clickable } = useTextActions(props);
  const level = HEADING[properties.level] ? properties.level : 'h2';
  const Tag = level;
  // A heading of fixed height shows the whole lines that fit and ends in an ellipsis (the full text on hover): a long
  // bound title wrapped past its box and covered whatever sat under it. One that grows with its content is not clamped.
  const fixed = !fitsContentInView(props.componentType, properties);
  const [lines, setLines] = useState(null);
  const text = String(properties.text ?? '');
  useLayoutEffect(() => {
    if (!fixed || !tagRef.current) return setLines(null);
    const lineHeight = parseFloat(window.getComputedStyle(tagRef.current).lineHeight);
    setLines(clampLines(props.height, lineHeight));
  }, [fixed, props.height, level, text, props.styles?.fontSize?.value]);
  const clamped = lines
    ? { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: lines, overflow: 'hidden' }
    : {};
  return (
    <Shell {...props} innerRef={ref}>
      <Tag
        {...handlers}
        ref={tagRef}
        title={lines ? text : undefined}
        className={cn(
          HEADING[level],
          'text-[color:var(--lk-fg,var(--sc-foreground))]',
          typeClasses(props.styles),
          clickable && 'cursor-pointer'
        )}
        style={{ textAlign: textAlign(props.styles), ...clamped }}
      >
        {String(properties.text ?? '')}
      </Tag>
    </Shell>
  );
};
