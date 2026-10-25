import React, { useEffect, useRef } from 'react';
import { Select as AntSelect, Spin } from 'antd';
import type { RefSelectProps } from 'antd';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { AntProvider, usePopupTheme, useTokenStyles } from '../lib/AntProvider';
import { FormField, useControlLook, useFieldProps } from '../lib/FormField';
import { str, toOptions } from '../lib/data';
import { useOwnedPopup } from '../lib/useOwnerGuard';

// Forwards the ref, so the focus and blur actions reach Ant's Select (a plain function component dropped it).
const Control = React.forwardRef<RefSelectProps, React.ComponentProps<typeof AntSelect>>((p, ref) => {
  const popup = usePopupTheme();
  return <AntSelect {...p} ref={ref} classNames={{ popup: { root: popup.className } }} styles={{ popup: { root: popup.style } }} />;
});

// Ant's Select: mode ('' single, multiple, tags), options [{ label, value, disabled }], value (an array in multiple and
// tags modes, with selectedOptions), placeholder, allowClear, showSearch,
// notFoundContent; events onChange (also on clear), onSelect, onClear, onSearch, onOpenChange.
export const Select = (props: Record<string, unknown>) => {
  const field = useFieldProps({ label: 'Department' });
  const [rawOptions] = ToolJet.useStateArray({ name: 'options', label: 'Options', inspector: 'options', description: 'Plain values or [{ label, value, disabled? }].', initialValue: [
    { label: 'Design', value: 'design' },
    { label: 'Engineering', value: 'engineering' },
    { label: 'Marketing', value: 'marketing' },
    { label: 'Sales', value: 'sales' },
    { label: 'Support', value: 'support' },
  ] });
  const [mode] = ToolJet.useStateEnumeration({
    name: 'mode',
    label: 'Mode',
    enumDefinition: ['', 'multiple', 'tags'],
    enumLabels: { '': 'Single', multiple: 'Multiple', tags: 'Tags' },
    initialValue: '',
  });
  const [value, setValue] = ToolJet.useStateString({
    name: 'value',
    label: 'Value',
    description: 'The picked option value; an array of values in multiple and tags modes.',
    initialValue: '',
  });
  const [placeholder] = ToolJet.useStateString({ name: 'placeholder', label: 'Placeholder', initialValue: 'Select' });
  const [allowClear] = ToolJet.useStateBoolean({ name: 'allowClear', label: 'Allow clear', initialValue: false });
  const [showSearch] = ToolJet.useStateBoolean({ name: 'showSearch', label: 'Show search', initialValue: false });
  const [notFoundContent] = ToolJet.useStateString({ name: 'notFoundContent', label: 'Not found content', initialValue: 'No options' });
  const [, setSelectedOption] = ToolJet.useStateObject({ name: 'selectedOption', initialValue: {}, inspector: 'hidden' });
  const [, setSelectedOptions] = ToolJet.useStateArray({ name: 'selectedOptions', initialValue: [], inspector: 'hidden' });
  const [, setExposedOpen] = ToolJet.useStateBoolean({ name: 'open', initialValue: false, inspector: 'hidden' });
  const look = useControlLook();
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onSelect = ToolJet.useEventCallback({ name: 'onSelect' });
  const onClear = ToolJet.useEventCallback({ name: 'onClear' });
  const onSearch = ToolJet.useEventCallback({ name: 'onSearch' });
  const onOpenChange = ToolJet.useEventCallback({ name: 'onOpenChange' });
  const [, setSearchValue] = ToolJet.useStateString({ name: 'searchValue', initialValue: '', inspector: 'hidden' });
  const ref = useRef<RefSelectProps>(null);
  const { disabled, loading } = ToolJet.useControlState();
  const fieldId = ToolJet.useFieldId();
  const options = toOptions(rawOptions);
  const many = mode === 'multiple' || mode === 'tags';
  // In multiple and tags modes the value is an array (an Inspector value may also be one value or a JSON array).
  const values = toValues(value);
  const known = value !== '' && options.some((o) => o.value === value);
  const check = ToolJet.useValidation({ section: 'choice', value: many ? values.join(',') : value, present: many ? values.length > 0 : value !== '' });
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 6 });

  const optionsFor = (raw: unknown) => {
    const list = many ? toValues(raw) : [];
    return {
      option: many ? {} : options.find((o) => o.value === str(raw)) ?? {},
      options: many ? list.map((v) => options.find((o) => o.value === v) ?? { label: v, value: v }) : [],
    };
  };
  const change = (next: unknown) => {
    const stored = many ? toValues(next) : next === undefined || next === null ? '' : str(Array.isArray(next) ? next[0] : next);
    setValue(stored as string);
    // Set with the value, so an onChange handler reads them already.
    const picked = optionsFor(stored);
    setSelectedOption(picked.option);
    setSelectedOptions(picked.options);
    onChange();
  };
  // The selected option(s) follow the value however it changes (a pick, a binding, a Form's clearForm emptying it) and
  // the options' labels: set only on a pick, a cleared Form kept exposing the old choice.
  const optionsKey = JSON.stringify(options);
  useEffect(() => {
    const picked = optionsFor(value);
    setSelectedOption(picked.option);
    setSelectedOptions(picked.options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value), optionsKey, many]);
  // A cleared Form also forgets the last search, and in multiple and tags modes empties to no values ([]), not to the
  // single mode's '' the host clears every text value to.
  (ToolJet as { useFormClear?: (f: () => void) => void }).useFormClear?.(() => {
    setSearchValue('');
    if (many) setValue([] as unknown as string);
  });
  const popup = useOwnedPopup(disabled, (next) => {
    setExposedOpen(next);
    if (!next) {
      setSearchValue('');
      check.touch();
    }
    onOpenChange();
  });
  ToolJet.useAction(
    { name: 'setFieldValue', displayName: 'Set field value', params: [{ handle: 'value', displayName: 'Value' }] },
    (next) => change(next)
  );
  ToolJet.useAction({ name: 'resetFields', displayName: 'Reset field' }, () => change(props.value));
  ToolJet.useAction({ name: 'focus', displayName: 'Focus' }, () => ref.current?.focus());
  ToolJet.useAction({ name: 'blur', displayName: 'Blur' }, () => ref.current?.blur());

  return (
    <AntProvider tokens={tokens} ownerRef={popup.anchor}>
      <FormField {...field} check={check} htmlFor={fieldId}>
        <Control
          ref={ref}
          id={fieldId}
          style={{ width: '100%' }}
          options={options}
          mode={many ? (mode as 'multiple') : undefined}
          maxTagCount={many ? 'responsive' : undefined}
          // Single: a value not (yet) among the options shows as the placeholder, not as a bare value. Multiple keeps
          // only known values; tags keeps every value (a tag is any text).
          value={many ? (mode === 'tags' ? values : values.filter((v) => options.some((o) => o.value === v))) : known ? value : undefined}
          placeholder={placeholder || undefined}
          disabled={disabled}
          loading={loading}
          allowClear={allowClear}
          showSearch={showSearch}
          optionFilterProp="label"
          notFoundContent={loading ? <Spin size="small" /> : notFoundContent || undefined}
          variant={look.variant}
          size={look.size}
          status={check.error ? 'error' : undefined}
          open={popup.open}
          onOpenChange={popup.onOpenChange}
          // A pick in the instant the owner stopped taking input (before the guard closed the list) is refused.
          onChange={(v) => popup.available() && change(v)}
          onSelect={() => popup.available() && onSelect()}
          onClear={() => onClear()}
          onSearch={(text) => {
            setSearchValue(text);
            onSearch();
          }}
        />
      </FormField>
    </AntProvider>
  );
};

const toValues = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw.map(str).filter((v) => v !== '');
  const s = str(raw).trim();
  if (!s) return [];
  if (s.startsWith('[')) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.map(str).filter((v) => v !== '');
    } catch {
      // not JSON: one value
    }
  }
  return [s];
};
