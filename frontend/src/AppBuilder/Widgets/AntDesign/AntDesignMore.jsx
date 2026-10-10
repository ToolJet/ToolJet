import React, { useEffect, useRef, useState } from 'react';
import {
  AutoComplete,
  Badge,
  Button,
  Calendar,
  Cascader,
  Collapse,
  ColorPicker,
  Image,
  Pagination,
  QRCode,
  Radio,
  Rate,
  Result,
  Skeleton,
  Slider,
  TimePicker,
  Tree,
  TreeSelect,
  Upload,
} from 'antd';
import dayjs from 'dayjs';
import { Shell, useExposed, useAutoHeight, list } from './AntDesign';

// Ant Design pack, second batch (experiment, exp/antd-pack): the rest of antd's inputs and data display that fit a
// canvas widget. Same contract as AntDesign.jsx: Shell themes from the app, useExposed publishes outputs on mount.

const toOptions = (v) =>
  list(v).map((o) =>
    o !== null && typeof o === 'object'
      ? { ...o, label: String(o.label ?? o.value ?? ''), value: o.value ?? o.label }
      : { label: String(o), value: o }
  );

/** Tree data accepts { title, value, children } (or key instead of value); antd Tree wants key, TreeSelect wants value. */
const toTree = (nodes) =>
  list(nodes).map((n) => {
    const id = n?.value ?? n?.key ?? n?.title;
    return {
      ...n,
      title: String(n?.title ?? n?.label ?? id ?? ''),
      value: id,
      key: id,
      children: n?.children ? toTree(n.children) : undefined,
    };
  });
const findNode = (nodes, id) => {
  for (const n of nodes) {
    if (n.key === id) return n;
    const hit = n.children && findNode(n.children, id);
    if (hit) return hit;
  }
  return undefined;
};
const plainNode = (n) => (n ? Object.fromEntries(Object.entries(n).filter(([k]) => k !== 'children')) : {});

/** Single-value controlled input: local state seeded from defaultValue, published as `value`, plus the widget's
 * component actions built from the setter. */
const useValue = (props, initial, actions = () => ({})) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent } = props;
  const [value, setValue] = useState(initial);
  const key = JSON.stringify(initial ?? null);
  useEffect(() => setValue(initial), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  useExposed(setExposedVariables, properties, { value: value ?? '', ...actions(setValue) });
  const change = (v, event = 'onChange') => {
    setValue(v);
    setExposedVariable('value', v ?? '');
    fireEvent(event);
  };
  return [value, change];
};

export const AntRadio = (props) => {
  const { properties } = props;
  const initial = properties.defaultValue === '' ? undefined : properties.defaultValue;
  const [value, change] = useValue(props, initial, (set) => ({ selectOption: async (v) => set(v) }));
  return (
    <Shell {...props}>
      <Radio.Group
        options={toOptions(properties.options)}
        value={value}
        optionType={properties.optionType === 'button' ? 'button' : 'default'}
        buttonStyle={properties.optionType === 'button' ? 'solid' : undefined}
        disabled={!!properties.disabledState}
        style={properties.vertical === true ? { display: 'flex', flexDirection: 'column', gap: 8 } : undefined}
        onChange={(e) => change(e.target.value)}
      />
    </Shell>
  );
};

export const AntSlider = (props) => {
  const { properties } = props;
  const range = properties.range === true;
  const raw = properties.defaultValue;
  const initial = range
    ? Array.isArray(raw)
      ? raw
      : [Number(properties.min) || 0, Number(raw) || 0]
    : Array.isArray(raw)
    ? Number(raw[0]) || 0
    : Number(raw) || 0;
  const [value, change] = useValue(props, initial, (set) => ({ setValue: async (v) => set(v) }));
  const [live, setLive] = useState(value);
  useEffect(() => setLive(value), [JSON.stringify(value)]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Shell {...props}>
      <Slider
        range={range}
        min={Number(properties.min) || 0}
        max={Number(properties.max ?? 100)}
        step={Number(properties.step) || 1}
        value={live}
        disabled={!!properties.disabledState}
        onChange={setLive}
        onChangeComplete={(v) => change(v)}
      />
    </Shell>
  );
};

export const AntRate = (props) => {
  const { properties } = props;
  const [value, change] = useValue(props, Number(properties.defaultValue) || 0);
  return (
    <Shell {...props}>
      <Rate
        value={value}
        count={Number(properties.count) || 5}
        allowHalf={properties.allowHalf === true}
        disabled={!!properties.disabledState}
        onChange={(v) => change(v)}
      />
    </Shell>
  );
};

export const AntTimePicker = (props) => {
  const { properties } = props;
  const format = properties.format || 'HH:mm';
  const [value, change] = useValue(props, properties.defaultValue || '', (set) => ({ clear: async () => set('') }));
  return (
    <Shell {...props}>
      <TimePicker
        style={{ width: '100%' }}
        format={format}
        minuteStep={Number(properties.minuteStep) || 1}
        placeholder={String(properties.placeholder ?? '')}
        value={value ? dayjs(value, ['HH:mm:ss', 'HH:mm', format]) : null}
        disabled={!!properties.disabledState}
        onChange={(t) => change(t ? t.format(format) : '')}
      />
    </Shell>
  );
};

export const AntAutoComplete = (props) => {
  const { properties } = props;
  const [value, change] = useValue(props, String(properties.defaultValue ?? ''), (set) => ({
    setText: async (t) => set(String(t ?? '')),
    clear: async () => set(''),
  }));
  const options = toOptions(properties.options).map((o) => ({ value: String(o.value), label: o.label }));
  const query = String(value ?? '').toLowerCase();
  return (
    <Shell {...props}>
      <AutoComplete
        style={{ width: '100%' }}
        value={value}
        options={query ? options.filter((o) => o.label.toLowerCase().includes(query)) : options}
        placeholder={String(properties.placeholder ?? '')}
        allowClear={properties.allowClear === true}
        disabled={!!properties.disabledState}
        onChange={(v) => change(v ?? '')}
        onSelect={(v) => change(v, 'onSelect')}
      />
    </Shell>
  );
};

export const AntCascader = (props) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent } = props;
  const options = list(properties.options);
  const initial = list(properties.defaultValue);
  const [path, setPath] = useState(initial);
  useEffect(() => setPath(initial), [JSON.stringify(initial)]); // eslint-disable-line react-hooks/exhaustive-deps
  const labelsFor = (p) => {
    const out = [];
    let level = options;
    for (const v of p) {
      const hit = list(level).find((o) => o?.value === v);
      if (!hit) break;
      out.push(String(hit.label ?? hit.value));
      level = hit.children;
    }
    return out;
  };
  useExposed(setExposedVariables, properties, {
    value: path,
    selectedLabels: labelsFor(path),
    lastValue: path.length ? path[path.length - 1] : '',
    clear: async () => setPath([]),
  });
  return (
    <Shell {...props}>
      <Cascader
        style={{ width: '100%' }}
        options={options}
        value={path}
        placeholder={String(properties.placeholder ?? '')}
        showSearch={properties.showSearch === true}
        disabled={!!properties.disabledState}
        onChange={(v) => {
          const next = v ?? [];
          setPath(next);
          setExposedVariable('value', next);
          setExposedVariable('selectedLabels', labelsFor(next));
          setExposedVariable('lastValue', next.length ? next[next.length - 1] : '');
          fireEvent('onChange');
        }}
      />
    </Shell>
  );
};

export const AntTreeSelect = (props) => {
  const { properties } = props;
  const multi = properties.multiple === true || properties.treeCheckable === true;
  const raw = properties.defaultValue;
  const initial = multi ? (Array.isArray(raw) ? raw : raw ? [raw] : []) : raw === '' ? undefined : raw;
  const [value, change] = useValue(props, initial, (set) => ({ clear: async () => set(multi ? [] : undefined) }));
  return (
    <Shell {...props}>
      <TreeSelect
        style={{ width: '100%' }}
        treeData={toTree(properties.treeData)}
        value={value}
        multiple={multi}
        treeCheckable={properties.treeCheckable === true}
        showSearch={properties.showSearch === true}
        treeNodeFilterProp="title"
        placeholder={String(properties.placeholder ?? '')}
        disabled={!!properties.disabledState}
        onChange={(v) => change(v)}
      />
    </Shell>
  );
};

export const AntColorPicker = (props) => {
  const { properties } = props;
  const [value, change] = useValue(props, properties.defaultValue || '#1677ff');
  return (
    <Shell {...props}>
      <ColorPicker
        value={value}
        showText={properties.showText === true}
        disabled={!!properties.disabledState}
        onChangeComplete={(c) => change(c.toHexString())}
      />
    </Shell>
  );
};

const readFile = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || '');
      resolve({
        name: file.name,
        type: file.type,
        size: file.size,
        base64Data: url.slice(url.indexOf(',') + 1),
        dataUrl: url,
      });
    };
    reader.onerror = () => resolve({ name: file.name, type: file.type, size: file.size, base64Data: '', dataUrl: '' });
    reader.readAsDataURL(file);
  });

export const AntUpload = (props) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent } = props;
  // Files stay in the browser: nothing uploads on pick. The picked files are exposed (with base64 content) for a
  // query to send, like ToolJet's own file picker.
  const [fileList, setFileList] = useState([]);
  const [files, setFiles] = useState([]);
  useExposed(setExposedVariables, properties, { files, clear: async () => (setFileList([]), setFiles([])) });
  const maxCount = Number(properties.maxCount) || undefined;
  const common = {
    fileList,
    multiple: properties.multiple === true,
    maxCount,
    accept: properties.accept || undefined,
    disabled: !!properties.disabledState,
    beforeUpload: () => false,
    onChange: async ({ fileList: next }) => {
      setFileList(next);
      const read = await Promise.all(next.map((f) => readFile(f.originFileObj || f)));
      setFiles(read);
      setExposedVariable('files', read);
      fireEvent('onChange');
    },
  };
  const label = String(properties.buttonLabel ?? 'Click to upload');
  return (
    <Shell {...props}>
      {properties.variant === 'dragger' ? (
        <Upload.Dragger {...common}>
          <p className="ant-upload-text">{label}</p>
          {properties.hint ? <p className="ant-upload-hint">{String(properties.hint)}</p> : null}
        </Upload.Dragger>
      ) : (
        <Upload {...common}>
          <Button disabled={!!properties.disabledState}>{label}</Button>
        </Upload>
      )}
    </Shell>
  );
};

// ---- Data display ----------------------------------------------------------------------------------------------

export const AntTree = (props) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const treeData = toTree(properties.treeData);
  const [selected, setSelected] = useState('');
  const [checked, setChecked] = useState([]);
  useExposed(setExposedVariables, properties, {
    selectedValue: selected,
    selectedNode: plainNode(findNode(treeData, selected)),
    checkedValues: checked,
  });
  return (
    <Shell {...props} innerRef={ref}>
      <Tree
        // Remount when the expand-all default flips, since antd reads it once.
        key={String(properties.defaultExpandAll === true)}
        treeData={treeData}
        checkable={properties.checkable === true}
        showLine={properties.showLine === true}
        defaultExpandAll={properties.defaultExpandAll === true}
        disabled={!!properties.disabledState}
        selectedKeys={selected === '' ? [] : [selected]}
        checkedKeys={checked}
        onSelect={(keys) => {
          const id = keys.length ? keys[0] : '';
          setSelected(id);
          setExposedVariable('selectedValue', id);
          setExposedVariable('selectedNode', plainNode(findNode(treeData, id)));
          fireEvent('onSelect');
        }}
        onCheck={(keys) => {
          const next = Array.isArray(keys) ? keys : keys.checked;
          setChecked(next);
          setExposedVariable('checkedValues', next);
          fireEvent('onCheck');
        }}
      />
    </Shell>
  );
};

export const AntCollapse = (props) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const initial = list(properties.defaultOpen).map(String);
  const [open, setOpen] = useState(initial);
  useEffect(() => setOpen(initial), [JSON.stringify(initial)]); // eslint-disable-line react-hooks/exhaustive-deps
  const openIndexes = open.map(Number);
  useExposed(setExposedVariables, properties, { openIndexes });
  const items = list(properties.items).map((it, i) => ({
    key: String(i),
    label: String(it?.title ?? it?.label ?? ''),
    extra: it?.extra ? String(it.extra) : undefined,
    children: <div style={{ whiteSpace: 'pre-line' }}>{String(it?.content ?? it?.children ?? '')}</div>,
  }));
  return (
    <Shell {...props} innerRef={ref}>
      <Collapse
        items={items}
        activeKey={open}
        accordion={properties.accordion === true}
        ghost={properties.ghost === true}
        size={properties.size || 'middle'}
        onChange={(keys) => {
          const next = (Array.isArray(keys) ? keys : keys ? [keys] : []).map(String);
          setOpen(next);
          setExposedVariable('openIndexes', next.map(Number));
          fireEvent('onChange');
        }}
      />
    </Shell>
  );
};

export const AntImage = (props) => {
  const { properties, setExposedVariables, fireEvent, height } = props;
  useExposed(setExposedVariables, properties, {});
  return (
    <Shell {...props}>
      <Image
        src={properties.src || undefined}
        alt={String(properties.alt ?? '')}
        width="100%"
        height={height}
        preview={properties.preview !== false}
        style={{ objectFit: properties.fit || 'cover', borderRadius: Number(properties.radius) || 0 }}
        onClick={() => fireEvent('onClick')}
      />
    </Shell>
  );
};

export const AntCalendar = (props) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent, height } = props;
  const entries = list(properties.events);
  const byDate = entries.reduce((acc, e) => {
    const d = e?.date ? dayjs(String(e.date)).format('YYYY-MM-DD') : '';
    if (d) (acc[d] = acc[d] || []).push(e);
    return acc;
  }, {});
  const [date, setDate] = useState(properties.defaultValue ? dayjs(properties.defaultValue) : dayjs());
  useEffect(() => {
    if (properties.defaultValue) setDate(dayjs(properties.defaultValue));
  }, [properties.defaultValue]);
  const [selected, setSelected] = useState({ date: '', entry: {} });
  useExposed(setExposedVariables, properties, {
    selectedDate: selected.date,
    selectedEntry: selected.entry,
    visibleMonth: date.format('YYYY-MM'),
  });
  const cell = (d) => (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {(byDate[d.format('YYYY-MM-DD')] || []).map((e, i) => (
        <li
          key={i}
          style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          onClick={(ev) => {
            ev.stopPropagation();
            const ds = d.format('YYYY-MM-DD');
            setSelected({ date: ds, entry: e });
            setExposedVariable('selectedDate', ds);
            setExposedVariable('selectedEntry', e);
            fireEvent('onEntryClicked');
          }}
        >
          <Badge color={e?.color || 'blue'} text={String(e?.title ?? '')} />
        </li>
      ))}
    </ul>
  );
  return (
    <Shell {...props}>
      <div style={{ height, overflow: 'auto' }}>
        <Calendar
          fullscreen={properties.fullscreen !== false}
          value={date}
          cellRender={(d, info) => (info.type === 'date' ? cell(d) : null)}
          onPanelChange={(d) => {
            setDate(d);
            setExposedVariable('visibleMonth', d.format('YYYY-MM'));
          }}
          onSelect={(d, info) => {
            setDate(d);
            if (info?.source !== 'date') return;
            const ds = d.format('YYYY-MM-DD');
            setSelected({ date: ds, entry: {} });
            setExposedVariable('selectedDate', ds);
            setExposedVariable('selectedEntry', {});
            fireEvent('onSelect');
          }}
        />
      </div>
    </Shell>
  );
};

export const AntQRCode = (props) => {
  const { properties, setExposedVariables, width, height } = props;
  useExposed(setExposedVariables, properties, {});
  return (
    <Shell {...props}>
      <QRCode
        value={String(properties.value || ' ')}
        bordered={properties.bordered !== false}
        errorLevel={properties.errorLevel || 'M'}
        size={Math.max(64, Math.min(Number(width) || 160, Number(height) || 160) - 8)}
      />
    </Shell>
  );
};

export const AntSkeleton = (props) => {
  const { properties, setExposedVariables } = props;
  useExposed(setExposedVariables, properties, {});
  return (
    <Shell {...props}>
      <Skeleton
        avatar={properties.avatar === true}
        active={properties.active === true}
        paragraph={{ rows: Math.max(0, Number(properties.rows ?? 3) - 1) }}
      />
    </Shell>
  );
};

export const AntResult = (props) => {
  const { properties, setExposedVariables, fireEvent } = props;
  useExposed(setExposedVariables, properties, {});
  return (
    <Shell {...props}>
      <Result
        status={properties.status || 'info'}
        title={String(properties.title ?? '')}
        subTitle={properties.subTitle ? String(properties.subTitle) : undefined}
        extra={
          properties.buttonLabel ? (
            <Button
              type="primary"
              loading={!!properties.loadingState}
              disabled={!!properties.disabledState}
              onClick={() => fireEvent('onButtonClick')}
            >
              {String(properties.buttonLabel)}
            </Button>
          ) : undefined
        }
      />
    </Shell>
  );
};

export const AntPagination = (props) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent } = props;
  const [state, setState] = useState({
    page: Number(properties.defaultCurrent) || 1,
    size: Number(properties.pageSize) || 10,
  });
  useEffect(
    () => setState((s) => ({ ...s, page: Number(properties.defaultCurrent) || 1 })),
    [properties.defaultCurrent]
  );
  useEffect(() => setState((s) => ({ ...s, size: Number(properties.pageSize) || 10 })), [properties.pageSize]);
  useExposed(setExposedVariables, properties, {
    currentPage: state.page,
    pageSize: state.size,
    setPage: async (p) => setState((s) => ({ ...s, page: Number(p) || 1 })),
  });
  return (
    <Shell {...props}>
      <Pagination
        current={state.page}
        pageSize={state.size}
        total={Number(properties.total) || 0}
        simple={properties.simple === true}
        showSizeChanger={properties.showSizeChanger === true}
        showTotal={properties.showTotal === true ? (total, [a, b]) => `${a}-${b} of ${total}` : undefined}
        disabled={!!properties.disabledState}
        onChange={(page, size) => {
          setState({ page, size });
          setExposedVariable('currentPage', page);
          setExposedVariable('pageSize', size);
          fireEvent('onPageChanged');
        }}
      />
    </Shell>
  );
};
