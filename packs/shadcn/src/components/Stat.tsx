import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { iconFor } from '../lib/icons';
import { cn } from '../lib/cn';
import { LOCALE_HINT } from '../lib/locale';
import {
  compactFigure,
  fontStack,
  isSet,
  progressPercent,
  signedPx,
  sparkPaths,
  splitChange,
  statChange,
  statValue,
  textCase,
  textDirection,
} from '../lib/statModel';
import { Spinner, Veil, useLoadingLook } from '../lib/ui2/loading/look';
import { TOKEN, useThemeColor, useThemeRadius } from '../lib/styleDefaults';

// UI 2.0's Stat (Ui2/Stat/Stat.tsx) on the pack's own CSS: the same properties, styles and actions, so a Stat planned
// for UI 2.0 draws the same here. Visibility and the fitted height are the host's; the loading look is UI 2.0's.

const TRENDS = ['up', 'down', 'neutral'];
// The trend line's fixed viewBox, stretched to the card's width.
const SPARK_W = 120;
const SPARK_H = 36;
// Heights the label's two-line reserve needs (px): the card's padding, two label lines, the gap, the figure's line.
const CARD_PADDING_Y = 40;
const LABEL_TWO_LINES = 40;
const ROW_GAP = 6;
const VALUE_LINE: Record<string, number> = { sm: 28, default: 32, lg: 40 };
// Height a one-line label over the figure needs (px): the short card's padding and border, a label line, the gap.
const STACK_ROOM = 26 + 20 + 4;
const NARROW_CARD = 160;

const css = (value: unknown) => (isSet(value) ? String(value) : undefined);
const text = (value: unknown) => (value == null || typeof value === 'object' ? '' : String(value));

const Sparkline = ({ data, type }: { data: unknown; type: string }) => {
  const paths = useMemo(() => sparkPaths(data, SPARK_W, SPARK_H), [data]);
  const gradient = `ui-stat-spark-${useId().replace(/:/g, '')}`;
  if (!paths) return null;
  return (
    <svg className="ui-stat-spark" viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} preserveAspectRatio="none" aria-hidden="true">
      {type === 'line' ? null : (
        <>
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity={0.28} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <path d={paths.area} fill={`url(#${gradient})`} stroke="none" />
        </>
      )}
      <path d={paths.line} fill="none" stroke="currentColor" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

export const Stat = () => {
  const [label] = ToolJet.useStateString({ name: 'label', label: 'Label', initialValue: 'Total revenue' });
  // A number or text: a number groups its digits, text shows as written unless a Value format reads it as a figure.
  const [value, setValue] = ToolJet.useStateString({ name: 'value', label: 'Value', initialValue: '1250' });
  const [valueFormat] = ToolJet.useStateEnumeration({
    name: 'valueFormat',
    label: 'Value format',
    enumDefinition: ['auto', 'number', 'currency', 'percent', 'compact'],
    enumLabels: { auto: 'Auto', number: 'Number', currency: 'Currency', percent: 'Percent', compact: 'Compact' },
    initialValue: 'auto',
  });
  const [currency] = ToolJet.useStateString({ name: 'currency', label: 'Currency (ISO code, e.g. USD)', initialValue: 'USD' });
  const [locale] = ToolJet.useStateString({ name: 'locale', label: 'Locale', description: LOCALE_HINT, initialValue: '' });
  const [change, setChange] = ToolJet.useStateString({ name: 'change', label: 'Change (e.g. +12.5%)', initialValue: '' });
  const [changeFormat] = ToolJet.useStateEnumeration({
    name: 'changeFormat',
    label: 'Change format',
    enumDefinition: ['percent', 'number', 'currency'],
    enumLabels: { percent: 'Percent', number: 'Number', currency: 'Currency' },
    initialValue: 'number',
    inspector: 'switch',
  });
  const [trendProp, setTrend] = ToolJet.useStateEnumeration({
    name: 'trend',
    label: 'Trend',
    enumDefinition: ['up', 'down', 'neutral'],
    enumLabels: { up: 'Up', down: 'Down', neutral: 'Neutral' },
    initialValue: 'up',
    inspector: 'switch',
  });
  const [changeLabel] = ToolJet.useStateString({ name: 'changeLabel', label: 'Change context (e.g. vs last month)', initialValue: '' });
  const [footnote] = ToolJet.useStateString({ name: 'footnote', label: 'Footnote', initialValue: '' });
  const [iconName] = ToolJet.useStateString({
    name: 'icon',
    label: 'Icon (lucide name, e.g. wallet)',
    inspector: 'icon',
    description: 'Any lucide name (wallet, trending-up, TrendingUp) or Tabler name (IconCurrencyDollar).',
    initialValue: '',
  });
  const [iconPositionProp] = ToolJet.useStateEnumeration({
    name: 'iconPosition',
    label: 'Icon position',
    enumDefinition: ['right', 'left', 'top'],
    enumLabels: { right: 'Right', left: 'Left', top: 'Top' },
    initialValue: 'right',
    inspector: 'switch',
  });
  const [iconStyle] = ToolJet.useStateEnumeration({
    name: 'iconStyle',
    label: 'Icon style',
    enumDefinition: ['square', 'circle', 'none'],
    enumLabels: { square: 'Square', circle: 'Circle', none: 'None' },
    initialValue: 'square',
    inspector: 'switch',
  });
  const [trendData] = ToolJet.useStateString({ name: 'trendData', label: 'Trend data (numbers or [{ x, y }])', initialValue: '' });
  const [sparklineType] = ToolJet.useStateEnumeration({
    name: 'sparklineType',
    label: 'Trend line',
    enumDefinition: ['area', 'line'],
    enumLabels: { area: 'Area', line: 'Line' },
    initialValue: 'area',
    inspector: 'switch',
  });
  const [progressValue] = ToolJet.useStateString({ name: 'progress', label: 'Progress (0 to 100)', initialValue: '' });
  const [progressLabel] = ToolJet.useStateString({ name: 'progressLabel', label: 'Progress label', initialValue: '' });
  const [sizeProp] = ToolJet.useStateEnumeration({
    name: 'size',
    label: 'Size',
    enumDefinition: ['sm', 'default', 'lg'],
    enumLabels: { sm: 'Sm', default: 'Default', lg: 'Lg' },
    initialValue: 'default',
    inspector: 'switch',
  });
  const [card] = ToolJet.useStateBoolean({ name: 'card', label: 'Show as card', initialValue: true });
  // UI 2.0's exposed names for the figure and the change (the native Statistics' names).
  const [, setPrimaryLabel] = ToolJet.useStateString({ name: 'primaryLabel', initialValue: 'Total revenue', inspector: 'hidden' });
  const [, setPrimaryValue] = ToolJet.useStateString({ name: 'primaryValue', initialValue: '1250', inspector: 'hidden' });
  const [, setSecondaryLabel] = ToolJet.useStateString({ name: 'secondaryLabel', initialValue: '', inspector: 'hidden' });
  const [, setSecondaryValue] = ToolJet.useStateString({ name: 'secondaryValue', initialValue: '', inspector: 'hidden' });
  const onClick = ToolJet.useEventCallback({ name: 'onClick' });
  // A number stays a number, so the figure keeps grouping its digits; NaN or Infinity (arithmetic on data not loaded)
  // is no figure and shows empty, not exposed as NaN.
  ToolJet.useAction(
    { name: 'setPrimaryValue', displayName: 'Set primary value', params: [{ handle: 'text', displayName: 'Value', defaultValue: '' }] },
    (next: unknown) => setValue((typeof next === 'number' ? (Number.isFinite(next) ? next : '') : text(next)) as string)
  );
  ToolJet.useAction(
    { name: 'setSecondaryValue', displayName: 'Set secondary value', params: [{ handle: 'text', displayName: 'Change', defaultValue: '' }] },
    (next: unknown) => setChange(text(next))
  );
  // The Trend a change written as words points (a figure's own sign wins).
  ToolJet.useAction(
    { name: 'setTrend', displayName: 'Set trend', params: [{ handle: 'trend', displayName: 'Trend (up, down or neutral)', defaultValue: 'up' }] },
    (next: unknown) => {
      const trend = text(next).trim().toLowerCase();
      if (TRENDS.includes(trend)) setTrend(trend as 'up');
    }
  );
  // The card's own (rounded) shadow: the host's boxShadow, in the Container section, would draw a second, square one.
  const boxShadow = ToolJet.useStyleString({ name: 'cardShadow', label: 'Card shadow', inspector: 'boxShadow', initialValue: '0px 0px 0px 0px #00000040' });
  const backgroundColor = useThemeColor('backgroundColor', 'Card background', TOKEN.surface);
  const borderColor = useThemeColor('borderColor', 'Card border color', TOKEN.border);
  const borderRadius = useThemeRadius('borderRadius', 'Card radius');
  const labelColor = useThemeColor('labelColor', 'Label color', TOKEN.mutedText);
  const valueColor = useThemeColor('valueColor', 'Value color', TOKEN.text);
  const footnoteColor = useThemeColor('footnoteColor', 'Footnote color', TOKEN.mutedText);
  const positiveColor = useThemeColor('positiveColor', 'Change color when trend is up', TOKEN.text);
  const negativeColor = useThemeColor('negativeColor', 'Change color when trend is down', TOKEN.text);
  const iconColor = useThemeColor('iconColor', 'Icon color', TOKEN.brand);
  const chipColor = useThemeColor('chipColor', 'Icon tile color', TOKEN.brand);
  const sparklineColor = useThemeColor('sparklineColor', 'Trend line color', TOKEN.brand);
  const progressColor = useThemeColor('progressColor', 'Progress color', TOKEN.brand);
  const valueFontFamily = ToolJet.useStyleEnumeration({
    name: 'valueFontFamily',
    label: 'Value typeface',
    enumDefinition: ['theme', 'sans', 'serif', 'display', 'mono'],
    enumLabels: { theme: 'Theme font', sans: 'Sans serif', serif: 'Serif', display: 'Display serif', mono: 'Monospace' },
    initialValue: 'theme',
  });
  const labelTextTransform = ToolJet.useStyleEnumeration({
    name: 'labelTextTransform',
    label: 'Label casing',
    enumDefinition: ['none', 'uppercase', 'lowercase', 'capitalize'],
    enumLabels: { none: 'As typed', uppercase: 'UPPERCASE', lowercase: 'lowercase', capitalize: 'Capitalize' },
    initialValue: 'none',
  });
  const labelLetterSpacing = ToolJet.useStyleString({ name: 'labelLetterSpacing', label: 'Label letter spacing (px, or em like 0.12em)', initialValue: '' });
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 12 });

  useEffect(() => {
    setPrimaryLabel(text(label));
    setPrimaryValue(typeof value === 'number' ? (Number.isFinite(value) ? value : '') : text(value));
    setSecondaryLabel(text(changeLabel));
    setSecondaryValue(text(change));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label, value, changeLabel, change]);

  // The box's size, for the short and narrow layouts UI 2.0 picks from the widget's height and width. (useEffect, not
  // useLayoutEffect: the manifest build's server render records every hook twice for a layout effect.)
  const rootRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const measure = () =>
      setBox((prev) => (prev.width === el.clientWidth && prev.height === el.clientHeight ? prev : { width: el.clientWidth, height: el.clientHeight }));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // "+8 vs last week" as change: the figure stays in the chip, the words join the context line. A figure is formatted
  // in the change format (+12.4%, −3.2) and its sign sets the direction; words keep their own sign, else the Trend's.
  const split = splitChange(change);
  const figure = statChange(split.chip, changeFormat, currency, locale);
  const trendDirection = ({ up: 1, down: -1 } as Record<string, number>)[trendProp] ?? 0;
  const direction = figure ? figure.direction : textDirection(split.chip) || trendDirection;
  const trend = direction > 0 ? 'up' : direction < 0 ? 'down' : 'neutral';
  // Flat (a figure that rounds to zero) draws a level line; words with no direction draw no icon.
  const TrendIcon = trend === 'down' ? TrendingDown : trend === 'up' ? TrendingUp : figure ? Minus : null;
  // The chip takes the positive or negative colour for its direction (text, on a light tint) when set; flat stays neutral.
  const trendColor = trend === 'up' ? positiveColor : trend === 'down' ? negativeColor : '';

  const Glyph = iconFor(iconName);
  const iconPosition = ['left', 'top'].includes(iconPositionProp) ? iconPositionProp : 'right';
  const iconShape = ['circle', 'none'].includes(iconStyle) ? iconStyle : 'square';
  const size = ['sm', 'lg'].includes(sizeProp) ? sizeProp : 'default';
  const iconSize = size === 'lg' ? 20 : size === 'sm' ? 14 : 16;
  const iconBox = iconShape === 'none' ? iconSize : iconSize * 2;
  // Loading with the Skeleton look: the change chip, the icon, the context line and the trend line are skeletons of
  // their own size too, not only the figure (UI 2.0).
  const veiled = ld.skeleton;
  const iconNode = Glyph ? (
    <Veil on={veiled} className="ui-stat-veil-fixed">
      <span className={cn('ui-stat-icon', `is-${iconShape}`)} style={{ width: iconBox, height: iconBox }} aria-hidden="true">
        <Glyph size={iconSize} />
      </span>
    </Veil>
  ) : null;

  const isCard = card !== false;
  const progress = progressPercent(progressValue);
  const labelText = text(label);
  // The label's two-line reserve (figures level across a row of Stats) only where the box has room for it; a box too
  // short even for one label line over the figure sets the label beside the figure.
  const valueLine = VALUE_LINE[size] ?? VALUE_LINE.default;
  const reserveLabel = !box.height || box.height >= (isCard ? CARD_PADDING_Y : 0) + LABEL_TWO_LINES + ROW_GAP + valueLine;
  const inline = box.height > 0 && box.height < (isCard ? STACK_ROOM : 0) + valueLine;
  const context = [split.context, text(changeLabel)].filter(Boolean).join(' · ');
  const figureChip = !!figure || /^[+\-−±]?\s?[$€£¥₹]?\d/.test(split.chip || '');

  const changeBadge = split.chip ? (
    <Veil on={veiled} className={figureChip ? 'ui-stat-veil-fixed' : 'ui-stat-veil-words'}>
      <span
      className={cn('ui-stat-chip', figureChip ? 'is-figure' : 'is-words', isSet(trendColor) && 'is-toned')}
      style={isSet(trendColor) ? { ['--ui-stat-tone' as string]: String(trendColor) } : undefined}
      title={text(change)}
    >
      {TrendIcon ? <TrendIcon size={12} data-direction={trend} /> : null}
      {/* A figure stays on one line (a long one shortened); words wrap rather than being cut. */}
      <span className="ui-stat-chip-text">{figureChip ? (figure ? figure.text : compactFigure(split.chip)) : split.chip}</span>
      </span>
    </Veil>
  ) : null;
  // The chip sits in the label row unless the icon takes that corner; then it follows the figure.
  const badgeInHeader = !(Glyph && iconPosition === 'right');
  const shown = statValue(value, { valueFormat, currency, locale });

  const content = (
    <div className={cn('ui-stat-content', reserveLabel ? 'is-roomy' : 'is-short', inline && 'is-inline')}>
      {Glyph && iconPosition === 'top' ? <div className="ui-stat-top">{iconNode}</div> : null}
      <div className="ui-stat-head">
        <span title={labelText || undefined} className={cn('ui-stat-label', labelText && (reserveLabel ? 'is-reserved' : 'is-single'))}>
          {labelText}
        </span>
        {badgeInHeader ? changeBadge : null}
        {Glyph && iconPosition === 'right' ? iconNode : null}
      </div>
      <div className="ui-stat-figure">
        {/* A dash when there is no value: the label alone read as a broken card. */}
        <span className={cn('ui-stat-value', `ui-stat-value--${size}`)}>
          {ld.loading ? (
            ld.skeleton ? (
              // A line of the figure's own height and baseline, so the row is as tall as with the figure.
              <Veil on className="ui-stat-veil-value">
                <span>&nbsp;</span>
              </Veil>
            ) : (
              <span className="ui-stat-value-spin">
                <Spinner />
              </span>
            )
          ) : (
            shown || '–'
          )}
        </span>
        {badgeInHeader ? null : changeBadge}
        {context ? (
          <Veil on={veiled} className="ui-stat-veil-words">
            <span className="ui-stat-context" title={context}>
              {context}
            </span>
          </Veil>
        ) : null}
      </div>
      {isSet(footnote) ? (
        <span className="ui-stat-footnote" title={text(footnote)}>
          {text(footnote)}
        </span>
      ) : null}
      {progress !== null ? (
        <div className="ui-stat-progress">
          <div className="ui-stat-progress-track">
            <div className="ui-stat-progress-bar" style={{ width: `${progress}%` }} />
          </div>
          {isSet(progressLabel) ? <span className="ui-stat-context">{text(progressLabel)}</span> : null}
        </div>
      ) : null}
      {isSet(trendData) ? (
        <Veil on={veiled} className="ui-stat-veil-spark">
          <Sparkline data={trendData} type={sparklineType} />
        </Veil>
      ) : null}
    </div>
  );
  const body =
    Glyph && iconPosition === 'left' ? (
      <div className="ui-stat-row">
        {iconNode}
        {content}
      </div>
    ) : (
      content
    );

  const font = fontStack(valueFontFamily);
  const labelCase = textCase(labelTextTransform);
  const tracking = signedPx(labelLetterSpacing);
  const vars: Record<string, string | undefined> = {
    '--ui-stat-bg': css(backgroundColor),
    '--ui-stat-border': css(borderColor),
    '--ui-stat-radius': isSet(borderRadius) && !Number.isNaN(Number(borderRadius)) ? `${Number(borderRadius)}px` : undefined,
    '--ui-stat-label': css(labelColor),
    '--ui-stat-value': css(valueColor),
    '--ui-stat-help': css(footnoteColor),
    '--ui-stat-icon': css(iconColor),
    '--ui-stat-icon-chip': css(chipColor),
    '--ui-stat-spark': css(sparklineColor),
    '--ui-stat-progress': css(progressColor),
    '--ui-stat-value-font': font || undefined,
    '--ui-stat-label-case': labelCase || undefined,
    '--ui-stat-label-tracking': tracking || undefined,
  };
  // UI 2.0's default shadow is a zero one; the card keeps the pack's own then.
  const shadow = isSet(boxShadow) && !/^0px 0px 0px 0px/.test(String(boxShadow).trim()) ? String(boxShadow) : undefined;

  return (
    <div ref={rootRef} className="ui ui-stat-root" style={vars as React.CSSProperties}>
      <div
        className={cn('ui-stat', isCard && 'is-card', isCard && box.width > 0 && box.width < NARROW_CARD && 'is-narrow', !reserveLabel && 'is-short')}
        onClick={onClick}
        style={isCard && shadow ? { boxShadow: shadow } : undefined}
      >
        {body}
      </div>
    </div>
  );
};
