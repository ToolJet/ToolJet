import React from 'react';
import {
  MoveHorizontal,
  MoveVertical,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  ArrowUpFromLine,
  FoldVertical,
  ArrowDownToLine,
} from 'lucide-react';
import { resolveReferences } from '@/_helpers/utils';
import Dropdown from '@/components/ui/Dropdown/Index';

const LABEL_STYLE = {
  fontSize: '12px',
  color: 'var(--text-default)',
  fontFamily: 'IBM Plex Sans, sans-serif',
  lineHeight: '18px',
  flexShrink: 0,
};

const ROW_STYLE = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  minHeight: '32px',
  width: '100%',
};

const TOGGLE_TRACK_STYLE = {
  display: 'flex',
  alignItems: 'flex-start',
  padding: '2px',
  borderRadius: '6px',
  background: 'rgba(136, 144, 153, 0.08)',
  width: '168px',
  boxSizing: 'border-box',
};

const STACK_BELOW_OPTIONS = {
  none: { label: 'None', value: 'none' },
  mobile: { label: 'Mobile (375px)', value: 'mobile' },
  tablet: { label: 'Tablet (768px)', value: 'tablet' },
};

function IconToggle({ value, onChange, options }) {
  return (
    <div style={TOGGLE_TRACK_STYLE} role="group">
      {options.map((opt) => {
        const active = value != null && value === opt.value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '5px',
              borderRadius: '5px',
              border: 'none',
              cursor: 'pointer',
              background: active ? 'var(--bg-surface-layer-01, #fff)' : 'transparent',
              boxShadow: active ? '0px 0px 0.5px rgba(48, 50, 51, 0.05), 0px 1px 0.5px rgba(48, 50, 51, 0.1)' : 'none',
              minWidth: 0,
            }}
          >
            <Icon size={18} strokeWidth={1.75} color="var(--text-default)" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}

function NumberField({ value, onChange }) {
  return (
    <input
      type="number"
      min={0}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
      }}
      style={{
        width: '168px',
        height: '32px',
        padding: '0 10px',
        fontSize: '12px',
        fontFamily: 'IBM Plex Mono, monospace',
        color: 'var(--text-default)',
        background: 'var(--bg-surface-layer-01, white)',
        border: '1px solid var(--border-default, #ccd1d5)',
        borderRadius: '6px',
        outline: 'none',
        boxSizing: 'border-box',
      }}
    />
  );
}

function ToggleSwitch({ checked, onChange, id }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: '28px',
        height: '16px',
        borderRadius: '12px',
        border: 'none',
        padding: '2px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: checked ? 'flex-end' : 'flex-start',
        background: checked ? '#4368e3' : 'rgba(136, 144, 153, 0.18)',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: '#fff',
          display: 'block',
        }}
      />
    </button>
  );
}

const JUSTIFY_ICON_OPTIONS = [
  { value: 'flex-start', icon: AlignHorizontalJustifyStart },
  { value: 'center', icon: AlignHorizontalJustifyCenter },
  { value: 'flex-end', icon: AlignHorizontalJustifyEnd },
];

const ALIGN_ICON_OPTIONS = [
  { value: 'flex-start', icon: ArrowUpFromLine },
  { value: 'center', icon: FoldVertical },
  { value: 'flex-end', icon: ArrowDownToLine },
];

function justifyForToggle(v) {
  if (JUSTIFY_ICON_OPTIONS.some((o) => o.value === v)) return v;
  return null;
}

/** Returns null when value is stretch (no icon matches). */
function alignForToggle(v) {
  if (v === 'stretch') return null;
  if (ALIGN_ICON_OPTIONS.some((o) => o.value === v)) return v;
  return 'flex-start';
}

export const FlexContainerLayoutPanel = ({ component, paramUpdated }) => {
  const defProps = component?.component?.definition?.properties ?? {};

  const getParam = (name) => defProps[name] ?? {};

  const updateValue = (name, value) => {
    paramUpdated({ name, ...getParam(name) }, 'value', value, 'properties');
  };

  const direction = resolveReferences(defProps.direction?.value) || 'column';
  const justifyToggleValue = justifyForToggle(resolveReferences(defProps.justify?.value) || 'flex-start');
  const alignRaw = resolveReferences(defProps.align?.value) ?? 'stretch';
  const alignToggleValue = alignForToggle(alignRaw);
  const flexWrapRaw = resolveReferences(defProps.flexWrap?.value);
  const flexWrapOn = flexWrapRaw === true || flexWrapRaw === 'true';
  const gapVal = resolveReferences(defProps.gap?.value);
  const paddingVal = resolveReferences(defProps.padding?.value);
  const gapStr = gapVal !== undefined && gapVal !== null && gapVal !== '' ? String(gapVal) : '8';
  const paddingStr = paddingVal !== undefined && paddingVal !== null && paddingVal !== '' ? String(paddingVal) : '12';
  const stackBelow = resolveReferences(defProps.stackBelow?.value) ?? 'none';

  return (
    <div className="flex-container-layout-panel" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={ROW_STYLE}>
        <label style={LABEL_STYLE}>Direction</label>
        <IconToggle
          value={direction === 'row' ? 'row' : 'column'}
          onChange={(v) => updateValue('direction', v)}
          options={[
            { value: 'row', icon: MoveHorizontal },
            { value: 'column', icon: MoveVertical },
          ]}
        />
      </div>

      <div style={ROW_STYLE}>
        <label style={LABEL_STYLE}>Distribute</label>
        <IconToggle
          value={justifyToggleValue}
          onChange={(v) => updateValue('justify', v)}
          options={JUSTIFY_ICON_OPTIONS}
        />
      </div>

      <div style={ROW_STYLE}>
        <label style={LABEL_STYLE}>Align</label>
        <IconToggle value={alignToggleValue} onChange={(v) => updateValue('align', v)} options={ALIGN_ICON_OPTIONS} />
      </div>

      <div style={ROW_STYLE}>
        <label style={LABEL_STYLE}>Gap (px)</label>
        <NumberField
          value={gapStr}
          onChange={(raw) => {
            const n = parseInt(raw, 10);
            if (!Number.isNaN(n) && n >= 0) updateValue('gap', String(n));
          }}
        />
      </div>

      <div style={ROW_STYLE}>
        <label style={LABEL_STYLE}>Padding (px)</label>
        <NumberField
          value={paddingStr}
          onChange={(raw) => {
            const n = parseInt(raw, 10);
            if (!Number.isNaN(n) && n >= 0) updateValue('padding', String(n));
          }}
        />
      </div>

      <div style={{ ...ROW_STYLE, justifyContent: 'space-between' }}>
        <label style={LABEL_STYLE} htmlFor="flex-container-allow-wrap">
          Allow wrapping
        </label>
        <ToggleSwitch
          id="flex-container-allow-wrap"
          checked={flexWrapOn}
          onChange={(on) => updateValue('flexWrap', on ? '{{true}}' : '{{false}}')}
        />
      </div>

      <div style={ROW_STYLE}>
        <label style={LABEL_STYLE}>Stack below</label>
        <div style={{ width: '168px' }}>
          <Dropdown
            options={STACK_BELOW_OPTIONS}
            value={stackBelow}
            size="small"
            width="168px"
            onChange={(v) => updateValue('stackBelow', v)}
          />
        </div>
      </div>
    </div>
  );
};
