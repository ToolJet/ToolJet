import React, { useState } from 'react';
import {
  AutoComplete as AntAutoComplete,
  Button,
  Cascader as AntCascader,
  ColorPicker as AntColorPicker,
  DatePicker,
  Spin,
  TimePicker as AntTimePicker,
  Transfer as AntTransfer,
  TreeSelect as AntTreeSelect,
  Upload as AntUpload,
} from 'antd';
import type { UploadFile } from 'antd';
import { InboxOutlined, UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { AntProvider, usePopupTheme, useTokenStyles } from '../lib/AntProvider';
import { ControlSkeleton, SpinOver } from '../lib/Loading';
import { FormField, useControlLook, useFieldProps } from '../lib/FormField';
import { str, toArray, toOptions, type Row } from '../lib/data';

const useFieldActions = (change: (v: unknown) => void, initial: unknown) => {
  ToolJet.useAction(
    { name: 'setFieldValue', displayName: 'Set field value', params: [{ handle: 'value', displayName: 'Value' }] },
    (next) => change(next)
  );
  ToolJet.useAction({ name: 'resetFields', displayName: 'Reset field' }, () => change(initial));
};

const parseDate = (v: unknown, format?: string): Dayjs | null => {
  const s = str(v).trim();
  if (!s) return null;
  const d = format ? dayjs(`2000-01-01 ${s}`, `YYYY-MM-DD ${format}`) : dayjs(s);
  return d.isValid() ? d : null;
};

type FileInfo = { uid: string; name: string; size: number; type: string; base64: string; content: string };
const readFile = (file: File): Promise<FileInfo & { file: File }> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result ?? '');
      const base64 = url.slice(url.indexOf(',') + 1);
      let content = '';
      if (/^text\/|json|csv|xml/.test(file.type) && file.size < 2_000_000) {
        try {
          content = atob(base64);
        } catch {
          content = '';
        }
      }
      resolve({ uid: `${file.name}-${file.size}-${file.lastModified}`, name: file.name, size: file.size, type: file.type, base64, content, file });
    };
    reader.readAsDataURL(file);
  });

// Ant's Upload (Upload.Dragger by default): the files stay in the browser (no action URL); fileList exposes each as
// { uid, name, size, type, base64, content (text files) } for a query to send. accept, multiple, maxCount, listType,
// text and hint (the dragger's two lines); events onChange, onRemove; resetFields empties the list.
export const Upload = () => {
  const field = useFieldProps();
  const [type] = ToolJet.useStateEnumeration({ name: 'type', label: 'Type', enumDefinition: ['drag', 'select'], enumLabels: { drag: 'Drag area', select: 'Button' }, initialValue: 'drag' });
  const [text] = ToolJet.useStateString({ name: 'text', label: 'Text', initialValue: 'Click or drag a file to this area' });
  const [hint] = ToolJet.useStateString({ name: 'hint', label: 'Hint', initialValue: '' });
  const [accept] = ToolJet.useStateString({ name: 'accept', label: 'Accept', description: 'e.g. .csv,.xlsx or image/*', initialValue: '' });
  const [multiple] = ToolJet.useStateBoolean({ name: 'multiple', label: 'Multiple', initialValue: false });
  const [maxCount] = ToolJet.useStateNumber({ name: 'maxCount', label: 'Max count', description: '0 for no limit.', initialValue: 0, min: 0 });
  const [listType] = ToolJet.useStateEnumeration({ name: 'listType', label: 'List type', enumDefinition: ['text', 'picture'], initialValue: 'text' });
  const [fileList, setFileList] = ToolJet.useStateArray({ name: 'fileList', initialValue: [], inspector: 'hidden' });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onRemove = ToolJet.useEventCallback({ name: 'onRemove' });
  const { disabled, loading } = ToolJet.useControlState();
  const files = toArray(fileList) as FileInfo[];
  const check = ToolJet.useValidation({ section: 'choice', value: files.length ? 'files' : '', present: files.length > 0 });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 14, defaultHeight: 16 });
  const [uiFiles, setUiFiles] = useState<UploadFile[]>([]);

  const set = (next: (FileInfo & { file?: File })[]) => {
    setFileList(next.map(({ file: _f, ...rest }) => rest));
    setUiFiles(next.map((f) => ({ uid: f.uid, name: f.name, status: 'done', size: f.size, type: f.type, originFileObj: f.file as never, thumbUrl: f.type.startsWith('image/') ? `data:${f.type};base64,${f.base64}` : undefined })));
    check.touch();
    onChange();
  };
  ToolJet.useAction({ name: 'resetFields', displayName: 'Clear files' }, () => set([]));
  // A Form's clearForm empties the files (the host clears only `value`).
  (ToolJet as { useFormClear?: (f: () => void) => void }).useFormClear?.(() => {
    setFileList([]);
    setUiFiles([]);
  });

  const limit = Number(maxCount) > 0 ? Number(maxCount) : undefined;
  const props = {
    accept: accept || undefined,
    multiple,
    maxCount: limit,
    listType: listType as 'text',
    disabled,
    fileList: uiFiles,
    beforeUpload: async (_file: File, batch: File[]) => {
      // Ant calls this once per file with the whole batch; read the batch once, on its first file.
      if (batch[0] !== _file) return false;
      const read = await Promise.all(batch.map(readFile));
      const merged = [...(files as FileInfo[]), ...read];
      set(limit ? merged.slice(-limit) : merged);
      return false;
    },
    onRemove: (f: UploadFile) => {
      set((files as FileInfo[]).filter((x) => x.uid !== f.uid));
      onRemove();
      return true;
    },
  };
  return (
    <AntProvider tokens={tokens} fill={type === 'drag'} className="tj-ant-upload">
      <FormField {...field} check={check}>
        <SpinOver loading={loading} as="fill">
          {type === 'drag' ? (
            <AntUpload.Dragger {...props}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              {text ? <p className="ant-upload-text">{text}</p> : null}
              {hint ? <p className="ant-upload-hint">{hint}</p> : null}
            </AntUpload.Dragger>
          ) : (
            <AntUpload {...props}>
              <Button icon={<UploadOutlined />} disabled={disabled}>
                {text || 'Select file'}
              </Button>
            </AntUpload>
          )}
        </SpinOver>
      </FormField>
    </AntProvider>
  );
};

// Ant's TimePicker: value as text in valueFormat (HH:mm by default), format (display), use12Hours, hourStep,
// minuteStep, placeholder, allowClear; event onChange.
export const TimePicker = (props: Record<string, unknown>) => {
  const field = useFieldProps();
  const [value, setValue] = ToolJet.useStateString({ name: 'value', label: 'Value', description: 'e.g. 09:30', initialValue: '' });
  const [format] = ToolJet.useStateString({ name: 'format', label: 'Format', description: 'HH:mm, HH:mm:ss or h:mm a', initialValue: 'HH:mm' });
  const [use12Hours] = ToolJet.useStateBoolean({ name: 'use12Hours', label: 'Use 12 hours', initialValue: false });
  const [hourStep] = ToolJet.useStateNumber({ name: 'hourStep', label: 'Hour step', initialValue: 1, min: 1, max: 12 });
  const [minuteStep] = ToolJet.useStateNumber({ name: 'minuteStep', label: 'Minute step', initialValue: 1, min: 1, max: 30 });
  const [placeholder] = ToolJet.useStateString({ name: 'placeholder', label: 'Placeholder', initialValue: '' });
  const [allowClear] = ToolJet.useStateBoolean({ name: 'allowClear', label: 'Allow clear', initialValue: true });
  const look = useControlLook();
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const check = ToolJet.useValidation({ section: 'date', value });
  const tokens = useTokenStyles();
  const popup = usePopupTheme();
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 6 });
  const fmt = str(format).trim() || (use12Hours ? 'h:mm a' : 'HH:mm');
  // The value keeps 24-hour text whatever the display, so queries read one shape.
  const valueFormat = /s/.test(fmt) ? 'HH:mm:ss' : 'HH:mm';
  const change = (d: Dayjs | null) => {
    setValue(d ? d.format(valueFormat) : '');
    onChange();
  };
  useFieldActions((v) => change(parseDate(v, 'HH:mm:ss') ?? parseDate(v, 'HH:mm')), props.value);
  const current = parseDate(value, valueFormat) ?? parseDate(value, 'HH:mm');
  return (
    <AntProvider tokens={tokens}>
      <FormField {...field} check={check} htmlFor={fieldId}>
        <ControlSkeleton loading={loading} size={look.size}>
          <AntTimePicker
            id={fieldId}
            style={{ width: '100%' }}
            value={current}
            format={fmt}
            use12Hours={use12Hours}
            hourStep={Math.max(1, Number(hourStep) || 1) as 1}
            minuteStep={Math.max(1, Number(minuteStep) || 1) as 1}
            placeholder={placeholder || undefined}
            allowClear={allowClear}
            disabled={disabled}
            variant={look.variant}
            size={look.size}
            status={check.error ? 'error' : undefined}
            popupClassName={popup.className}
            popupStyle={popup.style}
            onChange={(d) => change(d as Dayjs | null)}
            onOpenChange={(open) => !open && check.touch()}
          />
        </ControlSkeleton>
      </FormField>
    </AntProvider>
  );
};

// Ant's DatePicker.RangePicker: value [start, end] as YYYY-MM-DD text (startDate and endDate exposed too), format,
// picker, minDate, maxDate, placeholder [start, end], allowClear; event onChange.
export const RangePicker = (props: Record<string, unknown>) => {
  const field = useFieldProps();
  const [value, setValue] = ToolJet.useStateArray({ name: 'value', label: 'Value', description: "['2026-01-01', '2026-01-31']", initialValue: [] });
  const [format] = ToolJet.useStateString({ name: 'format', label: 'Format', initialValue: 'YYYY-MM-DD' });
  const [picker] = ToolJet.useStateEnumeration({ name: 'picker', label: 'Picker', enumDefinition: ['date', 'week', 'month', 'quarter', 'year'], initialValue: 'date' });
  const [minDate] = ToolJet.useStateString({ name: 'minDate', label: 'Min date', initialValue: '' });
  const [maxDate] = ToolJet.useStateString({ name: 'maxDate', label: 'Max date', initialValue: '' });
  const [allowClear] = ToolJet.useStateBoolean({ name: 'allowClear', label: 'Allow clear', initialValue: true });
  const [, setStartDate] = ToolJet.useStateString({ name: 'startDate', initialValue: '', inspector: 'hidden' });
  const [, setEndDate] = ToolJet.useStateString({ name: 'endDate', initialValue: '', inspector: 'hidden' });
  const look = useControlLook();
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const pair = toArray(value).map((v) => parseDate(v));
  const check = ToolJet.useValidation({ section: 'date', value: pair[0] ? str(toArray(value)[0]) : '' });
  const tokens = useTokenStyles();
  const popup = usePopupTheme();
  ToolJet.useComponentSettings({ defaultWidth: 14, defaultHeight: 6 });
  React.useEffect(() => {
    setStartDate(pair[0] ? pair[0].format('YYYY-MM-DD') : '');
    setEndDate(pair[1] ? pair[1].format('YYYY-MM-DD') : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value)]);
  const change = (next: unknown) => {
    const arr = toArray(next).map((v) => (dayjs.isDayjs(v) ? v : parseDate(v)));
    setValue(arr.length === 2 && arr[0] && arr[1] ? arr.map((d) => (d as Dayjs).format('YYYY-MM-DD')) : []);
    onChange();
  };
  useFieldActions(change, props.value);
  return (
    <AntProvider tokens={tokens}>
      <FormField {...field} check={check} htmlFor={fieldId}>
        <ControlSkeleton loading={loading} size={look.size}>
          <DatePicker.RangePicker
            id={fieldId as never}
            style={{ width: '100%' }}
            value={pair[0] && pair[1] ? [pair[0], pair[1]] : null}
            format={str(format).trim() || 'YYYY-MM-DD'}
            picker={picker as 'date'}
            minDate={parseDate(minDate) ?? undefined}
            maxDate={parseDate(maxDate) ?? undefined}
            allowClear={allowClear}
            disabled={disabled}
            variant={look.variant}
            size={look.size}
            status={check.error ? 'error' : undefined}
            popupClassName={popup.className}
            popupStyle={popup.style}
            onChange={(dates) => change(dates ?? [])}
            onOpenChange={(open) => !open && check.touch()}
          />
        </ControlSkeleton>
      </FormField>
    </AntProvider>
  );
};

// Ant's AutoComplete: free text with suggestions. options [{ label, value }] (or strings), value, placeholder,
// filterOption (match typed text), allowClear; events onChange, onSelect, onSearch.
export const AutoComplete = (props: Record<string, unknown>) => {
  const field = useFieldProps();
  const [rawOptions] = ToolJet.useStateArray({ name: 'options', label: 'Options', initialValue: [
    { label: 'Laptop stand', value: 'Laptop stand' },
    { label: 'Mechanical keyboard', value: 'Mechanical keyboard' },
    { label: 'Monitor arm', value: 'Monitor arm' },
    { label: 'USB-C hub', value: 'USB-C hub' },
    { label: 'Wireless mouse', value: 'Wireless mouse' },
  ] });
  const [value, setValue] = ToolJet.useStateString({ name: 'value', label: 'Value', initialValue: '' });
  const [placeholder] = ToolJet.useStateString({ name: 'placeholder', label: 'Placeholder', initialValue: '' });
  const [filterOption] = ToolJet.useStateBoolean({ name: 'filterOption', label: 'Filter option', description: 'Show only the options matching the text.', initialValue: true });
  const [allowClear] = ToolJet.useStateBoolean({ name: 'allowClear', label: 'Allow clear', initialValue: false });
  const look = useControlLook();
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onSelect = ToolJet.useEventCallback({ name: 'onSelect' });
  const onSearch = ToolJet.useEventCallback({ name: 'onSearch' });
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const check = ToolJet.useValidation({ section: 'text', value });
  const tokens = useTokenStyles();
  const popup = usePopupTheme();
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 6 });
  const change = (v: unknown) => {
    setValue(str(v));
    onChange();
  };
  useFieldActions(change, props.value);
  return (
    <AntProvider tokens={tokens}>
      <FormField {...field} check={check} htmlFor={fieldId}>
        <ControlSkeleton loading={loading} size={look.size}>
          <AntAutoComplete
            id={fieldId}
            style={{ width: '100%' }}
            options={toOptions(rawOptions)}
            value={value}
            placeholder={placeholder || undefined}
            filterOption={filterOption ? (input, option) => str(option?.label ?? option?.value).toLowerCase().includes(input.toLowerCase()) : false}
            allowClear={allowClear}
            disabled={disabled}
            notFoundContent={loading ? <Spin size="small" /> : undefined}
            variant={look.variant}
            size={look.size}
            status={check.error ? 'error' : undefined}
            classNames={{ popup: { root: popup.className } }}
            styles={{ popup: { root: popup.style } }}
            onChange={(v) => change(v)}
            onSelect={() => onSelect()}
            onSearch={() => onSearch()}
            onBlur={() => check.touch()}
          />
        </ControlSkeleton>
      </FormField>
    </AntProvider>
  );
};

type TreeNode = { title: string; value: string; key: string; children?: TreeNode[] };
// Ant's treeData: [{ title, value, children }]; also { label } for title and { key } for value.
export const toTree = (raw: unknown): TreeNode[] =>
  toArray(raw)
    .map((o): TreeNode | null => {
      if (typeof o === 'string') return { title: o, value: o, key: o };
      if (!o || typeof o !== 'object') return null;
      const r = o as Row;
      const value = str(r.value ?? r.key ?? r.title ?? r.label);
      const children = toTree(r.children);
      return { title: str(r.title ?? r.label ?? value), value, key: value, ...(children.length ? { children } : {}) };
    })
    .filter((n): n is TreeNode => !!n && n.value !== '');

// Ant's TreeSelect: treeData, value (an array when multiple or treeCheckable), placeholder, showSearch,
// treeDefaultExpandAll, allowClear; event onChange.
export const TreeSelect = (props: Record<string, unknown>) => {
  const field = useFieldProps();
  const [treeData] = ToolJet.useStateArray({ name: 'treeData', label: 'Tree data', description: '[{ title, value, children: [...] }]', initialValue: [
    {
      title: 'Engineering',
      value: 'engineering',
      children: [
        { title: 'Frontend', value: 'frontend' },
        { title: 'Backend', value: 'backend' },
        { title: 'Platform', value: 'platform' },
      ],
    },
    { title: 'Operations', value: 'operations', children: [{ title: 'Finance', value: 'finance' }, { title: 'People', value: 'people' }] },
  ] });
  const [value, setValue] = ToolJet.useStateString({ name: 'value', label: 'Value', description: 'A value, or an array of values when multiple.', initialValue: '' });
  const [multiple] = ToolJet.useStateBoolean({ name: 'multiple', label: 'Multiple', initialValue: false });
  const [treeCheckable] = ToolJet.useStateBoolean({ name: 'treeCheckable', label: 'Tree checkable', initialValue: false });
  const [placeholder] = ToolJet.useStateString({ name: 'placeholder', label: 'Placeholder', initialValue: '' });
  const [showSearch] = ToolJet.useStateBoolean({ name: 'showSearch', label: 'Show search', initialValue: true });
  const [treeDefaultExpandAll] = ToolJet.useStateBoolean({ name: 'treeDefaultExpandAll', label: 'Expand all', initialValue: false });
  const [allowClear] = ToolJet.useStateBoolean({ name: 'allowClear', label: 'Allow clear', initialValue: true });
  const look = useControlLook();
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const many = multiple || treeCheckable;
  const current: unknown = value as unknown;
  const values = Array.isArray(current) ? current.map(str) : current === '' || current === undefined || current === null ? [] : [str(current)];
  const check = ToolJet.useValidation({ section: 'choice', value: values.join(','), present: values.length > 0 });
  const tokens = useTokenStyles();
  const popup = usePopupTheme();
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 6 });
  const change = (v: unknown) => {
    const arr = Array.isArray(v) ? v.map(str) : v === undefined || v === null || v === '' ? [] : [str(v)];
    setValue((many ? arr : arr[0] ?? '') as string);
    onChange();
  };
  useFieldActions(change, props.value);
  return (
    <AntProvider tokens={tokens}>
      <FormField {...field} check={check} htmlFor={fieldId}>
        <AntTreeSelect
          id={fieldId}
          style={{ width: '100%' }}
          treeData={toTree(treeData)}
          value={many ? values : values[0]}
          multiple={multiple}
          treeCheckable={treeCheckable}
          placeholder={placeholder || undefined}
          showSearch={showSearch}
          treeNodeFilterProp="title"
          treeDefaultExpandAll={treeDefaultExpandAll}
          allowClear={allowClear}
          disabled={disabled}
          loading={loading}
          notFoundContent={loading ? <Spin size="small" /> : undefined}
          variant={look.variant}
          size={look.size}
          status={check.error ? 'error' : undefined}
          classNames={{ popup: { root: popup.className } }}
          styles={{ popup: { root: popup.style } }}
          onChange={(v) => change(v)}
          onOpenChange={(open) => !open && check.touch()}
        />
      </FormField>
    </AntProvider>
  );
};

// Ant's Cascader: options [{ label, value, children }], value (the path, an array), placeholder, expandTrigger,
// changeOnSelect, showSearch; event onChange.
export const Cascader = (props: Record<string, unknown>) => {
  const field = useFieldProps();
  const [rawOptions] = ToolJet.useStateArray({ name: 'options', label: 'Options', description: '[{ label, value, children: [...] }]', initialValue: [
    {
      label: 'Europe',
      value: 'europe',
      children: [
        { label: 'Germany', value: 'germany', children: [{ label: 'Berlin', value: 'berlin' }, { label: 'Munich', value: 'munich' }] },
        { label: 'Portugal', value: 'portugal', children: [{ label: 'Lisbon', value: 'lisbon' }, { label: 'Porto', value: 'porto' }] },
      ],
    },
    {
      label: 'Asia',
      value: 'asia',
      children: [
        { label: 'Japan', value: 'japan', children: [{ label: 'Osaka', value: 'osaka' }, { label: 'Tokyo', value: 'tokyo' }] },
        { label: 'Singapore', value: 'singapore' },
      ],
    },
  ] });
  const [value, setValue] = ToolJet.useStateArray({ name: 'value', label: 'Value', description: "The path: ['asia', 'japan']", initialValue: [] });
  const [placeholder] = ToolJet.useStateString({ name: 'placeholder', label: 'Placeholder', initialValue: '' });
  const [expandTrigger] = ToolJet.useStateEnumeration({ name: 'expandTrigger', label: 'Expand trigger', enumDefinition: ['click', 'hover'], initialValue: 'click' });
  const [changeOnSelect] = ToolJet.useStateBoolean({ name: 'changeOnSelect', label: 'Change on select', description: 'Any level can be picked, not only leaves.', initialValue: false });
  const [showSearch] = ToolJet.useStateBoolean({ name: 'showSearch', label: 'Show search', initialValue: false });
  const look = useControlLook();
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const path = toArray(value).map(str);
  const check = ToolJet.useValidation({ section: 'choice', value: path.join('/'), present: path.length > 0 });
  const tokens = useTokenStyles();
  const popup = usePopupTheme();
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 6 });
  const toCascade = (raw: unknown): { label: string; value: string; children?: unknown[] }[] =>
    toTree(raw).map(function map(n): { label: string; value: string; children?: unknown[] } {
      return { label: n.title, value: n.value, ...(n.children ? { children: n.children.map(map) } : {}) };
    });
  const change = (v: unknown) => {
    setValue(toArray(v).map(str));
    onChange();
  };
  useFieldActions(change, props.value);
  return (
    <AntProvider tokens={tokens}>
      <FormField {...field} check={check} htmlFor={fieldId}>
        <AntCascader
          id={fieldId}
          style={{ width: '100%' }}
          options={toCascade(rawOptions) as never}
          value={path.length ? (path as never) : undefined}
          placeholder={placeholder || undefined}
          expandTrigger={expandTrigger as 'click'}
          changeOnSelect={changeOnSelect}
          showSearch={showSearch}
          disabled={disabled}
          loading={loading}
          notFoundContent={loading ? <Spin size="small" /> : undefined}
          variant={look.variant}
          size={look.size}
          status={check.error ? 'error' : undefined}
          classNames={{ popup: { root: popup.className } }}
          styles={{ popup: { root: popup.style } }}
          onChange={(v) => change(v)}
          onOpenChange={(open) => !open && check.touch()}
        />
      </FormField>
    </AntProvider>
  );
};

// Ant's ColorPicker: value (hex, or rgb text), format (hex, rgb), showText, allowClear, disabledAlpha, presets
// [{ label, colors }]; events onChange, onChangeComplete.
export const ColorPicker = (props: Record<string, unknown>) => {
  const field = useFieldProps();
  const [value, setValue] = ToolJet.useStateString({ name: 'value', label: 'Value', initialValue: '' });
  const [format] = ToolJet.useStateEnumeration({ name: 'format', label: 'Format', enumDefinition: ['hex', 'rgb'], initialValue: 'hex' });
  const [showText] = ToolJet.useStateBoolean({ name: 'showText', label: 'Show text', initialValue: true });
  const [allowClear] = ToolJet.useStateBoolean({ name: 'allowClear', label: 'Allow clear', initialValue: false });
  const [disabledAlpha] = ToolJet.useStateBoolean({ name: 'disabledAlpha', label: 'Disable alpha', initialValue: true });
  const [presets] = ToolJet.useStateArray({ name: 'presets', label: 'Presets', description: "[{ label: 'Brand', colors: ['#1677ff'] }]", initialValue: [] });
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['small', 'middle', 'large'], initialValue: 'middle' });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onChangeComplete = ToolJet.useEventCallback({ name: 'onChangeComplete' });
  const { disabled, loading } = ToolJet.useControlState();
  const check = ToolJet.useValidation({ section: 'text', value });
  const tokens = useTokenStyles();
  const popup = usePopupTheme();
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 6 });
  useFieldActions((v) => {
    setValue(str(v));
    onChange();
  }, props.value);
  const presetList = toArray(presets)
    .map((p) => (p && typeof p === 'object' ? { label: str((p as Row).label), colors: toArray((p as Row).colors).map(str) } : null))
    .filter((p): p is { label: string; colors: string[] } => !!p && p.colors.length > 0);
  return (
    <AntProvider tokens={tokens}>
      <FormField {...field} check={check}>
        <SpinOver loading={loading} as="inline">
          <AntColorPicker
            value={value || undefined}
            format={format as 'hex'}
            showText={showText}
            allowClear={allowClear}
            disabledAlpha={disabledAlpha}
            presets={presetList.length ? presetList : undefined}
            size={size as 'middle'}
            disabled={disabled}
            rootClassName={popup.className}
            styles={{ popup: popup.style } as never}
            onChange={(c, css) => {
              setValue(c.cleared ? '' : format === 'rgb' ? css : c.toHexString());
              onChange();
            }}
            onChangeComplete={() => onChangeComplete()}
            onOpenChange={(open) => !open && check.touch()}
            onClear={() => {
              setValue('');
              check.touch();
              onChange();
            }}
          />
        </SpinOver>
      </FormField>
    </AntProvider>
  );
};

// Ant's Transfer: dataSource [{ key, title }], targetKeys (the chosen keys), titles [left, right], showSearch,
// oneWay; event onChange.
export const Transfer = (props: Record<string, unknown>) => {
  const [dataSource] = ToolJet.useStateArray({ name: 'dataSource', label: 'Data source', description: '[{ key, title }]', initialValue: [
    { key: 'orders', title: 'Orders' },
    { key: 'invoices', title: 'Invoices' },
    { key: 'customers', title: 'Customers' },
    { key: 'products', title: 'Products' },
    { key: 'shipments', title: 'Shipments' },
    { key: 'returns', title: 'Returns' },
  ] });
  const [targetKeys, setTargetKeys] = ToolJet.useStateArray({ name: 'targetKeys', label: 'Target keys', initialValue: [] });
  const [titles] = ToolJet.useStateArray({ name: 'titles', label: 'Titles', initialValue: ['Available', 'Selected'] });
  const [showSearch] = ToolJet.useStateBoolean({ name: 'showSearch', label: 'Show search', initialValue: true });
  const [oneWay] = ToolJet.useStateBoolean({ name: 'oneWay', label: 'One way', initialValue: false });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const { disabled, loading } = ToolJet.useControlState();
  const keys = toArray(targetKeys).map(str);
  const check = ToolJet.useValidation({ section: 'choice', value: keys.join(','), present: keys.length > 0 });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 24, defaultHeight: 30 });
  const items = toArray(dataSource)
    .map((o) => {
      if (typeof o === 'string') return { key: o, title: o };
      const r = (o ?? {}) as Row;
      const key = str(r.key ?? r.value ?? r.id);
      return key ? { key, title: str(r.title ?? r.label ?? key), description: str(r.description) || undefined } : null;
    })
    .filter((x): x is { key: string; title: string; description?: string } => !!x);
  const change = (keys: unknown) => {
    setTargetKeys(toArray(keys).map(str));
    check.touch();
    onChange();
  };
  useFieldActions(change, props.targetKeys);
  (ToolJet as { useFormClear?: (f: () => void) => void }).useFormClear?.(() => setTargetKeys([]));
  return (
    <AntProvider tokens={tokens} fill className="tj-ant-transfer">
      <SpinOver loading={loading} as="fill">
        <AntTransfer
          dataSource={items}
          targetKeys={keys}
          status={check.error ? 'error' : undefined}
          titles={toArray(titles).map(str).slice(0, 2)}
          showSearch={showSearch}
          oneWay={oneWay}
          disabled={disabled}
          render={(item) => item.title}
          onChange={(keys) => change(keys)}
        />
        {check.error ? (
          <div className="tj-ant-transfer-error" role="alert">
            {check.error}
          </div>
        ) : null}
      </SpinOver>
    </AntProvider>
  );
};
