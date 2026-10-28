import React, { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { cn } from '../lib/cn';
import {
  CASE_LABELS,
  CASE_VALUES,
  FONT_LABELS,
  FONT_VALUES,
  WEIGHT_LABELS,
  WEIGHT_VALUES,
  typeStyle,
} from '../lib/ui2/display/type';
import { HeadingSkel, LoadingBox, LoadingFrame, useLoadingLook } from '../lib/ui2/loading/look';
import { TOKEN, useBlankNumber, useThemeColor } from '../lib/styleDefaults';
import '../styles/ui2-display.css';

const LEVELS = ['h1', 'h2', 'h3', 'h4'];

export const Heading = () => {
  const [text, setText] = ToolJet.useStateString({ name: 'text', label: 'Text', initialValue: 'Heading' });
  const [level] = ToolJet.useStateEnumeration({
    name: 'level',
    label: 'Level',
    enumDefinition: ['h1', 'h2', 'h3', 'h4'],
    enumLabels: { h1: 'H1', h2: 'H2', h3: 'H3', h4: 'H4' },
    initialValue: 'h2',
    inspector: 'switch',
  });
  const onClick = ToolJet.useEventCallback({ name: 'onClick' });
  const onHover = ToolJet.useEventCallback({ name: 'onHover' });
  const textColor = useThemeColor('textColor', 'Heading color', TOKEN.text);
  const textAlign = ToolJet.useStyleEnumeration({
    name: 'textAlign',
    label: 'Text alignment (left, center, right)',
    enumDefinition: ['left', 'center', 'right'],
    initialValue: 'left',
    inspector: 'switch',
  });
  const fontFamily = ToolJet.useStyleEnumeration({
    name: 'fontFamily',
    label: 'Typeface',
    enumDefinition: FONT_VALUES,
    enumLabels: FONT_LABELS,
    initialValue: 'theme',
  });
  const fontWeight = ToolJet.useStyleEnumeration({
    name: 'fontWeight',
    label: 'Weight',
    enumDefinition: WEIGHT_VALUES,
    enumLabels: WEIGHT_LABELS,
    initialValue: '',
  });
  const letterSpacing = ToolJet.useStyleString({
    name: 'letterSpacing',
    label: 'Letter spacing (px, or em like 0.12em)',
    initialValue: '',
  });
  const textTransform = ToolJet.useStyleEnumeration({
    name: 'textTransform',
    label: 'Casing',
    enumDefinition: CASE_VALUES,
    enumLabels: CASE_LABELS,
    initialValue: 'none',
  });
  const fontSize = useBlankNumber('fontSize', 'Font size (px; default from the level)', 'From the level');
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ role: 'heading', fit: true, loading: 'own', defaultWidth: 16, defaultHeight: 4 });

  ToolJet.useAction(
    {
      name: 'setText',
      displayName: 'Set text',
      params: [{ handle: 'text', displayName: 'Text', defaultValue: 'New text' }],
    },
    (t) => setText(t === null || t === undefined || typeof t === 'object' ? '' : String(t))
  );
  ToolJet.useAction({ name: 'clear', displayName: 'Clear' }, () => setText(''));

  const Tag = (LEVELS.includes(level) ? level : 'h2') as 'h2';
  const value = String(text ?? '');
  // UI 2.0: a heading shows the whole lines that fit its box and ends in an ellipsis, the full text on hover.
  const wrapRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLHeadingElement>(null);
  const [lines, setLines] = useState<number | null>(null);
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const tag = tagRef.current;
    if (!wrap || !tag || typeof window === 'undefined') return undefined;
    const measure = () => {
      const lineHeight = parseFloat(window.getComputedStyle(tag).lineHeight);
      const h = wrap.clientHeight;
      setLines(
        Number.isFinite(lineHeight) && lineHeight > 0 && h > 0 ? Math.max(1, Math.floor((h + 2) / lineHeight)) : null
      );
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [Tag, value, fontSize]);
  const clamped: CSSProperties = lines
    ? { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: lines, overflow: 'hidden' }
    : {};
  const looks = typeStyle(
    { fontFamily, fontWeight, letterSpacing, textTransform, fontSize },
    Math.round((Number(fontSize) || 30) * 1.2)
  );
  return (
    <LoadingFrame loading={ld.loading} look={ld.skeleton ? <HeadingSkel /> : <LoadingBox />}>
      <div ref={wrapRef} className="ui ui-text-wrap">
        <Tag
          ref={tagRef}
          title={lines ? value : undefined}
          className={cn('ui2-heading', `is-${Tag}`)}
          style={{ textAlign: textAlign as 'left', ...(textColor ? { color: textColor } : {}), ...looks, ...clamped }}
          onClick={onClick}
          onMouseEnter={onHover}
        >
          {value}
        </Tag>
      </div>
    </LoadingFrame>
  );
};
