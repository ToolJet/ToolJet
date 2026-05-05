import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

const CROSS_ALIGN_OPTIONS = [
  { label: 'auto', value: '' },
  { label: 'flex-start', value: 'flex-start' },
  { label: 'center', value: 'center' },
  { label: 'flex-end', value: 'flex-end' },
  { label: 'stretch', value: 'stretch' },
];

export const FlexChildLayoutPanel = ({ selectedComponentId, allComponents }) => {
  const currentLayout = useStore((state) => state.currentLayout, shallow);
  const setComponentLayout = useStore((state) => state.setComponentLayout, shallow);

  const parentId = allComponents?.[selectedComponentId]?.component?.parent;
  const parentType = parentId ? allComponents?.[parentId]?.component?.component : null;

  if (parentType !== 'FlexContainer') return null;

  const layoutData = allComponents?.[selectedComponentId]?.layouts?.[currentLayout] ?? {};
  const fillMain = layoutData.fillMain ?? false;
  const crossAlignSelf = layoutData.crossAlignSelf ?? '';

  const update = (patch) => {
    setComponentLayout({ [selectedComponentId]: patch });
  };

  return (
    <div
      className="flex-child-layout-panel"
      style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-default)' }}
    >
      <div
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        Flex Layout
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <label style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Fill available space</label>
        <input type="checkbox" checked={fillMain} onChange={(e) => update({ fillMain: e.target.checked })} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Align self</label>
        <select
          value={crossAlignSelf}
          onChange={(e) => update({ crossAlignSelf: e.target.value })}
          style={{
            fontSize: '12px',
            padding: '2px 4px',
            background: 'var(--base)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: 4,
          }}
        >
          {CROSS_ALIGN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
