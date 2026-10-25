import React, { useEffect, useState } from 'react';
import {
  Alert as AntAlert,
  Avatar as AntAvatar,
  Badge as AntBadge,
  Button,
  Descriptions as AntDescriptions,
  Divider as AntDivider,
  Empty as AntEmpty,
  Progress as AntProgress,
  Result as AntResult,
  Skeleton,
  Statistic as AntStatistic,
  Steps as AntSteps,
  Tag as AntTag,
  Timeline as AntTimeline,
  Typography,
} from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { AntProvider, useTokenStyles } from '../lib/AntProvider';
import { THEME_COLOR, useThemeColor } from '../lib/themeStyles';
import { SkeletonSwap, SpinOver, TextBone } from '../lib/Loading';
import { str, toArray, type Row } from '../lib/data';
import { formatCell, formatNumber, parseFormat, toNumber, type NumberFormat } from '../lib/format';
import { chipLabel, chipTone } from '../lib/ui2/display/lists/model';
import { useFitLayout, useFitText } from '../lib/fitText';

const TONE_TAG_STATUS: Record<string, string | undefined> = { success: 'success', warning: 'warning', danger: 'error', info: 'processing', neutral: undefined };

const TAG_COLORS = ['default', 'processing', 'success', 'warning', 'error', 'blue', 'green', 'red', 'orange', 'gold', 'purple', 'cyan', 'magenta', 'geekblue', 'volcano', 'lime'];

// Ant's Tag: its text is its children; color (a status preset, a palette name, or any CSS colour), bordered, closable;
// event onClose.
export const Tag = () => {
  const [children] = ToolJet.useStateString({ name: 'children', label: 'Text', initialValue: 'Tag' });
  const [color] = ToolJet.useStateString({ name: 'color', label: 'Color', description: `${TAG_COLORS.join(', ')} or a CSS colour`, initialValue: 'default' });
  const [bordered] = ToolJet.useStateBoolean({ name: 'bordered', label: 'Bordered', initialValue: true });
  const [closable] = ToolJet.useStateBoolean({ name: 'closable', label: 'Closable', initialValue: false });
  const onClose = ToolJet.useEventCallback({ name: 'onClose' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 4, defaultHeight: 3 });
  const c = str(color).trim();
  return (
    <AntProvider tokens={tokens}>
      <SkeletonSwap loading={loading} look={<Skeleton.Button active size="small" />}>
        {children ? (
          <AntTag color={c && c !== 'default' ? c : undefined} bordered={bordered} closable={closable} onClose={() => onClose()} style={{ marginInlineEnd: 0 }}>
            {children}
          </AntTag>
        ) : null}
      </SkeletonSwap>
    </AntProvider>
  );
};

// Ant's Badge as a status label: status (success, processing, default, error, warning) and text, or count / dot.
export const Badge = () => {
  const [status] = ToolJet.useStateEnumeration({
    name: 'status',
    label: 'Status',
    enumDefinition: ['default', 'processing', 'success', 'warning', 'error'],
    initialValue: 'default',
  });
  const [text] = ToolJet.useStateString({ name: 'text', label: 'Text', initialValue: 'Pending' });
  const [count] = ToolJet.useStateNumber({ name: 'count', label: 'Count', description: 'Shown instead of the status dot when set.', initialValue: undefined as unknown as number });
  const [overflowCount] = ToolJet.useStateNumber({ name: 'overflowCount', label: 'Overflow count', initialValue: 99 });
  const [color] = ToolJet.useStateString({ name: 'color', label: 'Color', description: 'A palette name or CSS colour; overrides status.', initialValue: '' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 6, defaultHeight: 3 });
  const n = toNumber(count);
  return (
    <AntProvider tokens={tokens}>
      <SpinOver loading={loading}>
        {n !== null ? (
          <span className="tj-ant-badge-count">
            <AntBadge count={n} overflowCount={Number(overflowCount) || 99} showZero color={color || undefined} />
            {text ? <span>{text}</span> : null}
          </span>
        ) : (
          <AntBadge status={status as 'default'} text={text} color={color || undefined} />
        )}
      </SpinOver>
    </AntProvider>
  );
};

// Ant's Alert: message (the title), description, type (success, info, warning, error), showIcon, closable, banner,
// actionText (a small button at the right, Ant's action slot). UI 2.0's Alert behaviour: the close button dismisses it
// (dismissed, exposed), the show and dismiss actions; events onClose and onActionClicked, UI 2.0's names.
export const Alert = () => {
  const [message] = ToolJet.useStateString({ name: 'message', label: 'Message', initialValue: 'A new version is available.' });
  const [description] = ToolJet.useStateString({ name: 'description', label: 'Description', initialValue: '' });
  const [type] = ToolJet.useStateEnumeration({
    name: 'type',
    label: 'Type',
    enumDefinition: ['info', 'success', 'warning', 'error', 'custom'],
    enumLabels: { info: 'Info', success: 'Success', warning: 'Warning', error: 'Error', custom: 'Custom' },
    initialValue: 'info',
  });
  const [showIcon] = ToolJet.useStateBoolean({ name: 'showIcon', label: 'Show icon', initialValue: true });
  const [closable] = ToolJet.useStateBoolean({ name: 'closable', label: 'Closable', initialValue: false });
  const [banner] = ToolJet.useStateBoolean({ name: 'banner', label: 'Banner', initialValue: false });
  const [actionText] = ToolJet.useStateString({ name: 'actionText', label: 'Action text', description: 'A button on the alert; empty for none.', initialValue: '' });
  const [dismissed, setDismissed] = ToolJet.useStateBoolean({ name: 'dismissed', initialValue: false, inspector: 'hidden' });
  const onClose = ToolJet.useEventCallback({ name: 'onClose' });
  const onActionClicked = ToolJet.useEventCallback({ name: 'onActionClicked' });
  const { disabled, loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  // UI 2.0's Custom variant: the alert's own colours, shown while Type is Custom. Left at their defaults they draw
  // the container's surface, text and border.
  const custom = type === 'custom';
  const customWhen = { section: 'Custom alert', visibleWhen: { key: 'type', value: 'custom' } };
  const customBg = useThemeColor('customBackgroundColor', 'Background', THEME_COLOR.surface, customWhen);
  const customText = useThemeColor('customTextColor', 'Text and icon color', THEME_COLOR.text, customWhen);
  const customBorder = useThemeColor('customBorderColor', 'Border color', THEME_COLOR.border, customWhen);
  ToolJet.useComponentSettings({ defaultWidth: 16, defaultHeight: 5 });
  // dismissed changes before onClose fires, so its handler reads the alert as gone.
  const close = () => {
    setDismissed(true);
    onClose();
  };
  ToolJet.useAction({ name: 'show', displayName: 'Show' }, () => setDismissed(false));
  ToolJet.useAction({ name: 'dismiss', displayName: 'Dismiss' }, close);
  if (dismissed || (!message && !description)) return <AntProvider tokens={tokens}>{null}</AntProvider>;
  // Fills its box (no band under a short message) and scrolls a long one inside it: it was drawn at its natural height
  // and the host cut what did not fit.
  return (
    <AntProvider
      tokens={tokens}
      fill
      className={custom ? 'tj-ant-alert tj-ant-alert--custom' : 'tj-ant-alert'}
      style={
        custom
          ? ({
              ...(customBg ? { '--tj-alert-bg': customBg } : {}),
              ...(customText ? { '--tj-alert-fg': customText } : {}),
              ...(customBorder ? { '--tj-alert-border': customBorder } : {}),
            } as React.CSSProperties)
          : undefined
      }
    >
      <SpinOver loading={loading} as="fill">
        <AntAlert
          message={message || description}
          description={message && description ? description : undefined}
          type={(custom ? 'info' : type) as 'info'}
          showIcon={showIcon}
          closable={closable}
          banner={banner}
          action={
            actionText ? (
              <Button size="small" disabled={disabled} onClick={() => onActionClicked()}>
                {actionText}
              </Button>
            ) : undefined
          }
          onClose={close}
        />
      </SpinOver>
    </AntProvider>
  );
};

const TYPES = ['default', 'secondary', 'success', 'warning', 'danger'];
const typeOf = (t: string) => (t && t !== 'default' ? (t as 'secondary') : undefined);

// Ant's Typography.Title: children, level (1 to 5), type, copyable, ellipsis (one line), mark, underline.
export const Title = () => {
  const [children] = ToolJet.useStateString({ name: 'children', label: 'Text', initialValue: 'Quarterly overview' });
  const [level] = ToolJet.useStateNumber({ name: 'level', label: 'Level', description: '1 (largest) to 5', initialValue: 3, min: 1, max: 5 });
  const [type] = ToolJet.useStateEnumeration({ name: 'type', label: 'Type', enumDefinition: TYPES, initialValue: 'default' });
  const [copyable] = ToolJet.useStateBoolean({ name: 'copyable', label: 'Copyable', initialValue: false });
  const [ellipsis] = ToolJet.useStateBoolean({ name: 'ellipsis', label: 'Ellipsis', description: 'One line, cut with an ellipsis.', initialValue: false });
  const [mark] = ToolJet.useStateBoolean({ name: 'mark', label: 'Mark', initialValue: false });
  const [underline] = ToolJet.useStateBoolean({ name: 'underline', label: 'Underline', initialValue: false });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 16, defaultHeight: 4 });
  const lv = Math.max(1, Math.min(5, Math.round(toNumber(String(level).replace(/^h/i, '')) ?? 3))) as 1;
  return (
    <AntProvider tokens={tokens}>
      <SkeletonSwap loading={loading} look={<Skeleton active paragraph={false} />}>
        <Typography.Title
          level={lv}
          type={typeOf(type)}
          copyable={copyable && !!children}
          ellipsis={ellipsis ? { tooltip: children } : false}
          mark={mark}
          underline={underline}
          style={{ margin: 0 }}
        >
          {children}
        </Typography.Title>
      </SkeletonSwap>
    </AntProvider>
  );
};

// Ant's Typography.Paragraph as body text: children, type, strong, italic, code, copyable, ellipsis (rows; 0 for none).
export const Text = () => {
  const [children] = ToolJet.useStateString({ name: 'children', label: 'Text', initialValue: 'Add a short description here.' });
  const [type] = ToolJet.useStateEnumeration({ name: 'type', label: 'Type', enumDefinition: TYPES, initialValue: 'default' });
  const [strong] = ToolJet.useStateBoolean({ name: 'strong', label: 'Strong', initialValue: false });
  const [italic] = ToolJet.useStateBoolean({ name: 'italic', label: 'Italic', initialValue: false });
  const [code] = ToolJet.useStateBoolean({ name: 'code', label: 'Code', initialValue: false });
  const [copyable] = ToolJet.useStateBoolean({ name: 'copyable', label: 'Copyable', initialValue: false });
  const [ellipsis] = ToolJet.useStateNumber({ name: 'ellipsis', label: 'Ellipsis rows', description: 'Cut after this many lines; 0 for none.', initialValue: 0, min: 0, max: 20 });
  const [align] = ToolJet.useStateEnumeration({ name: 'align', label: 'Align', enumDefinition: ['left', 'center', 'right'], initialValue: 'left' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 16, defaultHeight: 3 });
  const rows = Math.max(0, Number(ellipsis) || 0);
  return (
    <AntProvider tokens={tokens}>
      <SkeletonSwap loading={loading} look={<Skeleton active title={false} paragraph={{ rows: Math.max(1, Math.min(4, rows || 2)) }} />}>
        <Typography.Paragraph
          type={typeOf(type)}
          strong={strong}
          italic={italic}
          code={code}
          copyable={copyable && !!children}
          ellipsis={rows ? { rows, tooltip: children } : false}
          style={{ margin: 0, textAlign: align as 'left', whiteSpace: 'pre-line' }}
        >
          {children}
        </Typography.Paragraph>
      </SkeletonSwap>
    </AntProvider>
  );
};

// Ant's Statistic: title, value, precision, prefix, suffix, groupSeparator; ToolJet adds formatter (auto, number,
// currency, percent, compact), currency, and a trend line under it (trend, trendValue, extra), as Ant's own
// "Statistic in a Card" examples draw with arrow icons.
export const Statistic = () => {
  const [title] = ToolJet.useStateString({ name: 'title', label: 'Title', initialValue: 'Monthly revenue' });
  const [value] = ToolJet.useStateString({ name: 'value', label: 'Value', description: 'A number (formatted) or any text.', initialValue: '48250' });
  const [formatter] = ToolJet.useStateEnumeration({
    name: 'formatter',
    label: 'Formatter',
    enumDefinition: ['auto', 'number', 'currency', 'percent', 'compact'],
    initialValue: 'auto',
  });
  const [currency] = ToolJet.useStateString({ name: 'currency', label: 'Currency', initialValue: 'USD', visibleWhen: { key: 'formatter', value: 'currency' } });
  const [precision] = ToolJet.useStateNumber({ name: 'precision', label: 'Precision', description: 'Decimal places; empty for the formatter default.', initialValue: undefined as unknown as number, min: 0, max: 10 });
  const [prefix] = ToolJet.useStateString({ name: 'prefix', label: 'Prefix', initialValue: '' });
  const [suffix] = ToolJet.useStateString({ name: 'suffix', label: 'Suffix', initialValue: '' });
  const [trend, setTrend] = ToolJet.useStateEnumeration({ name: 'trend', label: 'Trend', enumDefinition: ['neutral', 'up', 'down'], initialValue: 'neutral' });
  const [trendValue, setTrendValue] = ToolJet.useStateString({ name: 'trendValue', label: 'Trend value', description: 'e.g. 12% or +340', initialValue: '' });
  const [extra] = ToolJet.useStateString({ name: 'extra', label: 'Extra', description: 'Text after the trend, e.g. vs last month.', initialValue: '' });
  const [bordered] = ToolJet.useStateBoolean({ name: 'bordered', label: 'Card', description: 'Draw it in a bordered card.', initialValue: true });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 10 });
  // The trend line from a query: the direction (up, down or neutral; anything else keeps it) and, when given, the
  // value beside it.
  ToolJet.useAction(
    {
      name: 'setTrend',
      displayName: 'Set trend',
      params: [
        { handle: 'trend', displayName: 'Trend (up, down or neutral)', defaultValue: 'up' },
        { handle: 'trendValue', displayName: 'Trend value (optional, e.g. 12%)', defaultValue: '' },
      ],
    },
    (next: unknown, nextValue: unknown) => {
      const t = str(next).trim().toLowerCase();
      if (t === 'up' || t === 'down' || t === 'neutral') setTrend(t);
      if (nextValue !== undefined && nextValue !== null && nextValue !== '') setTrendValue(str(nextValue));
    }
  );
  const n = toNumber(value);
  const p = toNumber(precision);
  const shown = n === null ? str(value) || '-' : formatNumber(n, formatter as NumberFormat, currency, p === null ? null : Math.max(0, Math.min(10, p)));
  const trendClass = trend === 'up' ? 'is-up' : trend === 'down' ? 'is-down' : '';
  // A box too short for the card's title over its figure: less padding, then the title beside the figure, then the
  // figure shrunk (shadcn's Stat in the same box). The figure also shrinks to the card's width.
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const layout = useFitLayout(box, STAT_LAYOUTS, [shown, title, prefix, suffix, trendValue, extra, bordered, loading], { selector: STAT_FIGURE });
  useFitText<HTMLDivElement>([shown, prefix, suffix, loading, layout], { root: box, selector: STAT_FIGURE, height: true });
  return (
    // Fills its box, so stat cards side by side in a row are one height.
    <AntProvider tokens={tokens} fill>
      <div ref={setBox} className={[bordered ? 'tj-ant-stat tj-ant-stat--card' : 'tj-ant-stat', layout].join(' ').trim()} aria-busy={loading || undefined}>
        {/* Loading draws the parts at their own sizes (a title line, the figure's line, the trend line), so the card
            keeps its size and frame. */}
        <AntStatistic
          title={title ? (loading ? <TextBone part="title" /> : title) : undefined}
          value={shown}
          prefix={prefix && !loading ? prefix : undefined}
          suffix={suffix && !loading ? suffix : undefined}
          valueRender={loading ? () => <TextBone part="figure" /> : undefined}
        />
        {trendValue || extra ? (
          <div className="tj-ant-stat-trend">
            {loading ? (
              <TextBone part="trend" />
            ) : (
              <>
                {trendValue ? (
                  <span className={`tj-ant-stat-change ${trendClass}`}>
                    {trend === 'up' ? <ArrowUpOutlined /> : trend === 'down' ? <ArrowDownOutlined /> : null}
                    {trendValue}
                  </span>
                ) : null}
                {extra ? <span className="tj-ant-stat-extra">{extra}</span> : null}
              </>
            )}
          </div>
        ) : null}
      </div>
    </AntProvider>
  );
};

// The Statistic's layouts, roomiest first (fitText.ts useFitLayout), and the figure it shrinks.
const STAT_LAYOUTS = ['', 'is-short', 'is-short is-inline'];
const STAT_FIGURE = '.ant-statistic-content';

// Ant's Progress: percent, type (line, circle, dashboard), status (normal, active, success, exception), showInfo,
// steps, strokeLinecap, size.
export const Progress = () => {
  const [percent] = ToolJet.useStateNumber({ name: 'percent', label: 'Percent', initialValue: 60, min: 0, max: 100 });
  const [type] = ToolJet.useStateEnumeration({ name: 'type', label: 'Type', enumDefinition: ['line', 'circle', 'dashboard'], initialValue: 'line' });
  const [status] = ToolJet.useStateEnumeration({ name: 'status', label: 'Status', enumDefinition: ['normal', 'active', 'success', 'exception'], initialValue: 'normal' });
  const [showInfo] = ToolJet.useStateBoolean({ name: 'showInfo', label: 'Show info', initialValue: true });
  const [steps] = ToolJet.useStateNumber({ name: 'steps', label: 'Steps', description: 'Segments of a line; 0 for a continuous bar.', initialValue: 0, min: 0, max: 50 });
  const [strokeColor] = ToolJet.useStateString({ name: 'strokeColor', label: 'Stroke color', inspector: 'color', initialValue: '' });
  const [title] = ToolJet.useStateString({ name: 'title', label: 'Title', description: 'A caption above a line.', initialValue: '' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 14, defaultHeight: 3 });
  const pct = Math.max(0, Math.min(100, toNumber(percent) ?? 0));
  const isLine = type === 'line';
  return (
    <AntProvider tokens={tokens} fill className={isLine ? 'tj-ant-progress-line' : 'tj-ant-center'}>
      <SpinOver loading={loading} as="fill">
        {title && isLine ? <div className="tj-ant-progress-title">{title}</div> : null}
        <AntProgress
          percent={Math.round(pct * 10) / 10}
          type={type as 'line'}
          status={status === 'normal' ? undefined : (status as 'active')}
          showInfo={showInfo}
          steps={isLine && Number(steps) > 0 ? Number(steps) : undefined}
          strokeColor={strokeColor || undefined}
        />
      </SpinOver>
    </AntProvider>
  );
};

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

// Ant's Avatar: src, alt, children (text when there is no image: a name becomes its initials), shape, size.
export const Avatar = () => {
  const [src] = ToolJet.useStateString({ name: 'src', label: 'Src', description: 'Image URL', initialValue: '' });
  const [children] = ToolJet.useStateString({ name: 'children', label: 'Text', description: 'Shown without an image; a full name shows its initials.', initialValue: 'AL' });
  const [alt] = ToolJet.useStateString({ name: 'alt', label: 'Alt', initialValue: '' });
  const [shape] = ToolJet.useStateEnumeration({ name: 'shape', label: 'Shape', enumDefinition: ['circle', 'square'], initialValue: 'circle' });
  const [size] = ToolJet.useStateNumber({ name: 'size', label: 'Size (px)', initialValue: 40, min: 16, max: 240 });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 3, defaultHeight: 5 });
  const text = str(children).trim();
  return (
    <AntProvider tokens={tokens} fill className="tj-ant-center tj-ant-start">
      <SkeletonSwap loading={loading} look={<Skeleton.Avatar active shape={shape as 'circle'} size={Math.max(16, Math.min(240, Number(size) || 40))} />}>
        <AntAvatar src={src || undefined} alt={alt || text || undefined} shape={shape as 'circle'} size={Math.max(16, Math.min(240, Number(size) || 40))}>
          {text.includes(' ') ? initialsOf(text) : text}
        </AntAvatar>
      </SkeletonSwap>
    </AntProvider>
  );
};

// Ant's Divider: children (text in the line), orientation (left, center, right), dashed, plain, type (horizontal,
// vertical).
export const Divider = () => {
  const [children] = ToolJet.useStateString({ name: 'children', label: 'Text', initialValue: '' });
  const [orientation] = ToolJet.useStateEnumeration({ name: 'orientation', label: 'Orientation', enumDefinition: ['left', 'center', 'right'], initialValue: 'center' });
  const [dashed] = ToolJet.useStateBoolean({ name: 'dashed', label: 'Dashed', initialValue: false });
  const [plain] = ToolJet.useStateBoolean({ name: 'plain', label: 'Plain', initialValue: true });
  const [type] = ToolJet.useStateEnumeration({ name: 'type', label: 'Type', enumDefinition: ['horizontal', 'vertical'], initialValue: 'horizontal' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 3 });
  return (
    <AntProvider tokens={tokens} fill className="tj-ant-center">
      <SpinOver loading={loading} as="fill">
        <AntDivider
          type={type as 'horizontal'}
          orientation={orientation as 'left'}
          dashed={dashed}
          plain={plain}
          style={type === 'vertical' ? { height: '100%' } : { margin: 0 }}
        >
          {type === 'horizontal' && children ? children : null}
        </AntDivider>
      </SpinOver>
    </AntProvider>
  );
};

// Ant's Empty: description, image (default, simple).
export const Empty = () => {
  const [description] = ToolJet.useStateString({ name: 'description', label: 'Description', initialValue: 'No data' });
  const [image] = ToolJet.useStateEnumeration({ name: 'image', label: 'Image', enumDefinition: ['default', 'simple'], initialValue: 'simple' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 14, defaultHeight: 14 });
  return (
    <AntProvider tokens={tokens} fill className="tj-ant-center">
      <SpinOver loading={loading} as="fill">
        <AntEmpty description={description || false} image={image === 'simple' ? AntEmpty.PRESENTED_IMAGE_SIMPLE : AntEmpty.PRESENTED_IMAGE_DEFAULT} />
      </SpinOver>
    </AntProvider>
  );
};

// Ant's Result: status (success, error, info, warning, 404, 403, 500), title, subTitle.
export const Result = () => {
  const [status] = ToolJet.useStateEnumeration({
    name: 'status',
    label: 'Status',
    enumDefinition: ['success', 'info', 'warning', 'error', '404', '403', '500'],
    initialValue: 'info',
  });
  const [title] = ToolJet.useStateString({ name: 'title', label: 'Title', initialValue: 'Your request was received' });
  const [subTitle] = ToolJet.useStateString({ name: 'subTitle', label: 'Sub title', initialValue: 'We will email you when it is ready.' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 18, defaultHeight: 30 });
  return (
    <AntProvider tokens={tokens}>
      <SpinOver loading={loading} as="block">
        <AntResult status={status as 'info'} title={title || undefined} subTitle={subTitle || undefined} />
      </SpinOver>
    </AntProvider>
  );
};

// Ant's Descriptions: items [{ label, children }]; also UI 2.0's key-value shapes: an object of label: value, rows
// [{ label, value, type }] and [label, value] pairs. A row's format (or type) formats its value: number, currency
// (currency:EUR), percent, date, datetime, boolean, tag (a status Tag), link. title, extra, column, bordered, layout,
// size, currency, emptyText.
export const Descriptions = () => {
  const [rawItems] = ToolJet.useStateArray({ name: 'items', label: 'Items', description: "[{ label, children }] or { 'Label': value }", initialValue: [
    { label: 'Order', children: '#1042' },
    { label: 'Customer', children: 'Maya Chen' },
    { label: 'Status', children: 'Shipped', format: 'tag' },
    { label: 'Total', children: 1250, format: 'currency' },
    { label: 'Placed', children: '2026-09-14', format: 'date' },
  ] });
  const [title] = ToolJet.useStateString({ name: 'title', label: 'Title', initialValue: 'Order details' });
  const [extra] = ToolJet.useStateString({ name: 'extra', label: 'Extra', initialValue: '' });
  const [column] = ToolJet.useStateNumber({ name: 'column', label: 'Column', initialValue: 1, min: 1, max: 6 });
  const [bordered] = ToolJet.useStateBoolean({ name: 'bordered', label: 'Bordered', initialValue: false });
  const [layout] = ToolJet.useStateEnumeration({ name: 'layout', label: 'Layout', enumDefinition: ['horizontal', 'vertical'], initialValue: 'horizontal' });
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['default', 'middle', 'small'], initialValue: 'default' });
  const [currency] = ToolJet.useStateString({ name: 'currency', label: 'Currency', initialValue: 'USD' });
  const [emptyText] = ToolJet.useStateString({ name: 'emptyText', label: 'Empty text', description: 'Shown for an empty value.', initialValue: '-' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  // Tall enough for the sample's title and five rows; longer items scroll inside the box.
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 23 });
  const raw: unknown = rawItems;
  const entries: Row[] = Array.isArray(raw)
    ? raw
        .map((r): Row | null =>
          Array.isArray(r) ? { label: r[0], value: r[1] } : r && typeof r === 'object' ? (r as Row) : null
        )
        .filter((r): r is Row => !!r)
    : raw && typeof raw === 'object'
      ? Object.entries(raw as Row).map(([label, value]) => ({ label, value }))
      : [];
  const items = entries.map((r, i) => {
    const f = parseFormat(r.format ?? r.type);
    const v = r.children ?? r.value;
    const text = formatCell(v, f.format, str(r.currency) || f.currency || currency);
    let children: React.ReactNode = text || emptyText;
    if (f.format === 'tag' && text) children = <AntTag color={TONE_TAG_STATUS[chipTone(text)]} style={{ marginInlineEnd: 0 }}>{chipLabel(text)}</AntTag>;
    else if (f.format === 'link' && text) children = <Typography.Link href={str(r.href ?? v)} target="_blank">{str(r.linkText) || text}</Typography.Link>;
    return { key: str(r.key ?? i), label: str(r.label ?? r.key ?? r.name), children, span: toNumber(r.span) ?? undefined };
  });
  return (
    <AntProvider tokens={tokens} fill className="tj-ant-scroll">
      <SkeletonSwap loading={loading} look={<Skeleton active title={!!title} paragraph={{ rows: Math.max(2, Math.min(6, items.length || 3)) }} />}>
        <AntDescriptions
          items={items}
          title={title || undefined}
          extra={extra || undefined}
          column={Math.max(1, Math.min(6, Number(column) || 1))}
          bordered={bordered}
          layout={layout as 'horizontal'}
          size={size as 'default'}
        />
      </SkeletonSwap>
    </AntProvider>
  );
};

// Ant's Steps: items [{ title, description, subTitle, status }], current, direction, size, type (default, navigation,
// inline), status, percent, progressDot; event onChange (clicking a step) with the current exposed.
export const Steps = () => {
  const [rawItems] = ToolJet.useStateArray({ name: 'items', label: 'Items', description: '[{ title, description }]', initialValue: [
    { title: 'Ordered', description: 'Sep 14' },
    { title: 'Packed', description: 'Sep 15' },
    { title: 'Shipped', description: 'In transit' },
    { title: 'Delivered' },
  ] });
  const [current, setCurrent] = ToolJet.useStateNumber({ name: 'current', label: 'Current', description: 'Index of the current step, from 0.', initialValue: 0, min: 0 });
  const [direction] = ToolJet.useStateEnumeration({ name: 'direction', label: 'Direction', enumDefinition: ['horizontal', 'vertical'], initialValue: 'horizontal' });
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['default', 'small'], initialValue: 'default' });
  const [type] = ToolJet.useStateEnumeration({ name: 'type', label: 'Type', enumDefinition: ['default', 'navigation', 'inline'], initialValue: 'default' });
  const [status] = ToolJet.useStateEnumeration({ name: 'status', label: 'Status', enumDefinition: ['process', 'wait', 'finish', 'error'], initialValue: 'process' });
  const [progressDot] = ToolJet.useStateBoolean({ name: 'progressDot', label: 'Progress dot', initialValue: false });
  const [clickable] = ToolJet.useStateBoolean({ name: 'clickable', label: 'Clickable', description: 'Clicking a step makes it current (onChange).', initialValue: false });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 30, defaultHeight: 7 });
  const items = toArray(rawItems).map((o) =>
    typeof o === 'string'
      ? { title: o }
      : { title: str((o as Row)?.title ?? (o as Row)?.label), description: str((o as Row)?.description) || undefined, subTitle: str((o as Row)?.subTitle) || undefined, status: ((o as Row)?.status as 'wait') || undefined }
  );
  // n may be a step from the latest one, so two nexts in one batch advance twice.
  const go = (n: number | ((latest: number) => number)) => {
    setCurrent((c: unknown) => Math.max(0, Math.min(Math.max(0, items.length - 1), typeof n === 'function' ? n(Number(c) || 0) : n)));
    onChange();
  };
  // current exposes the step drawn: past the steps (a literal 9 of 4, or steps removed) Ant draws every step done,
  // which is current = the number of steps; below 0, the first. An empty list is data still loading.
  const drawn = items.length && toNumber(current) !== null ? Math.max(0, Math.min(items.length, Math.trunc(Number(current)))) : null;
  useEffect(() => {
    if (drawn !== null && drawn !== current) setCurrent(drawn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawn, current]);
  ToolJet.useAction({ name: 'next', displayName: 'Next' }, () => go((c) => c + 1));
  ToolJet.useAction({ name: 'prev', displayName: 'Previous' }, () => go((c) => c - 1));
  ToolJet.useAction({ name: 'setCurrent', displayName: 'Set current', params: [{ handle: 'current', displayName: 'Step index' }] }, (n) => go(Number(n) || 0));
  return (
    <AntProvider tokens={tokens}>
      <SpinOver loading={loading} as="block">
        <AntSteps
          items={items}
          current={drawn ?? (Number(current) || 0)}
          direction={direction as 'horizontal'}
          size={size as 'default'}
          type={type as 'default'}
          status={status as 'process'}
          progressDot={progressDot}
          onChange={clickable ? (n) => go(n) : undefined}
        />
      </SpinOver>
    </AntProvider>
  );
};

// Ant's Timeline: items [{ children, label, color }], mode (left, alternate, right), pending, reverse.
export const Timeline = () => {
  const [rawItems] = ToolJet.useStateArray({ name: 'items', label: 'Items', description: '[{ children, label, color }]', initialValue: [
    { children: 'Order placed', label: '09:12', color: 'blue' },
    { children: 'Payment confirmed', label: '09:14', color: 'green' },
    { children: 'Packed at the warehouse', label: '13:40', color: 'blue' },
    { children: 'Out for delivery', label: '08:05', color: 'gray' },
  ] });
  const [mode] = ToolJet.useStateEnumeration({ name: 'mode', label: 'Mode', enumDefinition: ['left', 'alternate', 'right'], initialValue: 'left' });
  const [pending] = ToolJet.useStateString({ name: 'pending', label: 'Pending', description: 'A last, in-progress item.', initialValue: '' });
  const [reverse] = ToolJet.useStateBoolean({ name: 'reverse', label: 'Reverse', initialValue: false });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 16, defaultHeight: 20 });
  const items = toArray(rawItems).map((o) => {
    if (typeof o === 'string') return { children: o };
    const r = (o ?? {}) as Row;
    return { children: str(r.children ?? r.title ?? r.description), label: str(r.label ?? r.time) || undefined, color: str(r.color) || undefined };
  });
  return (
    <AntProvider tokens={tokens} className="tj-ant-timeline">
      <SpinOver loading={loading} as="block">
        <AntTimeline items={items} mode={mode as 'left'} pending={pending || undefined} reverse={reverse} />
      </SpinOver>
    </AntProvider>
  );
};

