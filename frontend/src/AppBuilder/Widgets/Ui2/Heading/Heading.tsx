import React, { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { useAutoHeight, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { clampLines, typeClasses } from '@/AppBuilder/Widgets/Ui2/_shared/looks/typeLook';
import { fitsContentInView } from '@/AppBuilder/_helpers/dynamicHeightPolicy';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { textAlign } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { useTextActions } from '@/AppBuilder/Widgets/Ui2/_shared/textActions';
import { own } from '@/AppBuilder/Widgets/Ui2/_shared/values';

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4';

const HEADING: Record<string, string> = {
  h1: 'tw-scroll-m-20 tw-text-4xl tw-font-extrabold tw-tracking-tight',
  h2: 'tw-scroll-m-20 tw-text-3xl tw-font-semibold tw-tracking-tight',
  h3: 'tw-scroll-m-20 tw-text-2xl tw-font-semibold tw-tracking-tight',
  h4: 'tw-scroll-m-20 tw-text-ui2-xl tw-font-semibold tw-tracking-tight',
};

export const ShadHeading = (props: WidgetProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLHeadingElement>(null);
  useAutoHeight(props, ref);
  const { properties, handlers, clickable } = useTextActions(props);
  // An own key only: 'constructor' or 'toString' found an Object method and rendered as a tag, crashing the widget.
  const level: HeadingLevel = own(HEADING, properties.level) ? properties.level : 'h2';
  const Tag = level;
  // A heading of fixed height shows the whole lines that fit and ends in an ellipsis (the full text on hover): a long
  // bound title wrapped past its box and covered whatever sat under it. One that grows with its content is not clamped.
  const fixed = !fitsContentInView(props.componentType, properties);
  const [lines, setLines] = useState<number | null>(null);
  const text = String(properties.text ?? '');
  useLayoutEffect(() => {
    if (!fixed || !tagRef.current) return setLines(null);
    const lineHeight = parseFloat(window.getComputedStyle(tagRef.current).lineHeight);
    setLines(clampLines(props.height, lineHeight));
  }, [fixed, props.height, level, text, props.styles?.fontSize?.value]);
  const clamped: CSSProperties = lines
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
          'tw-text-[color:var(--lk-fg,var(--sc-foreground))]',
          typeClasses(props.styles),
          // A custom font size takes a line height in proportion: the level's is fixed in px (an h2's 36px), and an h2
          // at 64px drew its wrapped lines over each other.
          typeClasses(props.styles).includes('lk-size') && 'tw-leading-[1.2]',
          clickable && 'tw-cursor-pointer'
        )}
        style={{ textAlign: textAlign(props.styles), ...clamped }}
      >
        {String(properties.text ?? '')}
      </Tag>
    </Shell>
  );
};

export default withControlState(ShadHeading);
