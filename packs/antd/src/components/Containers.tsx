import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Button, Card as AntCard, List as AntList, Modal as AntModal, Space, Tabs as AntTabs, Tag } from 'antd';
import { chipLabel, chipTone } from '../lib/ui2/display/lists/model';

const TONE_TAG: Record<string, string | undefined> = { success: 'success', warning: 'warning', danger: 'error', info: 'processing', neutral: undefined };
import { ToolJet } from '@tooljet/custom-component-sdk';
import { AntProvider, usePopupTheme, useTokenStyles } from '../lib/AntProvider';
import { SpinOver } from '../lib/Loading';
import { readField, rowIdOf, rowKeyOf, str, toKeyedItems, toRows, type Row } from '../lib/data';
import { formatCell } from '../lib/format';
import { slotNames } from '../lib/slots';
import { useDialogOwner } from '../lib/useOwnerGuard';

// Ant's Tabs: items [{ key, label }], activeKey, type (line, card), size, centered, tabPosition; each tab is a canvas
// of ToolJet components (slot tab_<key>); events onChange, onTabClick.
export const Tabs = () => {
  const [rawItems] = ToolJet.useStateArray({
    name: 'items',
    label: 'Items',
    description: '[{ key, label }]; each tab holds its own components.',
    initialValue: [
      { key: 'tab1', label: 'Tab 1' },
      { key: 'tab2', label: 'Tab 2' },
    ],
  });
  const [activeKey, setActiveKey] = ToolJet.useStateString({ name: 'activeKey', label: 'Active key', description: 'Empty opens the first tab.', initialValue: '' });
  const [type] = ToolJet.useStateEnumeration({ name: 'type', label: 'Type', enumDefinition: ['line', 'card'], initialValue: 'line' });
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['small', 'middle', 'large'], initialValue: 'middle' });
  const [centered] = ToolJet.useStateBoolean({ name: 'centered', label: 'Centered', initialValue: false });
  const [tabPosition] = ToolJet.useStateEnumeration({ name: 'tabPosition', label: 'Tab position', enumDefinition: ['top', 'left', 'right', 'bottom'], initialValue: 'top' });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onTabClick = ToolJet.useEventCallback({ name: 'onTabClick' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 30, defaultHeight: 40 });
  const items = toKeyedItems(rawItems);
  const slots = slotNames('tab', items.map((t) => t.key));
  // A bound number (2) names the tab keyed '2' too.
  const asked = str(activeKey);
  const current = items.some((t) => t.key === asked) ? asked : items[0]?.key;
  // activeKey exposes the tab shown: empty (the first tab) or a tab that was removed drew the first tab while the old
  // key stayed exposed (SP-20). Not an onChange, nobody picked it. An empty list is data still loading.
  useEffect(() => {
    if (current !== undefined && current !== asked) setActiveKey(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, asked]);
  const change = (key: string) => {
    setActiveKey(key);
    onChange();
  };
  ToolJet.useAction({ name: 'setActiveKey', displayName: 'Set active tab', params: [{ handle: 'key', displayName: 'Tab key' }] }, (k) => change(str(k)));

  return (
    <AntProvider tokens={tokens} fill className="tj-ant-tabs">
      <SpinOver loading={loading} as="fill">
        <AntTabs
          activeKey={current}
          type={type as 'line'}
          size={size as 'middle'}
          centered={centered}
          tabPosition={tabPosition as 'top'}
          onChange={change}
          onTabClick={() => onTabClick()}
          items={items.map((t) => ({
            key: t.key,
            label: t.label,
            disabled: t.disabled,
            children: <ToolJet.Slot name={slots.get(t.key)!} style={{ height: '100%' }} />,
          }))}
        />
      </SpinOver>
    </AntProvider>
  );
};

// Ant's Card: title, extra, variant (outlined, borderless), size, hoverable; its body is a canvas of ToolJet
// components (slot body); event onClick.
export const Card = () => {
  const [title] = ToolJet.useStateString({ name: 'title', label: 'Title', initialValue: 'Card title' });
  const [extra] = ToolJet.useStateString({ name: 'extra', label: 'Extra', description: 'Text at the right of the title.', initialValue: '' });
  const [variant] = ToolJet.useStateEnumeration({ name: 'variant', label: 'Variant', enumDefinition: ['outlined', 'borderless'], initialValue: 'outlined' });
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['default', 'small'], initialValue: 'default' });
  const [hoverable] = ToolJet.useStateBoolean({ name: 'hoverable', label: 'Hoverable', initialValue: false });
  const onClick = ToolJet.useEventCallback({ name: 'onClick' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 16, defaultHeight: 40 });
  return (
    <AntProvider tokens={tokens} fill className="tj-ant-card">
      <AntCard
        title={title || undefined}
        extra={extra || undefined}
        variant={variant as 'outlined'}
        size={size as 'default'}
        hoverable={hoverable}
        loading={loading}
        onClick={() => onClick()}
      >
        <ToolJet.Slot name="body" style={{ height: '100%' }} />
      </AntCard>
    </AntProvider>
  );
};

// Ant's Modal: open, title, content (text above the body), okText, cancelText, okType (primary, danger), width,
// centered, closable, maskClosable, footer; the body is a canvas of ToolJet components in the popup layer (slot body).
// A trigger button stands on the canvas (showTrigger). Events onOk, onCancel, afterOpen, afterClose; actions show and
// hide.
export const Modal = () => {
  const [triggerText] = ToolJet.useStateString({ name: 'triggerText', label: 'Trigger text', initialValue: 'Open' });
  const [showTrigger] = ToolJet.useStateBoolean({ name: 'showTrigger', label: 'Show trigger', description: 'A button on the canvas that opens the modal.', initialValue: true });
  const [title] = ToolJet.useStateString({ name: 'title', label: 'Title', initialValue: 'Modal title' });
  const [content] = ToolJet.useStateString({ name: 'content', label: 'Content', description: 'Text above the body components.', initialValue: '' });
  const [okText] = ToolJet.useStateString({ name: 'okText', label: 'OK text', initialValue: 'OK' });
  const [cancelText] = ToolJet.useStateString({ name: 'cancelText', label: 'Cancel text', initialValue: 'Cancel' });
  const [okType] = ToolJet.useStateEnumeration({ name: 'okType', label: 'OK type', enumDefinition: ['primary', 'danger'], initialValue: 'primary' });
  const [footer] = ToolJet.useStateBoolean({ name: 'footer', label: 'Footer', description: 'The OK and Cancel buttons.', initialValue: true });
  const [width] = ToolJet.useStateNumber({ name: 'width', label: 'Width (px)', initialValue: 520, min: 240, max: 1600 });
  const [bodyHeight] = ToolJet.useStateNumber({ name: 'bodyHeight', label: 'Body height (px)', description: '0 for no body components.', initialValue: 200, min: 0, max: 2000 });
  const [centered] = ToolJet.useStateBoolean({ name: 'centered', label: 'Centered', initialValue: true });
  const [closable] = ToolJet.useStateBoolean({ name: 'closable', label: 'Closable', initialValue: true });
  const [maskClosable] = ToolJet.useStateBoolean({ name: 'maskClosable', label: 'Mask closable', initialValue: true });
  const [open, setOpen] = ToolJet.useStateBoolean({ name: 'open', initialValue: false, inspector: 'hidden' });
  const onOk = ToolJet.useEventCallback({ name: 'onOk' });
  const onCancel = ToolJet.useEventCallback({ name: 'onCancel' });
  const afterOpen = ToolJet.useEventCallback({ name: 'afterOpen' });
  const afterClose = ToolJet.useEventCallback({ name: 'afterClose' });
  const { disabled, loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 6, defaultHeight: 4 });

  ToolJet.useAction({ name: 'show', displayName: 'Show' }, () => setOpen(true));
  ToolJet.useAction({ name: 'hide', displayName: 'Hide' }, () => setOpen(false));
  // The modal portals out of the widget, so the host's Disable (and a disabled parent, which makes the widget inert)
  // never reached its OK button: onOk still ran (SP-02). While its owner takes no input the modal stays open, keeping
  // what was typed in its body, and refuses OK; Cancel, the close button and the mask still close it.
  const owner = useRef<HTMLElement | null>(null);
  const guard = useDialogOwner(owner, !!open, disabled);

  return (
    <AntProvider tokens={tokens} fill className="tj-ant-center" ownerRef={owner}>
      {showTrigger ? (
        <Button type="primary" block disabled={disabled} onClick={() => setOpen(true)}>
          {triggerText}
        </Button>
      ) : null}
      <ModalBody
        open={!!open}
        title={title}
        content={content}
        okText={okText}
        cancelText={cancelText}
        okType={okType as 'primary'}
        footer={footer}
        width={Number(width) || 520}
        bodyHeight={Math.max(0, Math.min(2000, Number(bodyHeight) || 0))}
        centered={centered}
        closable={closable}
        maskClosable={maskClosable}
        confirmLoading={loading}
        okDisabled={guard.blocked}
        onOk={() => {
          if (!guard.takesInput()) return;
          setOpen(false);
          onOk();
        }}
        onCancel={() => {
          setOpen(false);
          onCancel();
        }}
        afterOpenChange={(next) => (next ? afterOpen() : afterClose())}
      />
    </AntProvider>
  );
};

const ModalBody = ({
  content,
  bodyHeight,
  footer,
  okType,
  okDisabled,
  ...props
}: Omit<React.ComponentProps<typeof AntModal>, 'footer' | 'content'> & {
  content: string;
  bodyHeight: number;
  footer: boolean;
  okType: 'primary' | 'danger';
  okDisabled: boolean;
}) => {
  const popup = usePopupTheme();
  // Portal only once the popup layer is known: antd would otherwise mount the modal on document.body, unstyled.
  if (!popup.container) return null;
  return (
    <AntModal
      {...props}
      getContainer={popup.container}
      rootClassName={popup.className}
      styles={{ wrapper: popup.style }}
      okButtonProps={{ danger: okType === 'danger', disabled: okDisabled }}
      footer={footer ? undefined : null}
      forceRender
    >
      {content ? <p className="tj-ant-modal-content">{content}</p> : null}
      {bodyHeight > 0 ? <ToolJet.PopupSlot name="body" style={{ height: bodyHeight }} /> : null}
    </AntModal>
  );
};

// Each row's own key: its id, a repeated id suffixed by its occurrence (1, then 1~1), so two records that share an id
// are told apart: both drew selected, and a refresh moved the selection to the first of them.
const occurrenceKeys = (rows: Row[], field: string) => {
  const seen = new Set<string>();
  return rows.map((r, i) => {
    const base = rowKeyOf(r, field, i);
    let key = base;
    for (let n = 1; seen.has(key); n += 1) key = `${base}~${n}`;
    seen.add(key);
    return key;
  });
};

// Ant's List: dataSource; each item is either a row of ToolJet components (renderItem 'components', reading
// {{listItem}}, rowHeight) or Ant's List.Item.Meta from fields (titleField, descriptionField, avatarField, extraField);
// header, footer, bordered, split, size, pageSize (0 for no pagination), locale emptyText. Event onItemClick with
// selectedItem exposed.
export const List = () => {
  const [rawData] = ToolJet.useStateArray({ name: 'dataSource', label: 'Data source', initialValue: [
    { id: 1, title: 'Quarterly report is ready', description: 'Finance shared the Q3 numbers' },
    { id: 2, title: 'New comment on Order 1042', description: 'Maya Chen: can we ship on Friday?' },
    { id: 3, title: 'Invoice 2209 paid', description: 'Received 1,250.00 USD' },
  ] });
  const [renderItem] = ToolJet.useStateEnumeration({
    name: 'renderItem',
    label: 'Render item',
    enumDefinition: ['meta', 'components'],
    enumLabels: { meta: 'Fields (List.Item.Meta)', components: 'Components' },
    initialValue: 'meta',
  });
  const [titleField] = ToolJet.useStateString({ name: 'titleField', label: 'Title field', initialValue: 'title', visibleWhen: { key: 'renderItem', value: 'meta' } });
  const [descriptionField] = ToolJet.useStateString({ name: 'descriptionField', label: 'Description field', initialValue: 'description', visibleWhen: { key: 'renderItem', value: 'meta' } });
  const [avatarField] = ToolJet.useStateString({ name: 'avatarField', label: 'Avatar field', description: 'An image URL field.', initialValue: '', visibleWhen: { key: 'renderItem', value: 'meta' } });
  const [extraField] = ToolJet.useStateString({ name: 'extraField', label: 'Extra field', description: 'Shown at the right.', initialValue: '', visibleWhen: { key: 'renderItem', value: 'meta' } });
  const [badgeField] = ToolJet.useStateString({ name: 'badgeField', label: 'Badge field', description: 'A status Tag at the right.', initialValue: '', visibleWhen: { key: 'renderItem', value: 'meta' } });
  const [rowHeight] = ToolJet.useStateNumber({ name: 'rowHeight', label: 'Row height (px)', initialValue: 64, min: 24, max: 1200, visibleWhen: { key: 'renderItem', value: 'components' } });
  const [rowKey] = ToolJet.useStateString({ name: 'rowKey', label: 'Row key', initialValue: 'id' });
  const [header] = ToolJet.useStateString({ name: 'header', label: 'Header', initialValue: '' });
  const [footer] = ToolJet.useStateString({ name: 'footer', label: 'Footer', initialValue: '' });
  const [bordered] = ToolJet.useStateBoolean({ name: 'bordered', label: 'Bordered', initialValue: true });
  const [split] = ToolJet.useStateBoolean({ name: 'split', label: 'Split', description: 'Lines between items.', initialValue: true });
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['default', 'small', 'large'], initialValue: 'default' });
  const [pageSize] = ToolJet.useStateNumber({ name: 'pageSize', label: 'Page size', description: '0 for no pagination.', initialValue: 0, min: 0, max: 500 });
  const [emptyText] = ToolJet.useStateString({ name: 'emptyText', label: 'Empty text', initialValue: 'No data' });
  const [selectedItem, setSelectedItem] = ToolJet.useStateObject({ name: 'selectedItem', initialValue: {}, inspector: 'hidden' });
  const [, setSelectedItemKey] = ToolJet.useStateString({ name: 'selectedItemKey', initialValue: '', inspector: 'hidden' });
  const onItemClick = ToolJet.useEventCallback({ name: 'onItemClick' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 30 });
  const [page, setPage] = useState(1);

  const rows = toRows(rawData);
  const size_ = Number(pageSize) > 0 ? Number(pageSize) : 0;
  const pages = size_ ? Math.max(1, Math.ceil(rows.length / size_)) : 1;
  const p = Math.min(page, pages);
  const visible = size_ ? rows.slice((p - 1) * size_, p * size_) : rows;
  const asRows = renderItem === 'components';
  const height = Math.max(24, Math.min(1200, Number(rowHeight) || 64));
  ToolJet.useRows(asRows ? visible : [], height);
  const field = str(rowKey) || 'id';
  const offset = size_ ? (p - 1) * size_ : 0;
  const rowsKey = JSON.stringify(rows);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const keys = useMemo(() => occurrenceKeys(rows, field), [rowsKey, field]);
  // The picked row's own key (its occurrence of a repeated id). Without one (nothing picked here yet), the exposed
  // record's id names it.
  const [picked, setPicked] = useState('');
  const exposedKey = selectedItem && Object.keys(selectedItem).length ? rowKeyOf(selectedItem as Row, field, -1) : '';
  const selectedKey = picked || (exposedKey ? (keys.find((k, i) => rowKeyOf(rows[i], field, i) === exposedKey) ?? '') : '');

  const select = (row: Row | null, index: number) => {
    setPicked(row && index >= 0 ? keys[index] ?? '' : '');
    setSelectedItem(row ?? {});
    setSelectedItemKey((row ? rowIdOf(row, field, index) : '') as string);
    if (row) onItemClick();
  };
  // The selection follows its record by key across a refresh or a reorder (an edited record is exposed as it is now),
  // and clears once the record is gone: the old row stayed exposed and highlighted nothing (SP-31).
  useEffect(() => {
    if (!selectedKey && !exposedKey) return;
    // A row with no id (keyed by its position, exposedKey -1) is found by its content.
    const same = JSON.stringify(selectedItem);
    const index = exposedKey === '-1' ? rows.findIndex((r) => JSON.stringify(r) === same) : selectedKey ? keys.indexOf(selectedKey) : -1;
    const row = rows[index];
    if (!row) {
      setPicked('');
      setSelectedItem({});
      setSelectedItemKey('');
      return;
    }
    if (keys[index] !== picked) setPicked(keys[index]);
    if (JSON.stringify(row) !== same) {
      setSelectedItem(row);
      setSelectedItemKey(rowIdOf(row, field, index) as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys]);
  ToolJet.useAction({ name: 'selectItem', displayName: 'Select item', params: [{ handle: 'key', displayName: 'Row key' }] }, (key) => {
    const index = rows.findIndex((r, i) => rowKeyOf(r, field, i) === str(key));
    select(rows[index] ?? null, index);
  });
  ToolJet.useAction({ name: 'clearSelection', displayName: 'Clear selection' }, () => select(null, -1));

  return (
    <AntProvider tokens={tokens} fill className="tj-ant-list tj-ant-scroll">
      <AntList<Row>
        dataSource={visible}
        header={header || undefined}
        footer={footer || undefined}
        bordered={bordered}
        split={split}
        size={size as 'default'}
        loading={loading}
        locale={{ emptyText: emptyText || 'No data' }}
        pagination={size_ && rows.length > size_ ? { current: p, pageSize: size_, total: rows.length, size: 'small', align: 'end', onChange: setPage } : false}
        rowKey={(r) => keys[visible.indexOf(r) + offset] ?? ''}
        renderItem={(row, i) => {
          const key = keys[i + offset];
          const selected = key === selectedKey;
          if (asRows)
            return (
              <AntList.Item className={selected ? 'tj-ant-item tj-ant-item--rows is-selected' : 'tj-ant-item tj-ant-item--rows'} onClickCapture={() => select(row, i + offset)}>
                <div style={{ width: '100%', minHeight: height }}>
                  <ToolJet.RowSlot name="row" index={i} item={row} />
                </div>
              </AntList.Item>
            );
          const avatar = avatarField ? str(readField(row, avatarField)) : '';
          const extraText = extraField ? formatCell(readField(row, extraField)) : '';
          const badge = badgeField ? str(readField(row, badgeField)) : '';
          const extra =
            badge || extraText ? (
              <Space size={8}>
                {badge ? <Tag color={TONE_TAG[chipTone(badge)]} style={{ marginInlineEnd: 0 }}>{chipLabel(badge)}</Tag> : null}
                {extraText ? <span>{extraText}</span> : null}
              </Space>
            ) : null;
          // The title field, else the row's first text field (a name the data does not have shows the record anyway).
          const titleValue = readField(row, titleField) ?? Object.values(row).find((v) => typeof v === 'string' && v.trim());
          return (
            <AntList.Item className={selected ? 'tj-ant-item is-selected' : 'tj-ant-item'} onClick={() => select(row, i + offset)} extra={extra || undefined}>
              <AntList.Item.Meta
                avatar={avatar ? (/^(https?:|data:)/.test(avatar) ? <Avatar src={avatar} /> : <Avatar>{avatar.slice(0, 1).toUpperCase()}</Avatar>) : undefined}
                title={formatCell(titleValue)}
                description={descriptionField ? formatCell(readField(row, descriptionField)) || undefined : undefined}
              />
            </AntList.Item>
          );
        }}
      />
    </AntProvider>
  );
};
