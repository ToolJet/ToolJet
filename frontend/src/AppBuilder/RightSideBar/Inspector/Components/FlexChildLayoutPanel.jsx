import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { resolveReferences } from '@/_helpers/utils';
import Dropdown from '@/components/ui/Dropdown/Index';

const WIDTH_OPTIONS = {
  'fill-parent': { label: 'Fill parent', value: 'fill-parent' },
  fixed: { label: 'Fixed', value: 'fixed' },
};

export const FlexChildLayoutPanel = ({ selectedComponentId, allComponents }) => {
  const currentLayout = useStore((state) => state.currentLayout, shallow);
  const setComponentLayout = useStore((state) => state.setComponentLayout, shallow);

  const parentId = allComponents?.[selectedComponentId]?.component?.parent;
  const parentType = parentId ? allComponents?.[parentId]?.component?.component : null;

  if (parentType !== 'FlexContainer') return null;

  const rawDirection = allComponents?.[parentId]?.component?.definition?.properties?.direction?.value ?? 'column';
  const direction = resolveReferences(rawDirection) || 'column';
  const axisLabel = direction === 'row' ? 'Width' : 'Height';

  const layoutData = allComponents?.[selectedComponentId]?.layouts?.[currentLayout] ?? {};
  const fillMain = layoutData.fillMain ?? false;
  const fallbackSize = direction === 'row' ? (layoutData.width ?? 10) * 10 : layoutData.height ?? 100;
  const mainSize = layoutData.mainSize ?? fallbackSize;

  const selectedWidth = fillMain ? 'fill-parent' : 'fixed';

  const update = (patch) => {
    setComponentLayout({ [selectedComponentId]: patch });
  };

  const handleWidthChange = (value) => {
    if (value === 'fill-parent') {
      update({ fillMain: true });
    } else {
      update({ fillMain: false, mainSize });
    }
  };

  const handleMainSizeChange = (e) => {
    const parsed = parseInt(e.target.value, 10);
    if (!isNaN(parsed) && parsed > 0) {
      update({ fillMain: false, mainSize: parsed });
    }
  };

  const labelStyle = {
    fontSize: '12px',
    color: 'var(--text-default)',
    fontFamily: 'IBM Plex Sans, sans-serif',
    lineHeight: '18px',
    flexShrink: 0,
  };

  return (
    <div className="flex-child-layout-panel" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={labelStyle}>{axisLabel}</label>
        <div style={{ width: '168px' }}>
          <Dropdown
            options={WIDTH_OPTIONS}
            value={selectedWidth}
            size="small"
            width="168px"
            onChange={handleWidthChange}
          />
        </div>
      </div>

      {!fillMain && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={labelStyle}>{axisLabel} (px)</label>
          <input
            type="number"
            min={1}
            value={mainSize}
            onChange={handleMainSizeChange}
            style={{
              width: '168px',
              height: '32px',
              padding: '0 10px',
              fontSize: '12px',
              fontFamily: 'IBM Plex Sans, sans-serif',
              color: 'var(--text-default)',
              background: 'var(--bg-surface-layer-01, white)',
              border: '1px solid var(--border-default, #ccd1d5)',
              borderRadius: '6px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}
    </div>
  );
};
