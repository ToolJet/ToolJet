import React from 'react';
import {
  Breadcrumb as AntBreadcrumb,
  Button,
  Calendar as AntCalendar,
  Carousel as AntCarousel,
  Collapse as AntCollapse,
  Drawer as AntDrawer,
  Dropdown as AntDropdown,
  Image as AntImage,
  Menu as AntMenu,
  Pagination as AntPagination,
  QRCode as AntQRCode,
  Skeleton as AntSkeleton,
  Spin as AntSpin,
  Tree as AntTree,
} from 'antd';
import { DownOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { AntProvider, usePopupTheme, useTokenStyles } from '../lib/AntProvider';
import { SkeletonSwap, SpinOver } from '../lib/Loading';
import { str, toArray, toKeyedItems, type Row } from '../lib/data';
import { toNumber } from '../lib/format';
import { toTree } from './MoreInputs';

const slotKey = (key: string) => key.replace(/[^A-Za-z0-9_]/g, '_');

type MenuItem = { key: string; label: string; danger?: boolean; disabled?: boolean; children?: MenuItem[]; type?: 'divider' };
// Ant's menu items: [{ key, label, danger, disabled, children }] and { type: 'divider' }; strings become both.
const toMenuItems = (raw: unknown): MenuItem[] =>
  toArray(raw)
    .map((o, i): MenuItem | null => {
      if (typeof o === 'string') return { key: o, label: o };
      if (!o || typeof o !== 'object') return null;
      const r = o as Row;
      if (r.type === 'divider') return { key: `divider-${i}`, label: '', type: 'divider' };
      const key = str(r.key ?? r.value ?? r.id ?? r.label);
      if (!key) return null;
      const children = toMenuItems(r.children);
      return { key, label: str(r.label ?? r.title ?? key), danger: Boolean(r.danger) || undefined, disabled: Boolean(r.disabled) || undefined, ...(children.length ? { children } : {}) };
    })
    .filter((x): x is MenuItem => !!x);

// Ant's Collapse: items [{ key, label }], each panel a canvas of ToolJet components (slot panel_<key>); activeKey
// (the open panels' keys), accordion (one open at a time), bordered, ghost, size; event onChange.
export const Collapse = () => {
  const [rawItems] = ToolJet.useStateArray({
    name: 'items',
    label: 'Items',
    description: '[{ key, label }]; each panel holds its own components.',
    initialValue: [
      { key: 'panel1', label: 'Panel 1' },
      { key: 'panel2', label: 'Panel 2' },
    ],
  });
  const [activeKey, setActiveKey] = ToolJet.useStateArray({ name: 'activeKey', label: 'Active key', description: 'Keys of the open panels.', initialValue: [] });
  const [accordion] = ToolJet.useStateBoolean({ name: 'accordion', label: 'Accordion', initialValue: false });
  const [bordered] = ToolJet.useStateBoolean({ name: 'bordered', label: 'Bordered', initialValue: true });
  const [ghost] = ToolJet.useStateBoolean({ name: 'ghost', label: 'Ghost', initialValue: false });
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['small', 'middle', 'large'], initialValue: 'middle' });
  const [panelHeight] = ToolJet.useStateNumber({ name: 'panelHeight', label: 'Panel height (px)', initialValue: 160, min: 40, max: 2000 });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 24, defaultHeight: 30 });
  const items = toKeyedItems(rawItems);
  const raw: unknown = activeKey;
  const open = (Array.isArray(raw) ? raw : raw ? [raw] : []).map(str);
  const change = (keys: string | string[]) => {
    setActiveKey(toArray(Array.isArray(keys) ? keys : keys ? [keys] : []).map(str));
    onChange();
  };
  ToolJet.useAction({ name: 'setActiveKey', displayName: 'Set open panels', params: [{ handle: 'keys', displayName: 'Key or keys' }] }, (k) => change(Array.isArray(k) ? (k as string[]) : str(k)));
  const height = Math.max(40, Math.min(2000, Number(panelHeight) || 160));
  return (
    <AntProvider tokens={tokens} fill className="tj-ant-collapse">
      <SpinOver loading={loading} as="fill">
        <AntCollapse
          activeKey={open}
          accordion={accordion}
          bordered={bordered}
          ghost={ghost}
          size={size as 'middle'}
          onChange={change}
          // Panels stay mounted when closed, so their drop areas and children keep their state.
          destroyOnHidden={false}
          items={items.map((t) => ({
            key: t.key,
            label: t.label,
            forceRender: true,
            children: <ToolJet.Slot name={`panel_${slotKey(t.key)}`} style={{ height }} />,
          }))}
        />
      </SpinOver>
    </AntProvider>
  );
};

// Ant's Dropdown on a Button: children (the button text), menu items [{ key, label, danger, disabled }], type
// (primary, default), trigger (click, hover), placement, arrow. Event onClick for a menu item, with its key exposed
// as selectedKey (Ant passes { key }); onButtonClick for the button half when split.
export const Dropdown = () => {
  const [children] = ToolJet.useStateString({ name: 'children', label: 'Text', initialValue: 'Actions' });
  const [items] = ToolJet.useStateArray({ name: 'items', label: 'Menu items', description: '[{ key, label, danger? }]', initialValue: [
    { key: 'edit', label: 'Edit' },
    { key: 'duplicate', label: 'Duplicate' },
    { key: 'archive', label: 'Archive' },
    { key: 'delete', label: 'Delete', danger: true },
  ] });
  const [type] = ToolJet.useStateEnumeration({ name: 'type', label: 'Type', enumDefinition: ['default', 'primary'], initialValue: 'default' });
  const [split] = ToolJet.useStateBoolean({ name: 'split', label: 'Split button', description: "Dropdown.Button: the button and the arrow act apart.", initialValue: false });
  const [trigger] = ToolJet.useStateEnumeration({ name: 'trigger', label: 'Trigger', enumDefinition: ['click', 'hover'], initialValue: 'click' });
  const [placement] = ToolJet.useStateEnumeration({ name: 'placement', label: 'Placement', enumDefinition: ['bottomLeft', 'bottom', 'bottomRight', 'topLeft', 'top', 'topRight'], initialValue: 'bottomLeft' });
  const [arrow] = ToolJet.useStateBoolean({ name: 'arrow', label: 'Arrow', initialValue: false });
  const [block] = ToolJet.useStateBoolean({ name: 'block', label: 'Block', initialValue: false });
  const [, setSelectedKey] = ToolJet.useStateString({ name: 'selectedKey', initialValue: '', inspector: 'hidden' });
  const onClick = ToolJet.useEventCallback({ name: 'onClick' });
  const onButtonClick = ToolJet.useEventCallback({ name: 'onButtonClick' });
  const { disabled, loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  const popup = usePopupTheme();
  ToolJet.useComponentSettings({ defaultWidth: 6, defaultHeight: 4 });
  const menu = {
    items: toMenuItems(items) as never,
    onClick: ({ key }: { key: string }) => {
      setSelectedKey(key);
      onClick();
    },
  };
  const common = {
    menu,
    trigger: [trigger as 'click'],
    placement: placement as 'bottomLeft',
    arrow,
    disabled,
    overlayClassName: popup.className,
    overlayStyle: popup.style,
  };
  return (
    <AntProvider tokens={tokens} fill className="tj-ant-center tj-ant-start">
      {split ? (
        <AntDropdown.Button {...common} type={type as 'default'} loading={loading} onClick={() => onButtonClick()} style={block ? { width: '100%' } : undefined}>
          {children}
        </AntDropdown.Button>
      ) : (
        <AntDropdown {...common}>
          <Button type={type as 'default'} loading={loading} disabled={disabled} block={block}>
            {children} <DownOutlined />
          </Button>
        </AntDropdown>
      )}
    </AntProvider>
  );
};

// Ant's Menu: items [{ key, label, children }], mode (horizontal, vertical, inline), theme (light, dark),
// selectedKey (exposed, settable); events onClick and onSelect carry the key.
export const Menu = () => {
  const [items] = ToolJet.useStateArray({ name: 'items', label: 'Items', description: '[{ key, label, children? }]', initialValue: [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'orders', label: 'Orders', children: [{ key: 'open', label: 'Open' }, { key: 'shipped', label: 'Shipped' }] },
    { key: 'customers', label: 'Customers' },
    { key: 'settings', label: 'Settings' },
  ] });
  const [mode] = ToolJet.useStateEnumeration({ name: 'mode', label: 'Mode', enumDefinition: ['horizontal', 'vertical', 'inline'], initialValue: 'inline' });
  const [theme] = ToolJet.useStateEnumeration({ name: 'theme', label: 'Theme', enumDefinition: ['light', 'dark'], initialValue: 'light' });
  const [selectedKey, setSelectedKey] = ToolJet.useStateString({ name: 'selectedKey', label: 'Selected key', initialValue: '' });
  const onClick = ToolJet.useEventCallback({ name: 'onClick' });
  const onSelect = ToolJet.useEventCallback({ name: 'onSelect' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 8, defaultHeight: 30 });
  ToolJet.useAction({ name: 'setSelectedKey', displayName: 'Select item', params: [{ handle: 'key', displayName: 'Key' }] }, (k) => setSelectedKey(str(k)));
  return (
    <AntProvider tokens={tokens} fill className="tj-ant-menu">
      <SpinOver loading={loading} as="fill">
        <AntMenu
          items={toMenuItems(items) as never}
          mode={mode as 'inline'}
          theme={theme as 'light'}
          selectedKeys={selectedKey ? [selectedKey] : []}
          onClick={({ key }) => {
            setSelectedKey(key);
            onClick();
          }}
          onSelect={() => onSelect()}
        />
      </SpinOver>
    </AntProvider>
  );
};

// Ant's Breadcrumb: items [{ title, key }] (strings become titles), separator; event onClick for an item, its key
// (or title) exposed as clickedKey.
export const Breadcrumb = () => {
  const [items] = ToolJet.useStateArray({ name: 'items', label: 'Items', description: "[{ title, key }] or ['Home', 'Orders']", initialValue: ['Home', 'Orders', 'Order 1042'] });
  const [separator] = ToolJet.useStateString({ name: 'separator', label: 'Separator', initialValue: '/' });
  const [, setClickedKey] = ToolJet.useStateString({ name: 'clickedKey', initialValue: '', inspector: 'hidden' });
  const onClick = ToolJet.useEventCallback({ name: 'onClick' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 16, defaultHeight: 3 });
  const list = toArray(items).map((o, i, all) => {
    const r = typeof o === 'string' ? { title: o } : ((o ?? {}) as Row);
    const title = str(r.title ?? r.label);
    const key = str(r.key ?? r.value ?? title);
    const last = i === all.length - 1;
    return {
      key,
      title: last ? (
        title
      ) : (
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setClickedKey(key);
            onClick();
          }}
        >
          {title}
        </a>
      ),
    };
  });
  return (
    <AntProvider tokens={tokens}>
      <SpinOver loading={loading}>
        <AntBreadcrumb items={list} separator={separator || '/'} />
      </SpinOver>
    </AntProvider>
  );
};

// Ant's Pagination: current, pageSize, total, showSizeChanger, pageSizeOptions, simple, size, showTotal (text,
// {start} {end} {total}), align; event onChange (current and pageSize exposed).
export const Pagination = () => {
  const [current, setCurrent] = ToolJet.useStateNumber({ name: 'current', label: 'Current', initialValue: 1, min: 1 });
  const [pageSize, setPageSize] = ToolJet.useStateNumber({ name: 'pageSize', label: 'Page size', initialValue: 10, min: 1 });
  const [total] = ToolJet.useStateNumber({ name: 'total', label: 'Total', initialValue: 50, min: 0 });
  const [showSizeChanger] = ToolJet.useStateBoolean({ name: 'showSizeChanger', label: 'Show size changer', initialValue: false });
  const [simple] = ToolJet.useStateBoolean({ name: 'simple', label: 'Simple', initialValue: false });
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['default', 'small'], initialValue: 'default' });
  const [showTotal] = ToolJet.useStateString({ name: 'showTotal', label: 'Show total', description: 'e.g. {start}-{end} of {total} items', initialValue: '' });
  const [align] = ToolJet.useStateEnumeration({ name: 'align', label: 'Align', enumDefinition: ['start', 'center', 'end'], initialValue: 'end' });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const { disabled, loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 4 });
  ToolJet.useAction({ name: 'setCurrent', displayName: 'Go to page', params: [{ handle: 'page', displayName: 'Page' }] }, (p) => {
    setCurrent(Math.max(1, Number(p) || 1));
    onChange();
  });
  return (
    <AntProvider tokens={tokens}>
      <SpinOver loading={loading}>
        <AntPagination
          current={Math.max(1, Number(current) || 1)}
          pageSize={Math.max(1, Number(pageSize) || 10)}
          total={Math.max(0, Number(total) || 0)}
          showSizeChanger={showSizeChanger}
          simple={simple}
          size={size as 'default'}
          align={align as 'end'}
          disabled={disabled}
          showTotal={showTotal ? (t, [s, e]) => str(showTotal).replace('{start}', String(s)).replace('{end}', String(e)).replace('{total}', String(t)) : undefined}
          onChange={(page, ps) => {
            setCurrent(page);
            setPageSize(ps);
            onChange();
          }}
        />
      </SpinOver>
    </AntProvider>
  );
};

// Ant's Drawer: open, title, placement (right, left, top, bottom), size (default 378px, large 736px) or width,
// closable, maskClosable, extra (header text); the body is a canvas of ToolJet components in the popup layer (slot
// body). A trigger button on the canvas (showTrigger). Events onClose, afterOpen, afterClose; actions show, hide.
export const Drawer = () => {
  const [triggerText] = ToolJet.useStateString({ name: 'triggerText', label: 'Trigger text', initialValue: 'Open' });
  const [showTrigger] = ToolJet.useStateBoolean({ name: 'showTrigger', label: 'Show trigger', initialValue: true });
  const [title] = ToolJet.useStateString({ name: 'title', label: 'Title', initialValue: 'Drawer title' });
  const [extra] = ToolJet.useStateString({ name: 'extra', label: 'Extra', initialValue: '' });
  const [placement] = ToolJet.useStateEnumeration({ name: 'placement', label: 'Placement', enumDefinition: ['right', 'left', 'top', 'bottom'], initialValue: 'right' });
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['default', 'large'], initialValue: 'default' });
  const [width] = ToolJet.useStateNumber({ name: 'width', label: 'Width (px)', description: 'Overrides size; 0 to use size.', initialValue: 0, min: 0, max: 1600 });
  const [closable] = ToolJet.useStateBoolean({ name: 'closable', label: 'Closable', initialValue: true });
  const [maskClosable] = ToolJet.useStateBoolean({ name: 'maskClosable', label: 'Mask closable', initialValue: true });
  const [open, setOpen] = ToolJet.useStateBoolean({ name: 'open', initialValue: false, inspector: 'hidden' });
  const onClose = ToolJet.useEventCallback({ name: 'onClose' });
  const afterOpen = ToolJet.useEventCallback({ name: 'afterOpen' });
  const afterClose = ToolJet.useEventCallback({ name: 'afterClose' });
  const { disabled, loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 6, defaultHeight: 4 });
  ToolJet.useAction({ name: 'show', displayName: 'Show' }, () => setOpen(true));
  ToolJet.useAction({ name: 'hide', displayName: 'Hide' }, () => setOpen(false));
  const w = Number(width) > 0 ? Number(width) : undefined;
  return (
    <AntProvider tokens={tokens} fill className="tj-ant-center">
      {showTrigger ? (
        <Button type="primary" block disabled={disabled} onClick={() => setOpen(true)}>
          {triggerText}
        </Button>
      ) : null}
      <DrawerBody
        open={!!open}
        title={title || undefined}
        extra={extra || undefined}
        placement={placement as 'right'}
        size={size as 'default'}
        width={placement === 'left' || placement === 'right' ? w : undefined}
        height={placement === 'top' || placement === 'bottom' ? w : undefined}
        closable={closable}
        maskClosable={maskClosable}
        loading={loading}
        onClose={() => {
          setOpen(false);
          onClose();
        }}
        afterOpenChange={(next) => (next ? afterOpen() : afterClose())}
      />
    </AntProvider>
  );
};

const DrawerBody = (props: React.ComponentProps<typeof AntDrawer>) => {
  const popup = usePopupTheme();
  if (!popup.container) return null;
  return (
    <AntDrawer {...props} getContainer={popup.container} rootClassName={popup.className} rootStyle={popup.style} forceRender>
      <ToolJet.PopupSlot name="body" style={{ height: '100%' }} />
    </AntDrawer>
  );
};

// Ant's Skeleton: active, avatar, title, paragraph rows; loading false shows nothing (the content is elsewhere).
export const Skeleton = () => {
  const [active] = ToolJet.useStateBoolean({ name: 'active', label: 'Active', initialValue: true });
  const [avatar] = ToolJet.useStateBoolean({ name: 'avatar', label: 'Avatar', initialValue: false });
  const [title] = ToolJet.useStateBoolean({ name: 'title', label: 'Title', initialValue: true });
  const [rows] = ToolJet.useStateNumber({ name: 'rows', label: 'Paragraph rows', initialValue: 3, min: 0, max: 20 });
  const [loading] = ToolJet.useStateBoolean({ name: 'loading', label: 'Loading', initialValue: true });
  const host = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 16, defaultHeight: 12 });
  return (
    <AntProvider tokens={tokens} fill>
      {loading || host.loading ? <AntSkeleton active={active} avatar={avatar} title={title} paragraph={{ rows: Math.max(0, Number(rows) || 0) }} /> : null}
    </AntProvider>
  );
};

// Ant's Spin: spinning, tip, size (small, default, large); fullscreen is left to the page.
export const Spin = () => {
  const [spinning] = ToolJet.useStateBoolean({ name: 'spinning', label: 'Spinning', initialValue: true });
  const [tip] = ToolJet.useStateString({ name: 'tip', label: 'Tip', initialValue: '' });
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['small', 'default', 'large'], initialValue: 'default' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 4, defaultHeight: 6 });
  return (
    <AntProvider tokens={tokens} fill className="tj-ant-center">
      {spinning || loading ? (
        <div className="tj-ant-spin">
          <AntSpin size={size as 'default'} />
          {tip ? <div className="tj-ant-spin-tip">{tip}</div> : null}
        </div>
      ) : null}
    </AntProvider>
  );
};

// Ant's Image: src, alt, preview (click to enlarge, in the popup layer), fallback, plus objectFit and borderRadius for
// filling the box; event onClick.
export const Image = () => {
  const [src] = ToolJet.useStateString({ name: 'src', label: 'Src', initialValue: 'https://picsum.photos/seed/tj-image/800/450' });
  const [alt] = ToolJet.useStateString({ name: 'alt', label: 'Alt', initialValue: '' });
  const [preview] = ToolJet.useStateBoolean({ name: 'preview', label: 'Preview', description: 'Click to enlarge.', initialValue: true });
  const [fallback] = ToolJet.useStateString({ name: 'fallback', label: 'Fallback', description: 'Shown when src fails to load.', initialValue: '' });
  const [objectFit] = ToolJet.useStateEnumeration({ name: 'objectFit', label: 'Object fit', enumDefinition: ['cover', 'contain', 'fill'], initialValue: 'cover' });
  const onClick = ToolJet.useEventCallback({ name: 'onClick' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  const popup = usePopupTheme();
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 20 });
  return (
    <AntProvider tokens={tokens} fill className="tj-ant-image">
      <SkeletonSwap loading={loading} look={<AntSkeleton.Image active style={{ width: '100%', height: '100%' }} />}>
        {src ? (
          <AntImage
            src={src}
            alt={alt}
            width="100%"
            height="100%"
            fallback={fallback || undefined}
            style={{ objectFit: objectFit as 'cover' }}
            preview={preview ? { getContainer: () => popup.container ?? document.body, rootClassName: popup.className } : false}
            onClick={() => onClick()}
          />
        ) : (
          <AntSkeleton.Image style={{ width: '100%', height: '100%' }} />
        )}
      </SkeletonSwap>
    </AntProvider>
  );
};

// Ant's Calendar: value (YYYY-MM-DD), fullscreen (the month grid) or a card, mode (month, year), dateCellRender
// dots from events [{ date, title, type }]; events onSelect, onPanelChange.
export const Calendar = () => {
  const [value, setValue] = ToolJet.useStateString({ name: 'value', label: 'Value', description: 'YYYY-MM-DD', initialValue: '' });
  const [fullscreen] = ToolJet.useStateBoolean({ name: 'fullscreen', label: 'Fullscreen', initialValue: true });
  const [events] = ToolJet.useStateArray({ name: 'events', label: 'Events', description: "[{ date: '2026-10-23', title, type: success|warning|error|processing }]", initialValue: [
    { date: '2026-10-26', title: 'Sprint review', type: 'processing' },
    { date: '2026-10-28', title: 'Invoices due', type: 'warning' },
    { date: '2026-10-30', title: 'Release', type: 'success' },
    { date: '2026-11-03', title: 'Launch', type: 'success' },
    { date: '2026-11-05', title: 'Server maintenance', type: 'error' },
  ] });
  const onSelect = ToolJet.useEventCallback({ name: 'onSelect' });
  const onPanelChange = ToolJet.useEventCallback({ name: 'onPanelChange' });
  const [, setPanelDate] = ToolJet.useStateString({ name: 'panelDate', initialValue: '', inspector: 'hidden' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 24, defaultHeight: 50 });
  const byDate = new Map<string, Row[]>();
  toArray(events).forEach((e) => {
    const r = (e ?? {}) as Row;
    const d = str(r.date).slice(0, 10);
    if (d) byDate.set(d, [...(byDate.get(d) ?? []), r]);
  });
  const parsed = value ? dayjs(value) : null;
  return (
    <AntProvider tokens={tokens} fill className="tj-ant-calendar">
      <SpinOver loading={loading} as="fill">
        <AntCalendar
          fullscreen={fullscreen}
          value={parsed && parsed.isValid() ? parsed : undefined}
          cellRender={(d, info) => {
            if (info.type !== 'date') return info.originNode;
            const list = byDate.get(d.format('YYYY-MM-DD'));
            if (!list) return null;
            return (
              <ul className="tj-ant-cal-events">
                {list.slice(0, 3).map((e, i) => (
                  <li key={i} className={`is-${str(e.type) || 'processing'}`}>
                    {str(e.title)}
                  </li>
                ))}
              </ul>
            );
          }}
          onSelect={(d, info) => {
            setValue(d.format('YYYY-MM-DD'));
            if (info.source === 'date') onSelect();
          }}
          onPanelChange={(d) => {
            setPanelDate(d.format('YYYY-MM-DD'));
            onPanelChange();
          }}
        />
      </SpinOver>
    </AntProvider>
  );
};

// Ant's Tree: treeData [{ title, key, children }], checkable, selectedKeys/checkedKeys (exposed), defaultExpandAll,
// showLine, blockNode; events onSelect, onCheck.
export const Tree = () => {
  const [treeData] = ToolJet.useStateArray({ name: 'treeData', label: 'Tree data', description: '[{ title, key, children: [...] }]', initialValue: [
    {
      title: 'Projects',
      key: 'projects',
      children: [
        { title: 'Website redesign', key: 'website', children: [{ title: 'Wireframes', key: 'wireframes' }, { title: 'Copy', key: 'copy' }] },
        { title: 'Mobile app', key: 'mobile' },
      ],
    },
    { title: 'Archive', key: 'archive', children: [{ title: '2025 planning', key: 'planning-2025' }] },
  ] });
  const [checkable] = ToolJet.useStateBoolean({ name: 'checkable', label: 'Checkable', initialValue: false });
  const [defaultExpandAll] = ToolJet.useStateBoolean({ name: 'defaultExpandAll', label: 'Expand all', initialValue: true });
  const [showLine] = ToolJet.useStateBoolean({ name: 'showLine', label: 'Show line', initialValue: false });
  const [selectedKeys, setSelectedKeys] = ToolJet.useStateArray({ name: 'selectedKeys', initialValue: [], inspector: 'hidden' });
  const [checkedKeys, setCheckedKeys] = ToolJet.useStateArray({ name: 'checkedKeys', label: 'Checked keys', initialValue: [] });
  const onSelect = ToolJet.useEventCallback({ name: 'onSelect' });
  const onCheck = ToolJet.useEventCallback({ name: 'onCheck' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 12, defaultHeight: 30 });
  const data = toTree(treeData);
  return (
    <AntProvider tokens={tokens} fill className="tj-ant-tree">
      <SpinOver loading={loading} as="fill">
        {data.length ? (
          <AntTree
            key={defaultExpandAll ? 'all' : 'some'}
            treeData={data as never}
            checkable={checkable}
            defaultExpandAll={defaultExpandAll}
            showLine={showLine}
            blockNode
            selectedKeys={toArray(selectedKeys).map(str)}
            checkedKeys={toArray(checkedKeys).map(str)}
            onSelect={(keys) => {
              setSelectedKeys(keys.map(str));
              onSelect();
            }}
            onCheck={(keys) => {
              setCheckedKeys((Array.isArray(keys) ? keys : keys.checked).map(str));
              onCheck();
            }}
          />
        ) : null}
      </SpinOver>
    </AntProvider>
  );
};

// Ant's Carousel: items [{ src, title, description }] (images with an optional caption), autoplay, autoplaySpeed,
// dots, effect (scrollx, fade); event afterChange with current exposed.
export const Carousel = () => {
  const [items] = ToolJet.useStateArray({ name: 'items', label: 'Items', description: '[{ src, title, description }]', initialValue: [
    { src: 'https://picsum.photos/seed/tj-coast/1200/675', title: 'Coastal routes', description: 'Plan deliveries along the shoreline' },
    { src: 'https://picsum.photos/seed/tj-mountain/1200/675', title: 'Mountain depots', description: 'New warehouses opening in Q1' },
    { src: 'https://picsum.photos/seed/tj-lake/1200/675', title: 'Lakeside hubs', description: 'Cold-chain capacity doubled' },
  ] });
  const [autoplay] = ToolJet.useStateBoolean({ name: 'autoplay', label: 'Autoplay', initialValue: false });
  const [autoplaySpeed] = ToolJet.useStateNumber({ name: 'autoplaySpeed', label: 'Autoplay speed (ms)', initialValue: 3000, min: 500 });
  const [dots] = ToolJet.useStateBoolean({ name: 'dots', label: 'Dots', initialValue: true });
  const [arrows] = ToolJet.useStateBoolean({ name: 'arrows', label: 'Arrows', initialValue: true });
  const [effect] = ToolJet.useStateEnumeration({ name: 'effect', label: 'Effect', enumDefinition: ['scrollx', 'fade'], initialValue: 'scrollx' });
  const [, setCurrent] = ToolJet.useStateNumber({ name: 'current', initialValue: 0, inspector: 'hidden' });
  const afterChange = ToolJet.useEventCallback({ name: 'afterChange' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 24, defaultHeight: 30 });
  const slides = toArray(items).map((o) => (typeof o === 'string' ? { src: o } : ((o ?? {}) as Row)));
  return (
    <AntProvider tokens={tokens} fill className="tj-ant-carousel">
      <SpinOver loading={loading} as="fill">
        {slides.length ? (
          <AntCarousel
            autoplay={autoplay}
            autoplaySpeed={Math.max(500, Number(autoplaySpeed) || 3000)}
            dots={dots}
            arrows={arrows}
            effect={effect as 'scrollx'}
            afterChange={(i) => {
              setCurrent(i);
              afterChange();
            }}
          >
            {slides.map((s, i) => (
              <div key={i} className="tj-ant-slide">
                {s.src ? <img src={str(s.src)} alt={str(s.title)} /> : null}
                {s.title || s.description ? (
                  <div className="tj-ant-slide-caption">
                    {s.title ? <strong>{str(s.title)}</strong> : null}
                    {s.description ? <span>{str(s.description)}</span> : null}
                  </div>
                ) : null}
              </div>
            ))}
          </AntCarousel>
        ) : (
          <AntSkeleton.Image style={{ width: '100%', height: '100%' }} />
        )}
      </SpinOver>
    </AntProvider>
  );
};

// Ant's QRCode: value (the text or URL), size, color, bgColor, errorLevel (L, M, Q, H), icon (image URL), bordered.
export const QRCode = () => {
  const [value] = ToolJet.useStateString({ name: 'value', label: 'Value', initialValue: 'https://tooljet.com' });
  const [size] = ToolJet.useStateNumber({ name: 'size', label: 'Size (px)', initialValue: 160, min: 48, max: 600 });
  const [color] = ToolJet.useStateString({ name: 'color', label: 'Color', initialValue: '' });
  const [bgColor] = ToolJet.useStateString({ name: 'bgColor', label: 'Background', initialValue: '' });
  const [errorLevel] = ToolJet.useStateEnumeration({ name: 'errorLevel', label: 'Error level', enumDefinition: ['L', 'M', 'Q', 'H'], initialValue: 'M' });
  const [icon] = ToolJet.useStateString({ name: 'icon', label: 'Icon', description: 'An image URL drawn in the middle.', initialValue: '' });
  const [bordered] = ToolJet.useStateBoolean({ name: 'bordered', label: 'Bordered', initialValue: true });
  const tokens = useTokenStyles();
  const { loading } = ToolJet.useControlState();
  ToolJet.useComponentSettings({ defaultWidth: 6, defaultHeight: 18 });
  const px = Math.max(48, Math.min(600, toNumber(size) ?? 160));
  return (
    <AntProvider tokens={tokens} fill className="tj-ant-center">
      {value ? (
        <AntQRCode
          value={value}
          size={px}
          color={color || undefined}
          bgColor={bgColor || undefined}
          errorLevel={errorLevel as 'M'}
          icon={icon || undefined}
          bordered={bordered}
          status={loading ? 'loading' : 'active'}
          type="svg"
        />
      ) : loading ? (
        <AntQRCode value="-" size={px} status="loading" bordered={bordered} type="svg" />
      ) : (
        <AntQRCode value="-" size={px} status="expired" bordered={bordered} statusRender={() => <span>No value</span>} type="svg" />
      )}
    </AntProvider>
  );
};
