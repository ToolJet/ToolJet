import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Badge, Button, Card, Empty, List, Progress, Space, Statistic, Tag, Typography } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { AntProvider, useTokenStyles } from '../lib/AntProvider';
import { SpinOver, TextBone } from '../lib/Loading';
import { MAX_SLOT_ITEMS, rowIdOf, str, toArray, type Row } from '../lib/data';
import { antIcon } from '../lib/icons';
import { cardItems, chipLabel, chipTone, colorFor, initials, recordItems } from '../lib/ui2/display/lists/model';
import { summaryFigures } from '../lib/ui2/display/summary';
import { progressEntries, progressItem, progressMax } from '../lib/ui2/charts/progressModel';

// The tone a status word reads as (lists/model chipTone) -> Ant's Tag status colour.
const TONE_TAG: Record<string, string> = { success: 'success', warning: 'warning', danger: 'error', info: 'processing', neutral: 'default' };
export const toneTag = (value: unknown, colors?: unknown) => colorFor(value, colors) ?? TONE_TAG[chipTone(value)] ?? 'default';
const TONE_STATUS: Record<string, 'success' | 'exception' | 'normal' | 'active'> = { success: 'success', danger: 'exception' };
const plainRow = (row: Row) => {
  const { __key: _k, ...rest } = row as Row & { __key?: string };
  return rest;
};

/** Ant Avatar for a row: the image, else the initials on a tinted circle. */
export const RowAvatar = ({ image, name, size = 32, shape = 'circle' }: { image?: string; name?: string; size?: number; shape?: 'circle' | 'square' }) =>
  image ? <Avatar src={image} size={size} shape={shape} /> : <Avatar size={size} shape={shape}>{initials(name)}</Avatar>;

// ---- Hero ------------------------------------------------------------------------------------------------------------

// Text a Hero prop is bound to, whatever its shape: UI 2.0's Hero takes meta as facts ([{ label, value }]), and a list
// of objects drawn as React children crashed the page ("Objects are not valid as a React child").
const heroText = (v: unknown): string => {
  if (Array.isArray(v)) return v.map(heroText).filter(Boolean).join(' · ');
  if (v && typeof v === 'object') {
    const r = v as Row;
    const value = heroText(r.value ?? r.text ?? '');
    const label = str(r.label ?? '');
    return label && value ? `${label}: ${value}` : label || value;
  }
  return v === null || v === undefined ? '' : str(v);
};

// A page header in Ant's terms (Typography Title over a subTitle, primary and default Buttons, an aside Statistic):
// eyebrow, title, subTitle, meta, actionLabel / secondaryActionLabel (onActionClicked, onSecondaryActionClicked),
// asideValue / asideLabel, icon, background (plain, tint, gradient, image, dark, solid), imageUrl, align, size.
export const Hero = () => {
  const [eyebrowRaw] = ToolJet.useStateString({ name: 'eyebrow', label: 'Eyebrow', initialValue: '' });
  const [titleRaw] = ToolJet.useStateString({ name: 'title', label: 'Title', initialValue: 'Good morning' });
  const [subTitleRaw] = ToolJet.useStateString({ name: 'subTitle', label: 'Sub title', initialValue: 'Here is what changed since yesterday.' });
  const [metaRaw] = ToolJet.useStateString({ name: 'meta', label: 'Meta', initialValue: '' });
  const [actionLabelRaw] = ToolJet.useStateString({ name: 'actionLabel', label: 'Action label', initialValue: '' });
  const [secondaryActionLabelRaw] = ToolJet.useStateString({ name: 'secondaryActionLabel', label: 'Secondary action label', initialValue: '' });
  const [asideValueRaw] = ToolJet.useStateString({ name: 'asideValue', label: 'Aside value', initialValue: '' });
  const [asideLabelRaw] = ToolJet.useStateString({ name: 'asideLabel', label: 'Aside label', initialValue: '' });
  const [eyebrow, title, subTitle, meta, actionLabel, secondaryActionLabel, asideValue, asideLabel] = [eyebrowRaw, titleRaw, subTitleRaw, metaRaw, actionLabelRaw, secondaryActionLabelRaw, asideValueRaw, asideLabelRaw].map(heroText);
  const [icon] = ToolJet.useStateString({ name: 'icon', label: 'Icon', description: 'An Ant icon name (RocketOutlined) or a word (rocket).', initialValue: '' });
  const [background] = ToolJet.useStateEnumeration({ name: 'background', label: 'Background', enumDefinition: ['plain', 'tint', 'gradient', 'image', 'dark', 'solid'], initialValue: 'tint' });
  const [imageUrl] = ToolJet.useStateString({ name: 'imageUrl', label: 'Image URL', initialValue: '', visibleWhen: { key: 'background', value: 'image' } });
  const [align] = ToolJet.useStateEnumeration({ name: 'align', label: 'Align', enumDefinition: ['left', 'center'], initialValue: 'left' });
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['compact', 'default', 'large'], initialValue: 'default' });
  const onActionClicked = ToolJet.useEventCallback({ name: 'onActionClicked' });
  const onSecondaryActionClicked = ToolJet.useEventCallback({ name: 'onSecondaryActionClicked' });
  const { disabled, loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 43, defaultHeight: 20 });
  const Icon = antIcon(icon);
  const onDark = background === 'dark' || background === 'solid' || (background === 'image' && !!imageUrl);
  const level = size === 'large' ? 1 : size === 'compact' ? 3 : 2;
  return (
    <AntProvider tokens={tokens} fill className="tj-ant-hero-root tj-ant-scroll">
      <div
        className={`tj-ant-hero is-${background} is-${size} is-${align}${onDark ? ' on-dark' : ''}`}
        style={background === 'image' && imageUrl ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.55)), url("${imageUrl}")` } : undefined}
      >
        <div className="tj-ant-hero-main">
          {Icon ? (
            <span className="tj-ant-hero-icon">
              <Icon />
            </span>
          ) : null}
          {eyebrow ? <div className="tj-ant-hero-eyebrow">{eyebrow}</div> : null}
          {title ? (
            <Typography.Title level={level} style={{ margin: 0 }}>
              {title}
            </Typography.Title>
          ) : null}
          {subTitle ? <Typography.Paragraph className="tj-ant-hero-sub">{subTitle}</Typography.Paragraph> : null}
          {meta ? <div className="tj-ant-hero-meta">{meta}</div> : null}
          {actionLabel || secondaryActionLabel ? (
            <Space wrap className="tj-ant-hero-actions">
              {actionLabel ? (
                <Button type="primary" size={size === 'large' ? 'large' : 'middle'} disabled={disabled} loading={loading} onClick={() => onActionClicked()}>
                  {actionLabel}
                </Button>
              ) : null}
              {secondaryActionLabel ? (
                <Button size={size === 'large' ? 'large' : 'middle'} ghost={onDark} disabled={disabled} onClick={() => onSecondaryActionClicked()}>
                  {secondaryActionLabel}
                </Button>
              ) : null}
            </Space>
          ) : null}
        </div>
        {asideValue ? (
          <div className="tj-ant-hero-aside">
            <Statistic title={asideLabel || undefined} value={asideValue} />
          </div>
        ) : null}
      </div>
    </AntProvider>
  );
};

// ---- SummaryStrip ----------------------------------------------------------------------------------------------------

// A row of Ant Statistics: items [{ label, value, format, delta, deltaFormat, tone, lowerIsBetter, caption }],
// valueFormat, currency, deltaFormat, appearance (panel, plain, cards), size, align.
export const SummaryStrip = () => {
  const [items] = ToolJet.useStateArray({ name: 'items', label: 'Items', description: "[{ label, value, delta: 0.12, caption: 'vs last month' }]", initialValue: [
    { label: 'Revenue', value: 48250, format: 'currency', delta: 0.12, caption: 'vs last month' },
    { label: 'Orders', value: 1284, delta: 0.08, caption: 'vs last month' },
    {
      label: 'Refund rate',
      value: 0.021,
      format: 'percent',
      delta: -0.004,
      deltaFormat: 'number',
      lowerIsBetter: true,
      caption: 'vs last month',
    },
    { label: 'Avg. delivery', value: '2.4 days', caption: 'last 30 days' },
  ] });
  const [valueFormat] = ToolJet.useStateEnumeration({ name: 'valueFormat', label: 'Value format', enumDefinition: ['auto', 'number', 'currency', 'percent', 'compact', 'date'], initialValue: 'auto' });
  const [currency] = ToolJet.useStateString({ name: 'currency', label: 'Currency', initialValue: 'USD' });
  const [deltaFormat] = ToolJet.useStateEnumeration({ name: 'deltaFormat', label: 'Delta format', enumDefinition: ['percent', 'number', 'currency'], initialValue: 'percent' });
  const [appearance] = ToolJet.useStateEnumeration({ name: 'appearance', label: 'Appearance', enumDefinition: ['panel', 'plain', 'cards'], initialValue: 'panel' });
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['sm', 'default', 'lg'], initialValue: 'default' });
  const [align] = ToolJet.useStateEnumeration({ name: 'align', label: 'Align', enumDefinition: ['left', 'center'], initialValue: 'left' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 43, defaultHeight: 13 });
  const figures = summaryFigures(toArray(items), { valueFormat, currency, deltaFormat });
  const fontSize = size === 'sm' ? 20 : size === 'lg' ? 30 : 24;
  return (
    <AntProvider tokens={tokens}>
      <div className={`tj-ant-strip is-${appearance} is-${align}`} style={{ gridTemplateColumns: `repeat(${Math.max(1, figures.length)}, minmax(0, 1fr))` }}>
        {/* Loading draws each item's parts at their own sizes (a label line, the figure's line, the delta line), so
            the strip keeps its height: Ant's own Statistic loading drew a paragraph taller than the figure. */}
        {figures.map((f) => (
          <div key={f.key} className="tj-ant-strip-item" aria-busy={loading || undefined}>
            <Statistic
              title={f.label ? (loading ? <TextBone part="title" /> : f.label) : undefined}
              value={f.value}
              valueRender={loading ? () => <TextBone part="figure" /> : undefined}
              valueStyle={{ fontSize }}
            />
            {f.delta || f.caption ? (
              <div className="tj-ant-stat-trend">
                {loading ? (
                  <TextBone part="trend" />
                ) : (
                  <>
                    {f.delta ? (
                      <span className={`tj-ant-stat-change ${f.delta.tone === 'positive' ? 'is-up' : f.delta.tone === 'negative' ? 'is-down' : ''}`}>
                        {f.delta.direction > 0 ? <ArrowUpOutlined /> : f.delta.direction < 0 ? <ArrowDownOutlined /> : null}
                        {f.delta.text}
                      </span>
                    ) : null}
                    {f.caption ? <span className="tj-ant-stat-extra">{f.caption}</span> : null}
                  </>
                )}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </AntProvider>
  );
};

// ---- RecordList, CardGrid, ProgressList -----------------------------------------------------------------------------

type Selectable = { key: string; row: Row; index: number };

// The selection of a RecordList, CardGrid or ProgressList. It follows its record by key across a refresh or a reorder
// (the record and its index exposed as they are now) and clears once the record is gone: set only on a click, the old
// record and index stayed exposed while the rows moved on (SP-31). selectedItemId keeps the id's own type (1, not '1').
const useSelection = (items: Selectable[], idField: unknown) => {
  const [, setSelectedItemId] = ToolJet.useStateString({ name: 'selectedItemId', initialValue: '', inspector: 'hidden' });
  const [selectedItem, setSelectedItem] = ToolJet.useStateObject({ name: 'selectedItem', initialValue: {}, inspector: 'hidden' });
  const [selectedItemIndex, setSelectedItemIndex] = ToolJet.useStateNumber({ name: 'selectedItemIndex', initialValue: -1, inspector: 'hidden' });
  const [selectedKey, setSelectedKey] = useState('');
  const idOf = (it: Selectable) => {
    const row = it.row && typeof it.row === 'object' ? it.row : {};
    const id = rowIdOf(row as Row, str(idField) || 'id', -1);
    return id === -1 ? it.key : id;
  };
  const select = (it: Selectable | null) => {
    setSelectedKey(it ? it.key : '');
    setSelectedItemId((it ? idOf(it) : '') as string);
    setSelectedItem(it ? it.row : {});
    setSelectedItemIndex(it ? it.index : -1);
  };
  const rowsKey = JSON.stringify(items.map((it) => [it.key, it.index, it.row]));
  useEffect(() => {
    if (!selectedKey) return;
    const hit = items.find((it) => it.key === selectedKey);
    if (!hit) select(null);
    else if (hit.index !== selectedItemIndex || JSON.stringify(hit.row) !== JSON.stringify(selectedItem)) select(hit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowsKey]);
  return { selectedItemId: selectedKey, select };
};

// Ant's List of records: dataSource, titleField, avatarField, metaFields (fields joined under the title), statusField
// (a status Tag, statusColors), valueField (formatted by valueFormat, currency), progressField; showAvatar, avatarShape,
// size, split (dividers), bordered; onItemClicked with selectedItem, selectedItemId, selectedItemIndex exposed.
export const RecordList = () => {
  const [dataSource] = ToolJet.useStateArray({ name: 'dataSource', label: 'Data source', initialValue: [
    { id: 1, name: 'Maya Chen', email: 'maya@example.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Owen Hart', email: 'owen@example.com', role: 'Editor', status: 'Active' },
    { id: 3, name: 'Priya Nair', email: 'priya@example.com', role: 'Viewer', status: 'Invited' },
    { id: 4, name: 'Leo Martins', email: 'leo@example.com', role: 'Editor', status: 'Suspended' },
  ] });
  const [titleField] = ToolJet.useStateString({ name: 'titleField', label: 'Title field', initialValue: 'name' });
  const [avatarField] = ToolJet.useStateString({ name: 'avatarField', label: 'Avatar field', initialValue: '' });
  const [metaFields] = ToolJet.useStateArray({ name: 'metaFields', label: 'Meta fields', description: "['email', 'company']", initialValue: ['email', 'role'] });
  const [statusField] = ToolJet.useStateString({ name: 'statusField', label: 'Status field', initialValue: 'status' });
  const [progressField] = ToolJet.useStateString({ name: 'progressField', label: 'Progress field', initialValue: '' });
  const [valueField] = ToolJet.useStateString({ name: 'valueField', label: 'Value field', initialValue: '' });
  const [valueFormat] = ToolJet.useStateEnumeration({ name: 'valueFormat', label: 'Value format', enumDefinition: ['auto', 'number', 'currency', 'percent', 'compact', 'date', 'datetime'], initialValue: 'auto' });
  const [currency] = ToolJet.useStateString({ name: 'currency', label: 'Currency', initialValue: 'USD' });
  const [statusColors] = ToolJet.useStateObject({ name: 'statusColors', label: 'Status colors', initialValue: {} });
  const [idField] = ToolJet.useStateString({ name: 'idField', label: 'Id field', initialValue: 'id' });
  const [showAvatar] = ToolJet.useStateBoolean({ name: 'showAvatar', label: 'Show avatar', initialValue: true });
  const [avatarShape] = ToolJet.useStateEnumeration({ name: 'avatarShape', label: 'Avatar shape', enumDefinition: ['circle', 'square'], initialValue: 'circle' });
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['small', 'default', 'large'], initialValue: 'default' });
  const [split] = ToolJet.useStateBoolean({ name: 'split', label: 'Split', initialValue: true });
  const [bordered] = ToolJet.useStateBoolean({ name: 'bordered', label: 'Bordered', initialValue: true });
  const [emptyText] = ToolJet.useStateString({ name: 'emptyText', label: 'Empty text', initialValue: 'No records' });
  const onItemClicked = ToolJet.useEventCallback({ name: 'onItemClicked' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 30 });
  const items = recordItems(toArray(dataSource), { titleField, avatarField, metaFields, statusField, progressField, valueField, valueFormat, currency, idField });
  const { selectedItemId, select } = useSelection(items, idField);
  return (
    <AntProvider tokens={tokens} fill className="tj-ant-list tj-ant-scroll">
      <List
        dataSource={items}
        size={size as 'default'}
        split={split}
        bordered={bordered}
        loading={loading}
        locale={{ emptyText }}
        rowKey="key"
        renderItem={(it) => (
          <List.Item
            className={it.key === selectedItemId ? 'tj-ant-item is-selected' : 'tj-ant-item'}
            onClick={() => {
              select(it as unknown as Selectable);
              onItemClicked();
            }}
            extra={
              it.status || it.value ? (
                <Space size={8}>
                  {it.status ? <Tag color={toneTag(it.status, statusColors)}>{chipLabel(it.status)}</Tag> : null}
                  {it.value ? <Typography.Text strong>{it.value}</Typography.Text> : null}
                </Space>
              ) : undefined
            }
          >
            <List.Item.Meta
              avatar={showAvatar && avatarField ? <RowAvatar image={it.image} name={it.avatarName} shape={avatarShape as 'circle'} /> : undefined}
              title={it.title}
              description={
                it.meta || it.progress !== null ? (
                  <>
                    {it.meta ? <div>{it.meta}</div> : null}
                    {it.progress !== null ? <Progress percent={it.progress} size="small" /> : null}
                  </>
                ) : undefined
              }
            />
          </List.Item>
        )}
      />
    </AntProvider>
  );
};

// A grid of Ant Cards: dataSource, titleField, subtitleField, imageField (the cover), badgeField / badgeFields (Tags),
// eyebrowField, avatarField, descriptionField, progressField, metaFields; layout (stacked, row), columns (0: as many as
// fit minCardWidth), imageAspect, showImage, variant (outlined, borderless), hoverable; onCardClicked with the selection.
export const CardGrid = () => {
  const [dataSource] = ToolJet.useStateArray({ name: 'dataSource', label: 'Data source', initialValue: [
    { id: 1, title: 'Lemon herb roast chicken', category: 'Dinner', description: 'Crisp skin, bright pan sauce' },
    { id: 2, title: 'Miso glazed salmon', category: 'Dinner', description: 'Sweet, salty, ten minutes under the grill' },
    { id: 3, title: 'Blueberry oat pancakes', category: 'Breakfast', description: 'Fluffy, no buttermilk needed' },
  ] });
  const [titleField] = ToolJet.useStateString({ name: 'titleField', label: 'Title field', initialValue: 'title' });
  const [subtitleField] = ToolJet.useStateString({ name: 'subtitleField', label: 'Subtitle field', initialValue: '' });
  const [imageField] = ToolJet.useStateString({ name: 'imageField', label: 'Image field', initialValue: '' });
  const [badgeField] = ToolJet.useStateString({ name: 'badgeField', label: 'Badge field', initialValue: 'category' });
  const [badgeFields] = ToolJet.useStateArray({ name: 'badgeFields', label: 'Badge fields', initialValue: [] });
  const [eyebrowField] = ToolJet.useStateString({ name: 'eyebrowField', label: 'Eyebrow field', initialValue: '' });
  const [avatarField] = ToolJet.useStateString({ name: 'avatarField', label: 'Avatar field', initialValue: '' });
  const [descriptionField] = ToolJet.useStateString({ name: 'descriptionField', label: 'Description field', initialValue: 'description' });
  const [progressField] = ToolJet.useStateString({ name: 'progressField', label: 'Progress field', initialValue: '' });
  const [metaFields] = ToolJet.useStateArray({ name: 'metaFields', label: 'Meta fields', initialValue: [] });
  const [idField] = ToolJet.useStateString({ name: 'idField', label: 'Id field', initialValue: 'id' });
  const [layout] = ToolJet.useStateEnumeration({ name: 'layout', label: 'Layout', enumDefinition: ['stacked', 'row'], initialValue: 'stacked' });
  const [columns] = ToolJet.useStateNumber({ name: 'columns', label: 'Columns', description: '0 fits as many as minCardWidth allows.', initialValue: 0, min: 0, max: 8 });
  const [minCardWidth] = ToolJet.useStateNumber({ name: 'minCardWidth', label: 'Min card width (px)', initialValue: 240, min: 120 });
  const [imageAspect] = ToolJet.useStateEnumeration({ name: 'imageAspect', label: 'Image aspect', enumDefinition: ['16/9', '4/3', '1/1'], initialValue: '16/9' });
  const [showImage] = ToolJet.useStateBoolean({ name: 'showImage', label: 'Show image', initialValue: true });
  const [variant] = ToolJet.useStateEnumeration({ name: 'variant', label: 'Variant', enumDefinition: ['outlined', 'borderless'], initialValue: 'outlined' });
  const [hoverable] = ToolJet.useStateBoolean({ name: 'hoverable', label: 'Hoverable', initialValue: true });
  const [emptyText] = ToolJet.useStateString({ name: 'emptyText', label: 'Empty text', initialValue: 'No items' });
  const onCardClicked = ToolJet.useEventCallback({ name: 'onCardClicked' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  // One row of the three sample cards (about 154px), not a 396px box left mostly blank.
  ToolJet.useComponentSettings({ defaultWidth: 43, defaultHeight: 16 });
  const items = cardItems(toArray(dataSource), { titleField, subtitleField, imageField, badgeField, badgeFields, eyebrowField, avatarField, descriptionField, progressField, metaFields, idField });
  const { selectedItemId, select } = useSelection(items, idField);
  const cols = Number(columns) > 0 ? `repeat(${Number(columns)}, minmax(0, 1fr))` : `repeat(auto-fill, minmax(${Math.max(120, Number(minCardWidth) || 240)}px, 1fr))`;
  if (!items.length && !loading)
    return (
      <AntProvider tokens={tokens}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />
      </AntProvider>
    );
  return (
    <AntProvider tokens={tokens}>
      <div className="tj-ant-cardgrid" style={{ gridTemplateColumns: cols }}>
        {loading
          ? // A loaded card's two lines (title, subtitle), not Ant's four-paragraph skeleton, which is taller than the
            // one-row default and is cut at the bottom.
            [0, 1, 2].map((i) => (
              <Card key={i} variant={variant as 'outlined'} className={`tj-ant-gridcard is-${layout}`}>
                <TextBone part="title" />
                <TextBone part="trend" />
              </Card>
            ))
          : items.map((it) => (
              <Card
                key={it.key}
                hoverable={hoverable}
                variant={variant as 'outlined'}
                className={`tj-ant-gridcard is-${layout}${it.key === selectedItemId ? ' is-selected' : ''}`}
                cover={showImage && it.image ? <img alt={it.title} src={it.image} style={{ aspectRatio: imageAspect, objectFit: 'cover' }} /> : undefined}
                onClick={() => {
                  select(it as unknown as Selectable);
                  onCardClicked();
                }}
              >
                {it.eyebrow ? <div className="tj-ant-hero-eyebrow">{it.eyebrow}</div> : null}
                <Card.Meta
                  avatar={it.avatar ? <RowAvatar image={it.avatar.image} name={it.avatar.name} /> : undefined}
                  title={it.title}
                  description={it.subtitle || undefined}
                />
                {it.description ? (
                  <Typography.Paragraph type="secondary" ellipsis={{ rows: 3 }} style={{ margin: '8px 0 0' }}>
                    {it.description}
                  </Typography.Paragraph>
                ) : null}
                {it.badges.length ? (
                  <div className="tj-ant-kanban-tags">
                    {it.badges.map((b) => (
                      <Tag key={b} color={toneTag(b)}>
                        {chipLabel(b)}
                      </Tag>
                    ))}
                  </div>
                ) : null}
                {it.progress !== null ? <Progress percent={it.progress} size="small" /> : null}
                {it.meta ? <Typography.Text type="secondary">{it.meta}</Typography.Text> : null}
              </Card>
            ))}
      </div>
    </AntProvider>
  );
};

// Rows of Ant Progress bars: dataSource, labelField, valueField, targetField (or percentField), captionField,
// statusField (the bar's status colour), valueFormat, currency, autoTone (goal: green when reached; limit: red when
// over), showValues, showPercent, size (small, default, large), bordered; onItemClicked with the selection.
export const ProgressList = () => {
  const [dataSource] = ToolJet.useStateArray({ name: 'dataSource', label: 'Data source', initialValue: [
    { id: 1, label: 'Design', value: 72 },
    { id: 2, label: 'Engineering', value: 58 },
    { id: 3, label: 'Marketing', value: 41 },
    { id: 4, label: 'Support', value: 86 },
  ] });
  const [labelField] = ToolJet.useStateString({ name: 'labelField', label: 'Label field', initialValue: 'label' });
  const [valueField] = ToolJet.useStateString({ name: 'valueField', label: 'Value field', initialValue: 'value' });
  const [targetField] = ToolJet.useStateString({ name: 'targetField', label: 'Target field', initialValue: '' });
  const [percentField] = ToolJet.useStateString({ name: 'percentField', label: 'Percent field', initialValue: '' });
  const [captionField] = ToolJet.useStateString({ name: 'captionField', label: 'Caption field', initialValue: '' });
  const [statusField] = ToolJet.useStateString({ name: 'statusField', label: 'Status field', initialValue: '' });
  const [valueFormat] = ToolJet.useStateEnumeration({ name: 'valueFormat', label: 'Value format', enumDefinition: ['auto', 'number', 'currency', 'percent', 'compact'], initialValue: 'auto' });
  const [currency] = ToolJet.useStateString({ name: 'currency', label: 'Currency', initialValue: 'USD' });
  const [idField] = ToolJet.useStateString({ name: 'idField', label: 'Id field', initialValue: 'id' });
  const [autoTone] = ToolJet.useStateEnumeration({ name: 'autoTone', label: 'Auto tone', enumDefinition: ['none', 'goal', 'limit'], initialValue: 'none' });
  const [showValues] = ToolJet.useStateBoolean({ name: 'showValues', label: 'Show values', initialValue: true });
  const [showPercent] = ToolJet.useStateBoolean({ name: 'showPercent', label: 'Show percent', initialValue: true });
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['small', 'default', 'large'], initialValue: 'default' });
  const [bordered] = ToolJet.useStateBoolean({ name: 'bordered', label: 'Bordered', initialValue: false });
  const [emptyText] = ToolJet.useStateString({ name: 'emptyText', label: 'Empty text', initialValue: 'No data' });
  const onItemClicked = ToolJet.useEventCallback({ name: 'onItemClicked' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  // Tall enough for the sample's four rows; more rows scroll inside the box.
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 28 });
  const fields = { labelField, valueField, targetField, percentField, captionField, statusField, idField, valueFormat, autoTone, currency };
  const entries = progressEntries(toArray(dataSource), idField);
  const max = progressMax(entries, fields);
  const items = entries.map((e) => progressItem(e, { ...fields, max }));
  const { selectedItemId, select } = useSelection(items as unknown as Selectable[], idField);
  const stroke = size === 'small' ? 4 : size === 'large' ? 12 : 8;
  return (
    <AntProvider tokens={tokens} fill className="tj-ant-list tj-ant-scroll">
      <SpinOver loading={loading} as="block">
        <List
          dataSource={items}
          bordered={bordered}
          split={false}
          locale={{ emptyText }}
          rowKey="key"
          renderItem={(it) => (
            <List.Item
              className={it.key === selectedItemId ? 'tj-ant-item tj-ant-progress-row is-selected' : 'tj-ant-item tj-ant-progress-row'}
              onClick={() => {
                select(it as unknown as Selectable);
                onItemClicked();
              }}
            >
              <div className="tj-ant-progress-head">
                <Typography.Text>{it.label}</Typography.Text>
                <Typography.Text type="secondary">
                  {[showValues && it.value ? (it.target ? `${it.value} / ${it.target}` : it.value) : '', showPercent && it.pct !== null && !it.relative ? `${Math.round(it.pct)}%` : '']
                    .filter(Boolean)
                    .join('  ')}
                </Typography.Text>
              </div>
              <Progress percent={it.pct ?? 0} showInfo={false} size={{ height: stroke }} status={TONE_STATUS[it.tone] ?? 'normal'} strokeColor={it.tone === 'warning' ? 'var(--ant-color-warning)' : undefined} />
              {it.caption ? <Typography.Text type="secondary" className="tj-ant-progress-caption">{it.caption}</Typography.Text> : null}
            </List.Item>
          )}
        />
      </SpinOver>
    </AntProvider>
  );
};

// ---- Tags, Link, Icon, ButtonGroup, CircularProgress ----------------------------------------------------------------

// A row of Ant Tags: tags (strings, or { label, color }), tagColors ({ 'Paid': 'green' }; else the word's status
// colour), variant (filled, outlined, solid), overflow (wrap, single, scroll), round; onTagClicked with lastClickedTag.
export const Tags = () => {
  const [tags] = ToolJet.useStateArray({ name: 'tags', label: 'Tags', initialValue: ['Design', 'Frontend', 'Urgent'] });
  const [tagColors] = ToolJet.useStateObject({ name: 'tagColors', label: 'Tag colors', initialValue: {} });
  const [variant] = ToolJet.useStateEnumeration({ name: 'variant', label: 'Variant', enumDefinition: ['filled', 'outlined', 'solid'], initialValue: 'filled' });
  const [overflow] = ToolJet.useStateEnumeration({ name: 'overflow', label: 'Overflow', enumDefinition: ['wrap', 'single', 'scroll'], initialValue: 'wrap' });
  const [round] = ToolJet.useStateBoolean({ name: 'round', label: 'Round', initialValue: false });
  const [, setLastClickedTag] = ToolJet.useStateString({ name: 'lastClickedTag', initialValue: '', inspector: 'hidden' });
  const onTagClicked = ToolJet.useEventCallback({ name: 'onTagClicked' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 16, defaultHeight: 3 });
  const list = toArray(tags)
    .map((t) => (t && typeof t === 'object' ? { label: str((t as Row).label ?? (t as Row).value), color: str((t as Row).color) } : { label: str(t), color: '' }))
    .filter((t) => t.label);
  return (
    <AntProvider tokens={tokens}>
      <SpinOver loading={loading}>
        <div className={`tj-ant-tags is-${overflow}`}>
          {list.map((t) => {
            let color = t.color || colorFor(t.label, tagColors) || TONE_TAG[chipTone(t.label)];
            if (variant === 'solid' && color && !/^(#|rgb|hsl|default)/.test(color)) color = `${color === 'processing' ? 'blue' : color === 'error' ? 'red' : color === 'success' ? 'green' : color === 'warning' ? 'orange' : color}-inverse`;
            return (
              <Tag
                key={t.label}
                color={color === 'default' ? undefined : color}
                bordered={variant === 'outlined'}
                style={{ marginInlineEnd: 0, cursor: 'pointer', borderRadius: round ? 999 : undefined }}
                onClick={() => {
                  setLastClickedTag(t.label);
                  onTagClicked();
                }}
              >
                {t.label}
              </Tag>
            );
          })}
        </div>
      </SpinOver>
    </AntProvider>
  );
};

// Ant's Typography.Link: children (the text), href, target (_blank, _self), underline (always, hover, none), strong,
// icon after the text; events onClick, onHover; actions click, setHref, setChildren.
export const Link = () => {
  const [children, setChildren] = ToolJet.useStateString({ name: 'children', label: 'Text', initialValue: 'Link' });
  const [href, setHref] = ToolJet.useStateString({ name: 'href', label: 'Href', initialValue: '' });
  const [target] = ToolJet.useStateEnumeration({ name: 'target', label: 'Target', enumDefinition: ['_blank', '_self'], initialValue: '_blank' });
  const [underline] = ToolJet.useStateEnumeration({ name: 'underline', label: 'Underline', enumDefinition: ['hover', 'always', 'none'], initialValue: 'hover' });
  const [strong] = ToolJet.useStateBoolean({ name: 'strong', label: 'Strong', initialValue: false });
  const [showIcon] = ToolJet.useStateBoolean({ name: 'showIcon', label: 'Show icon', initialValue: false });
  const onClick = ToolJet.useEventCallback({ name: 'onClick' });
  const onHover = ToolJet.useEventCallback({ name: 'onHover' });
  const ref = useRef<HTMLAnchorElement>(null);
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 6, defaultHeight: 3 });
  ToolJet.useAction({ name: 'click', displayName: 'Click' }, () => ref.current?.click());
  ToolJet.useAction({ name: 'setHref', displayName: 'Set href', params: [{ handle: 'href', displayName: 'Href' }] }, (v) => setHref(str(v)));
  ToolJet.useAction({ name: 'setChildren', displayName: 'Set text', params: [{ handle: 'text', displayName: 'Text' }] }, (v) => setChildren(str(v)));
  const Ext = antIcon('ExportOutlined');
  return (
    <AntProvider tokens={tokens} fill className="tj-ant-center tj-ant-start">
      <SpinOver loading={loading}>
        <Typography.Link
          ref={ref}
          href={href || undefined}
          target={href ? target : undefined}
          strong={strong}
          className={`tj-ant-link is-${underline}`}
          onClick={() => onClick()}
          onMouseEnter={() => onHover()}
        >
          {children}
          {showIcon && Ext ? (
            <>
              {' '}
              <Ext />
            </>
          ) : null}
        </Typography.Link>
      </SpinOver>
    </AntProvider>
  );
};

const TONE_COLOR: Record<string, string> = {
  default: 'var(--ant-color-text)',
  muted: 'var(--ant-color-text-tertiary)',
  primary: 'var(--ant-color-primary)',
  success: 'var(--ant-color-success)',
  warning: 'var(--ant-color-warning)',
  danger: 'var(--ant-color-error)',
};

// An @ant-design/icons icon: icon (an Ant name, SearchOutlined, or a word, search), size, type (default, muted, primary,
// success, warning, danger), chip (none, circle, square: a tinted background), chipSize; events onClick, onHover.
export const Icon = () => {
  const [icon] = ToolJet.useStateString({ name: 'icon', label: 'Icon', description: 'An Ant icon name or a word: TeamOutlined, users, rocket.', initialValue: 'StarOutlined' });
  const [size] = ToolJet.useStateNumber({ name: 'size', label: 'Size (px)', initialValue: 20, min: 8, max: 200 });
  const [type] = ToolJet.useStateEnumeration({ name: 'type', label: 'Type', enumDefinition: ['default', 'muted', 'primary', 'success', 'warning', 'danger'], initialValue: 'default' });
  const [chip] = ToolJet.useStateEnumeration({ name: 'chip', label: 'Chip', enumDefinition: ['none', 'circle', 'square'], initialValue: 'none' });
  const [chipSize] = ToolJet.useStateNumber({ name: 'chipSize', label: 'Chip size (px)', initialValue: 40, min: 16, max: 240, visibleWhen: { key: 'chip', value: 'circle' } });
  const onClick = ToolJet.useEventCallback({ name: 'onClick' });
  const onHover = ToolJet.useEventCallback({ name: 'onHover' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 3, defaultHeight: 4 });
  ToolJet.useAction({ name: 'click', displayName: 'Click' }, () => onClick());
  const Glyph = antIcon(icon);
  const color = TONE_COLOR[type] ?? TONE_COLOR.default;
  const px = Math.max(8, Math.min(200, Number(size) || 20));
  const box = Math.max(px + 8, Number(chipSize) || 40);
  return (
    <AntProvider tokens={tokens} fill className="tj-ant-center tj-ant-start">
      <SpinOver loading={loading}>
        <span
          className={`tj-ant-icon is-${chip}`}
          style={{
            color,
            fontSize: px,
            ...(chip !== 'none' ? { width: box, height: box, background: `color-mix(in srgb, ${color} 12%, transparent)`, borderRadius: chip === 'circle' ? '50%' : 'var(--ant-border-radius-lg)' } : {}),
          }}
          onClick={() => onClick()}
          onMouseEnter={() => onHover()}
        >
          {Glyph ? <Glyph /> : null}
        </span>
      </SpinOver>
    </AntProvider>
  );
};

// value is the text the buttons match by; raw is the value as given (a number stays a number when exposed).
type GroupButton = { value: string; raw: unknown; label: string; icon?: string; disabled?: boolean; danger?: boolean };

// Ant Buttons joined (Space.Compact): buttons [{ value, label, icon, disabled, danger }], mode (actions: each fires
// onClick; single and multiple: a selection, value exposed, onChange; none: display), value, allowDeselect, type
// (default, primary, dashed, text), size, direction (horizontal, vertical), block, label; lastClicked exposed; actions
// setSelected, clear.
export const ButtonGroup = (props: Record<string, unknown>) => {
  const [label] = ToolJet.useStateString({ name: 'label', label: 'Label', initialValue: '' });
  const [buttons] = ToolJet.useStateArray({ name: 'buttons', label: 'Buttons', description: "[{ value: 'week', label: 'Week' }]", initialValue: [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
  ] });
  const [mode] = ToolJet.useStateEnumeration({ name: 'mode', label: 'Mode', enumDefinition: ['actions', 'single', 'multiple', 'none'], initialValue: 'actions' });
  const [value, setValue] = ToolJet.useStateString({ name: 'value', label: 'Value', description: 'The selected value; an array in multiple mode.', initialValue: '' });
  const [allowDeselect] = ToolJet.useStateBoolean({ name: 'allowDeselect', label: 'Allow deselect', initialValue: false });
  const [type] = ToolJet.useStateEnumeration({ name: 'type', label: 'Type', enumDefinition: ['default', 'primary', 'dashed', 'text'], initialValue: 'default' });
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['small', 'middle', 'large'], initialValue: 'middle' });
  const [direction] = ToolJet.useStateEnumeration({ name: 'direction', label: 'Direction', enumDefinition: ['horizontal', 'vertical'], initialValue: 'horizontal' });
  const [block] = ToolJet.useStateBoolean({ name: 'block', label: 'Block', initialValue: false });
  const [, setLastClicked] = ToolJet.useStateString({ name: 'lastClicked', initialValue: '', inspector: 'hidden' });
  const onClick = ToolJet.useEventCallback({ name: 'onClick' });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const { disabled, loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 16, defaultHeight: 4 });
  const list: GroupButton[] = toArray(buttons)
    .map((b): GroupButton | null => {
      if (typeof b === 'string' || typeof b === 'number') return { value: String(b), raw: b, label: String(b) };
      const r = (b ?? {}) as Row;
      const given = r.value ?? r.id ?? r.label;
      const v = str(given);
      return v ? { value: v, raw: given, label: str(r.label ?? v), icon: str(r.icon) || undefined, disabled: Boolean(r.disabled), danger: Boolean(r.danger) } : null;
    })
    .filter((b): b is GroupButton => !!b);
  const current: unknown = value;
  const selected = Array.isArray(current) ? current.map(str) : current === '' || current === undefined || current === null ? [] : [str(current)];
  // Exposed as the buttons give their values: 1 stays 1, not '1'. A value no button has stays as it was given.
  const rawOf = (v: string) => list.find((b) => b.value === v)?.raw ?? v;
  const set = (next: string[]) => {
    const values = next.map(rawOf);
    setValue((mode === 'multiple' ? values : values[0] ?? '') as string);
    onChange();
  };
  ToolJet.useAction({ name: 'setSelected', displayName: 'Set selected', params: [{ handle: 'value', displayName: 'Value' }] }, (v) =>
    set(Array.isArray(v) ? (v as unknown[]).map(str) : v === '' || v === undefined ? [] : [str(v)])
  );
  ToolJet.useAction({ name: 'clear', displayName: 'Clear' }, () => set([]));
  void props;
  const click = (b: GroupButton) => {
    setLastClicked(b.raw as string);
    if (mode === 'single') {
      if (selected[0] === b.value) {
        if (allowDeselect) set([]);
      } else set([b.value]);
    } else if (mode === 'multiple') set(selected.includes(b.value) ? selected.filter((v) => v !== b.value) : [...selected, b.value]);
    onClick();
  };
  return (
    <AntProvider tokens={tokens}>
      <SpinOver loading={loading}>
        {label ? <div className="tj-ant-field-label">{label}</div> : null}
        <Space.Compact direction={direction as 'horizontal'} block={block} size={size as 'middle'}>
          {list.map((b) => {
            const Glyph = antIcon(b.icon);
            const on = selected.includes(b.value) && (mode === 'single' || mode === 'multiple');
            return (
              <Button
                key={b.value}
                type={on ? 'primary' : (type as 'default')}
                danger={b.danger}
                icon={Glyph ? <Glyph /> : undefined}
                disabled={disabled || b.disabled || mode === 'none'}
                style={block ? { flex: 1 } : undefined}
                onClick={() => click(b)}
              >
                {b.label}
              </Button>
            );
          })}
        </Space.Compact>
      </SpinOver>
    </AntProvider>
  );
};

// Ant's Progress type circle (or dashboard): percent, size (px), strokeWidth, strokeLinecap (round, butt), format
// (percent, custom text, none), text, label under the ring, status; action setPercent.
export const CircularProgress = () => {
  const [percent, setPercent] = ToolJet.useStateNumber({ name: 'percent', label: 'Percent', initialValue: 75, min: 0, max: 100 });
  const [size] = ToolJet.useStateNumber({ name: 'size', label: 'Size (px)', initialValue: 120, min: 32, max: 400 });
  const [strokeWidth] = ToolJet.useStateNumber({ name: 'strokeWidth', label: 'Stroke width', description: 'Percent of the size.', initialValue: 6, min: 1, max: 30 });
  const [strokeLinecap] = ToolJet.useStateEnumeration({ name: 'strokeLinecap', label: 'Line cap', enumDefinition: ['round', 'butt'], initialValue: 'round' });
  const [type] = ToolJet.useStateEnumeration({ name: 'type', label: 'Type', enumDefinition: ['circle', 'dashboard'], initialValue: 'circle' });
  const [format] = ToolJet.useStateEnumeration({ name: 'format', label: 'Center', enumDefinition: ['percent', 'custom', 'none'], initialValue: 'percent' });
  const [text] = ToolJet.useStateString({ name: 'text', label: 'Text', initialValue: '', visibleWhen: { key: 'format', value: 'custom' } });
  const [label] = ToolJet.useStateString({ name: 'label', label: 'Label', initialValue: '' });
  const [status] = ToolJet.useStateEnumeration({ name: 'status', label: 'Status', enumDefinition: ['normal', 'success', 'exception', 'active'], initialValue: 'normal' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 6, defaultHeight: 16 });
  ToolJet.useAction({ name: 'setPercent', displayName: 'Set percent', params: [{ handle: 'percent', displayName: 'Percent' }] }, (v) => setPercent(Math.max(0, Math.min(100, Number(v) || 0))));
  const pct = Math.max(0, Math.min(100, Number(percent) || 0));
  return (
    <AntProvider tokens={tokens} className="tj-ant-ring">
      <SpinOver loading={loading} as="block">
        <Progress
          type={type as 'circle'}
          percent={Math.round(pct * 10) / 10}
          size={Math.max(32, Math.min(400, Number(size) || 120))}
          strokeWidth={Math.max(1, Math.min(30, Number(strokeWidth) || 6))}
          strokeLinecap={strokeLinecap as 'round'}
          status={status === 'normal' ? undefined : (status as 'success')}
          format={format === 'none' ? () => '' : format === 'custom' ? () => text : undefined}
        />
        {label ? <Typography.Text type="secondary">{label}</Typography.Text> : null}
      </SpinOver>
    </AntProvider>
  );
};
