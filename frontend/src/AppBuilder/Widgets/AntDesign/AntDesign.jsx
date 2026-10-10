import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  ConfigProvider,
  DatePicker,
  Descriptions,
  Divider,
  Empty,
  Input,
  InputNumber,
  List,
  Progress,
  Segmented,
  Select,
  Statistic,
  Steps,
  Switch,
  Table,
  Tag,
  Timeline,
  Typography,
  theme as antTheme,
} from 'antd';
import dayjs from 'dayjs';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import { useHeightObserver } from '@/_hooks/useHeightObserver';

// Ant Design pack (experiment, exp/antd-pack). Native widgets: they render in the app's React tree, so antd popups
// portal over the page, the editor selects them like any widget, and dynamic height works. Configs live in
// WidgetManager/widgets/antDesign.js.

/** antd tokens from the app theme's CSS variables (whatever theme the user or the model chose), read at the widget's
 * own place in the tree, so every Ant widget follows the app theme with no per-widget styling. */
export const useAppTheme = (ref, darkMode) => {
  const [token, setToken] = useState({});
  useLayoutEffect(() => {
    if (!ref.current) return;
    const css = getComputedStyle(ref.current);
    const read = (name) => css.getPropertyValue(name).trim() || undefined;
    setToken({
      colorPrimary: read('--cc-primary-brand'),
      colorBgContainer: read('--cc-surface1-surface'),
      colorBgLayout: read('--cc-surface2-surface'),
      colorText: read('--cc-primary-text'),
      colorTextSecondary: read('--cc-placeholder-text'),
      colorTextDescription: read('--cc-placeholder-text'),
      colorBorder: read('--cc-default-border'),
      colorBorderSecondary: read('--cc-weak-border'),
      colorSplit: read('--cc-weak-border'),
      fontFamily: css.fontFamily || undefined,
    });
  }, [ref, darkMode]);
  return { token, algorithm: darkMode ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm };
};

export const Shell = ({ properties, styles, darkMode, dataCy, children, innerRef }) => {
  const ref = useRef(null);
  const themeConfig = useAppTheme(ref, darkMode);
  return (
    <div
      ref={(el) => {
        ref.current = el;
        if (innerRef) innerRef.current = el;
      }}
      data-cy={dataCy}
      style={{
        width: '100%',
        display: properties.visibility === false ? 'none' : 'block',
        boxShadow: styles?.boxShadow,
      }}
    >
      <ConfigProvider theme={themeConfig}>{children}</ConfigProvider>
    </div>
  );
};

/** Publishes the standard exposed state plus the widget's own values and actions, keeping them in sync. */
export const useExposed = (setExposedVariables, properties, values) => {
  // Compare by content: values such as selectedOption are rebuilt on every render, and re-publishing on identity
  // would loop (publish, store update, re-render, publish).
  const dataKey = JSON.stringify([
    properties.visibility,
    properties.loadingState,
    properties.disabledState,
    Object.entries(values).filter(([, v]) => typeof v !== 'function'),
  ]);
  const latest = useRef(values);
  latest.current = values;
  useEffect(() => {
    setExposedVariables({
      isVisible: properties.visibility !== false,
      isLoading: !!properties.loadingState,
      isDisabled: !!properties.disabledState,
      ...latest.current,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey]);
};

export const useAutoHeight = (
  { id, height, width, properties, currentMode, currentLayout, subContainerIndex, componentType },
  ref
) => {
  const enabled = !!properties.dynamicHeight && currentMode === 'view';
  const value = useHeightObserver(ref, enabled);
  useDynamicHeight({
    isDynamicHeightEnabled: enabled,
    id,
    height,
    value,
    currentLayout,
    width,
    visibility: properties.visibility !== false,
    subContainerIndex,
    componentType,
  });
};

export const list = (v) => (Array.isArray(v) ? v : []);

export const AntButton = (props) => {
  const { properties, setExposedVariables, fireEvent } = props;
  useExposed(setExposedVariables, properties, {});
  return (
    <Shell {...props}>
      <Button
        type={properties.type || 'primary'}
        danger={!!properties.danger}
        block={properties.block === true}
        loading={!!properties.loadingState}
        disabled={!!properties.disabledState}
        onClick={() => fireEvent('onClick')}
      >
        {String(properties.text ?? '')}
      </Button>
    </Shell>
  );
};

export const AntInput = (props) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent } = props;
  const [value, setValue] = useState(String(properties.defaultValue ?? ''));
  useEffect(() => setValue(String(properties.defaultValue ?? '')), [properties.defaultValue]);
  useExposed(setExposedVariables, properties, {
    value,
    setText: async (text) => setValue(String(text ?? '')),
    clear: async () => setValue(''),
  });
  return (
    <Shell {...props}>
      <Input
        value={value}
        placeholder={String(properties.placeholder ?? '')}
        allowClear={properties.allowClear === true}
        disabled={!!properties.disabledState}
        onChange={(e) => {
          setValue(e.target.value);
          setExposedVariable('value', e.target.value);
          fireEvent('onChange');
        }}
        onPressEnter={() => fireEvent('onEnterPressed')}
      />
    </Shell>
  );
};

export const AntSelect = (props) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent } = props;
  // Accept plain values (['Seraphine', 'Calypso']) as well as { label, value } objects; antd itself needs objects.
  const options = list(properties.options).map((o) =>
    o !== null && typeof o === 'object'
      ? { ...o, label: String(o.label ?? o.value ?? ''), value: o.value ?? o.label }
      : { label: String(o), value: o }
  );
  const initial =
    properties.defaultValue === '' || properties.defaultValue === undefined ? undefined : properties.defaultValue;
  const [value, setValue] = useState(initial);
  useEffect(() => setValue(initial), [initial]);
  const selectedOption = options.find((o) => o?.value === value) || {};
  useExposed(setExposedVariables, properties, {
    value: value ?? '',
    selectedOption,
    selectOption: async (v) => setValue(v),
    clear: async () => setValue(undefined),
  });
  return (
    <Shell {...props}>
      <Select
        style={{ width: '100%' }}
        options={options}
        value={value}
        placeholder={String(properties.placeholder ?? '')}
        allowClear={properties.allowClear === true}
        showSearch={properties.showSearch === true}
        optionFilterProp="label"
        loading={!!properties.loadingState}
        disabled={!!properties.disabledState}
        onChange={(v) => {
          setValue(v);
          setExposedVariable('value', v ?? '');
          fireEvent('onChange');
        }}
      />
    </Shell>
  );
};

export const AntDatePicker = (props) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent } = props;
  const [value, setValue] = useState(properties.defaultValue || '');
  useEffect(() => setValue(properties.defaultValue || ''), [properties.defaultValue]);
  useExposed(setExposedVariables, properties, { value, clear: async () => setValue('') });
  return (
    <Shell {...props}>
      <DatePicker
        style={{ width: '100%' }}
        value={value ? dayjs(value) : null}
        format={properties.format || 'DD MMM YYYY'}
        placeholder={String(properties.placeholder ?? '')}
        disabled={!!properties.disabledState}
        onChange={(d) => {
          const v = d ? d.format('YYYY-MM-DD') : '';
          setValue(v);
          setExposedVariable('value', v);
          fireEvent('onChange');
        }}
      />
    </Shell>
  );
};

const tagColor = {
  confirmed: 'success',
  available: 'success',
  active: 'success',
  pending: 'warning',
  maintenance: 'warning',
  chartered: 'processing',
  completed: 'default',
  cancelled: 'error',
};
const money = (v) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(
    Number(v) || 0
  );

export const AntTable = (props) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  // Publish the selection outputs on mount, like native widgets: a binding to a not-yet-published exposed value
  // resolves to nothing in ToolJet, even behind a guard.
  const [selected, setSelected] = useState({ row: {}, index: null });
  useExposed(setExposedVariables, properties, { selectedRow: selected.row, selectedRowIndex: selected.index });
  // After the data reloads (for example after a write), point the selection at the fresh copy of the same record.
  useEffect(() => {
    const id = selected.row?.id;
    if (id === undefined) return;
    const rows = list(properties.data);
    const index = rows.findIndex((r) => r?.id === id);
    if (index >= 0 && JSON.stringify(rows[index]) !== JSON.stringify(selected.row))
      setSelected({ row: rows[index], index });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.data]);
  const columns = list(properties.columns).map((c) => ({
    title: c.title,
    dataIndex: c.dataIndex,
    key: c.dataIndex,
    width: c.width,
    align: c.kind === 'money' ? 'right' : undefined,
    render: (v) =>
      c.kind === 'tag' ? (
        <Tag color={tagColor[String(v).toLowerCase()] || 'default'}>{String(v ?? '')}</Tag>
      ) : c.kind === 'money' ? (
        money(v)
      ) : c.kind === 'date' ? (
        v ? (
          dayjs(String(v)).format('DD MMM YYYY')
        ) : (
          ''
        )
      ) : (
        String(v ?? '')
      ),
  }));
  return (
    <Shell {...props} innerRef={ref}>
      <Table
        size={properties.size || 'middle'}
        bordered={!!properties.bordered}
        loading={!!properties.loadingState}
        rowKey={(r) => String(r?.id ?? JSON.stringify(r))}
        dataSource={list(properties.data)}
        columns={columns}
        pagination={{ pageSize: Number(properties.pageSize) || 8, hideOnSinglePage: true }}
        locale={
          properties.emptyText
            ? { emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={String(properties.emptyText)} /> }
            : undefined
        }
        onRow={(record, index) => ({
          onClick: () => {
            setSelected({ row: record, index });
            setExposedVariable('selectedRow', record);
            setExposedVariable('selectedRowIndex', index);
            fireEvent('onRowClicked');
          },
          style: { cursor: 'pointer' },
        })}
      />
    </Shell>
  );
};

export const AntCard = (props) => {
  const { properties, setExposedVariables, fireEvent } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  useExposed(setExposedVariables, properties, {});
  return (
    <Shell {...props} innerRef={ref}>
      <Card
        title={properties.title ? String(properties.title) : undefined}
        extra={properties.extra ? String(properties.extra) : undefined}
        hoverable={!!properties.hoverable}
        loading={!!properties.loadingState}
        onClick={() => fireEvent('onClick')}
        style={{ height: properties.dynamicHeight ? undefined : props.height }}
      >
        <div style={{ whiteSpace: 'pre-line' }}>{String(properties.content ?? '')}</div>
      </Card>
    </Shell>
  );
};

export const AntTag = (props) => {
  const { properties, setExposedVariables } = props;
  useExposed(setExposedVariables, properties, {});
  return (
    <Shell {...props}>
      <Tag color={properties.color || 'default'}>{String(properties.text ?? '')}</Tag>
    </Shell>
  );
};

export const AntStatistic = (props) => {
  const { properties, setExposedVariables } = props;
  useExposed(setExposedVariables, properties, {});
  const stat = (
    <Statistic
      title={String(properties.title ?? '')}
      value={properties.value ?? 0}
      prefix={properties.prefix || undefined}
      suffix={properties.suffix || undefined}
      precision={Number(properties.precision) || 0}
      loading={!!properties.loadingState}
    />
  );
  return (
    <Shell {...props}>{properties.card === true ? <Card style={{ height: props.height }}>{stat}</Card> : stat}</Shell>
  );
};

// ---- Typography -------------------------------------------------------------------------------------------------

export const AntTitle = (props) => {
  const { properties, setExposedVariables } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  useExposed(setExposedVariables, properties, {});
  return (
    <Shell {...props} innerRef={ref}>
      <Typography.Title level={Number(properties.level) || 3} style={{ margin: 0 }}>
        {String(properties.text ?? '')}
      </Typography.Title>
    </Shell>
  );
};

export const AntText = (props) => {
  const { properties, setExposedVariables } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  useExposed(setExposedVariables, properties, {});
  const tone = properties.tone && properties.tone !== 'default' ? properties.tone : undefined;
  const Comp = properties.paragraph ? Typography.Paragraph : Typography.Text;
  return (
    <Shell {...props} innerRef={ref}>
      <Comp type={tone} strong={!!properties.strong} copyable={!!properties.copyable} style={{ margin: 0 }}>
        {String(properties.text ?? '')}
      </Comp>
    </Shell>
  );
};

// ---- Data display ----------------------------------------------------------------------------------------------

export const AntDescriptions = (props) => {
  const { properties, setExposedVariables } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  useExposed(setExposedVariables, properties, {});
  const items = list(properties.items).map((it, i) => ({
    key: String(i),
    label: String(it?.label ?? ''),
    children: String(it?.value ?? ''),
  }));
  return (
    <Shell {...props} innerRef={ref}>
      <Descriptions
        title={properties.title ? String(properties.title) : undefined}
        items={items}
        column={Number(properties.column) || 2}
        bordered={!!properties.bordered}
        layout={properties.layout || 'horizontal'}
        size="small"
      />
    </Shell>
  );
};

const initials = (name) =>
  String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
const isUrl = (v) => /^https?:\/\//.test(String(v || ''));

export const AntList = (props) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const [selected, setSelected] = useState({ item: {}, index: null });
  useExposed(setExposedVariables, properties, { selectedItem: selected.item, selectedItemIndex: selected.index });
  const data = list(properties.data);
  const pick = (row, key) => (key ? row?.[key] : undefined);
  const select = (row, i) => {
    setSelected({ item: row, index: i });
    setExposedVariable('selectedItem', row);
    setExposedVariable('selectedItemIndex', i);
  };
  const pageSize = Number(properties.pageSize) || 0;
  return (
    <Shell {...props} innerRef={ref}>
      <List
        bordered={properties.bordered === true}
        loading={!!properties.loadingState}
        dataSource={data}
        locale={
          properties.emptyText
            ? { emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={String(properties.emptyText)} /> }
            : undefined
        }
        pagination={pageSize > 0 ? { pageSize, size: 'small', hideOnSinglePage: true } : false}
        renderItem={(row, i) => {
          const avatar = pick(row, properties.avatarKey);
          return (
            <List.Item
              style={{ cursor: 'pointer' }}
              onClick={() => {
                select(row, i);
                fireEvent('onItemClicked');
              }}
              extra={properties.extraKey ? String(pick(row, properties.extraKey) ?? '') : undefined}
              actions={
                properties.actionLabel
                  ? [
                      <Button
                        key="a"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          select(row, i);
                          fireEvent('onActionClicked');
                        }}
                      >
                        {String(properties.actionLabel)}
                      </Button>,
                    ]
                  : undefined
              }
            >
              <List.Item.Meta
                avatar={
                  avatar ? isUrl(avatar) ? <Avatar src={avatar} /> : <Avatar>{initials(avatar)}</Avatar> : undefined
                }
                title={String(pick(row, properties.titleKey) ?? '')}
                description={properties.descriptionKey ? String(pick(row, properties.descriptionKey) ?? '') : undefined}
              />
            </List.Item>
          );
        }}
      />
    </Shell>
  );
};

export const AntBadge = (props) => {
  const { properties, setExposedVariables } = props;
  useExposed(setExposedVariables, properties, {});
  return (
    <Shell {...props}>
      <Badge status={properties.status || 'default'} text={String(properties.text ?? '')} />
    </Shell>
  );
};

export const AntAvatar = (props) => {
  const { properties, setExposedVariables } = props;
  useExposed(setExposedVariables, properties, {});
  const size = properties.size || 'default';
  const names = Array.isArray(properties.names)
    ? properties.names
    : String(properties.names ?? '')
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean);
  return (
    <Shell {...props}>
      {names.length > 1 ? (
        <Avatar.Group max={{ count: Number(properties.maxCount) || 4 }} size={size}>
          {names.map((n) => (
            <Avatar key={n} size={size}>
              {initials(n)}
            </Avatar>
          ))}
        </Avatar.Group>
      ) : (
        <Avatar size={size} src={properties.src || undefined}>
          {initials(names[0])}
        </Avatar>
      )}
    </Shell>
  );
};

export const AntProgress = (props) => {
  const { properties, setExposedVariables } = props;
  useExposed(setExposedVariables, properties, {});
  const type = properties.type || 'line';
  return (
    <Shell {...props}>
      <Progress
        percent={Number(properties.percent) || 0}
        type={type}
        status={properties.status === 'normal' ? undefined : properties.status}
        size={type === 'line' ? undefined : Math.max(40, Math.min(props.height - 8, props.width - 8))}
      />
    </Shell>
  );
};

export const AntTimeline = (props) => {
  const { properties, setExposedVariables } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  useExposed(setExposedVariables, properties, {});
  const items = list(properties.items).map((it) => ({
    label: it?.label,
    children: String(it?.children ?? ''),
    color: it?.color,
  }));
  return (
    <Shell {...props} innerRef={ref}>
      <div style={{ paddingTop: 8 }}>
        <Timeline mode={properties.mode || 'left'} items={items} />
      </div>
    </Shell>
  );
};

export const AntEmpty = (props) => {
  const { properties, setExposedVariables } = props;
  useExposed(setExposedVariables, properties, {});
  return (
    <Shell {...props}>
      <Empty description={String(properties.description ?? '')} />
    </Shell>
  );
};

// ---- Inputs ------------------------------------------------------------------------------------------------------

export const AntTextArea = (props) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent } = props;
  const [value, setValue] = useState(String(properties.defaultValue ?? ''));
  useEffect(() => setValue(String(properties.defaultValue ?? '')), [properties.defaultValue]);
  useExposed(setExposedVariables, properties, {
    value,
    setText: async (t) => setValue(String(t ?? '')),
    clear: async () => setValue(''),
  });
  return (
    <Shell {...props}>
      <Input.TextArea
        value={value}
        rows={Number(properties.rows) || 3}
        placeholder={String(properties.placeholder ?? '')}
        disabled={!!properties.disabledState}
        onChange={(e) => {
          setValue(e.target.value);
          setExposedVariable('value', e.target.value);
          fireEvent('onChange');
        }}
      />
    </Shell>
  );
};

export const AntInputNumber = (props) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent } = props;
  const [value, setValue] = useState(Number(properties.defaultValue) || 0);
  useEffect(() => setValue(Number(properties.defaultValue) || 0), [properties.defaultValue]);
  useExposed(setExposedVariables, properties, { value, setValue: async (v) => setValue(Number(v) || 0) });
  return (
    <Shell {...props}>
      <InputNumber
        style={{ width: '100%' }}
        value={value}
        min={Number(properties.min)}
        max={Number(properties.max)}
        step={Number(properties.step) || 1}
        prefix={properties.prefix || undefined}
        disabled={!!properties.disabledState}
        onChange={(v) => {
          setValue(v ?? 0);
          setExposedVariable('value', v ?? 0);
          fireEvent('onChange');
        }}
      />
    </Shell>
  );
};

export const AntRangePicker = (props) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent } = props;
  const [range, setRange] = useState([properties.defaultStart || '', properties.defaultEnd || '']);
  useEffect(
    () => setRange([properties.defaultStart || '', properties.defaultEnd || '']),
    [properties.defaultStart, properties.defaultEnd]
  );
  const nights = range[0] && range[1] ? Math.max(0, dayjs(range[1]).diff(dayjs(range[0]), 'day')) : 0;
  useExposed(setExposedVariables, properties, {
    startDate: range[0],
    endDate: range[1],
    nights,
    clear: async () => setRange(['', '']),
  });
  return (
    <Shell {...props}>
      <DatePicker.RangePicker
        style={{ width: '100%' }}
        format={properties.format || 'DD MMM YYYY'}
        value={range[0] && range[1] ? [dayjs(range[0]), dayjs(range[1])] : null}
        disabled={!!properties.disabledState}
        onChange={(d) => {
          const next = d ? [d[0].format('YYYY-MM-DD'), d[1].format('YYYY-MM-DD')] : ['', ''];
          setRange(next);
          setExposedVariable('startDate', next[0]);
          setExposedVariable('endDate', next[1]);
          setExposedVariable(
            'nights',
            next[0] && next[1] ? Math.max(0, dayjs(next[1]).diff(dayjs(next[0]), 'day')) : 0
          );
          fireEvent('onChange');
        }}
      />
    </Shell>
  );
};

const useCheckedState = (props) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent } = props;
  const [checked, setChecked] = useState(!!properties.defaultChecked);
  useEffect(() => setChecked(!!properties.defaultChecked), [properties.defaultChecked]);
  useExposed(setExposedVariables, properties, { value: checked });
  const change = (v) => {
    setChecked(v);
    setExposedVariable('value', v);
    fireEvent('onChange');
  };
  return [checked, change];
};

export const AntCheckbox = (props) => {
  const [checked, change] = useCheckedState(props);
  return (
    <Shell {...props}>
      <Checkbox
        checked={checked}
        disabled={!!props.properties.disabledState}
        onChange={(e) => change(e.target.checked)}
      >
        {String(props.properties.label ?? '')}
      </Checkbox>
    </Shell>
  );
};

export const AntSwitch = (props) => {
  const [checked, change] = useCheckedState(props);
  return (
    <Shell {...props}>
      <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
        <Switch checked={checked} disabled={!!props.properties.disabledState} onChange={change} />
        <span>{String(props.properties.label ?? '')}</span>
      </label>
    </Shell>
  );
};

export const AntSegmented = (props) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent } = props;
  const options = list(properties.options);
  const [value, setValue] = useState(properties.defaultValue);
  useEffect(() => setValue(properties.defaultValue), [properties.defaultValue]);
  useExposed(setExposedVariables, properties, { value: value ?? '' });
  return (
    <Shell {...props}>
      <Segmented
        options={options}
        value={value}
        block={!!properties.block}
        disabled={!!properties.disabledState}
        onChange={(v) => {
          setValue(v);
          setExposedVariable('value', v);
          fireEvent('onChange');
        }}
      />
    </Shell>
  );
};

// ---- Feedback and navigation ---------------------------------------------------------------------------------------

export const AntAlert = (props) => {
  const { properties, setExposedVariables } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  useExposed(setExposedVariables, properties, {});
  return (
    <Shell {...props} innerRef={ref}>
      <Alert
        type={properties.type || 'info'}
        message={String(properties.message ?? '')}
        description={properties.description ? String(properties.description) : undefined}
        showIcon={properties.showIcon === true}
      />
    </Shell>
  );
};

export const AntSteps = (props) => {
  const { properties, setExposedVariables } = props;
  useExposed(setExposedVariables, properties, {});
  const items = list(properties.items).map((it) =>
    typeof it === 'string' ? { title: it } : { title: it?.title, description: it?.description }
  );
  return (
    <Shell {...props}>
      <Steps size={properties.size || 'small'} current={Number(properties.current) || 0} items={items} />
    </Shell>
  );
};

export const AntBreadcrumb = (props) => {
  const { properties, setExposedVariables } = props;
  useExposed(setExposedVariables, properties, {});
  const items = list(properties.items).map((it) => ({ title: typeof it === 'string' ? it : it?.title }));
  return (
    <Shell {...props}>
      <Breadcrumb items={items} />
    </Shell>
  );
};

export const AntDivider = (props) => {
  const { properties, setExposedVariables } = props;
  useExposed(setExposedVariables, properties, {});
  return (
    <Shell {...props}>
      <Divider orientation={properties.orientation || 'left'} style={{ margin: '8px 0' }}>
        {properties.text ? String(properties.text) : null}
      </Divider>
    </Shell>
  );
};
