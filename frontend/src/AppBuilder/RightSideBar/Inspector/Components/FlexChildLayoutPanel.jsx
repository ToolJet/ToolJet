import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import Dropdown from '@/components/ui/Dropdown/Index';
import { useGridStore } from '@/_stores/gridStore';
import { NO_OF_GRIDS } from '@/AppBuilder/AppCanvas/appCanvasConstants';

const SIZE_OPTIONS = {
  'fill-parent': { label: 'Fill parent', value: 'fill-parent' },
  fixed: { label: 'Fixed', value: 'fixed' },
};

const labelStyle = {
  fontSize: '12px',
  color: 'var(--text-default)',
  fontFamily: 'IBM Plex Sans, sans-serif',
  lineHeight: '18px',
  flexShrink: 0,
};

const inputStyle = {
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
};

export const FlexChildLayoutPanel = ({ selectedComponentId, allComponents }) => {
  const currentLayout = useStore((state) => state.currentLayout, shallow);
  const setComponentLayout = useStore((state) => state.setComponentLayout, shallow);
  const { subContainerWidths } = useGridStore((state) => ({ subContainerWidths: state.subContainerWidths }), shallow);

  const parentId = allComponents?.[selectedComponentId]?.component?.parent;
  const parentType = parentId ? allComponents?.[parentId]?.component?.component : null;

  if (parentType !== 'FlexContainer') return null;

  const layoutData = allComponents?.[selectedComponentId]?.layouts?.[currentLayout] ?? {};

  const containerWidthPx = (parentId && subContainerWidths?.[parentId]) || subContainerWidths?.canvas;
  const gridCellWidthPx = containerWidthPx / NO_OF_GRIDS;
  const fallbackWidthPx = gridCellWidthPx;
  const fillWidth = layoutData.fillWidth ?? true;
  const widthPx = layoutData.widthPx ?? fallbackWidthPx;

  const widthMode = fillWidth ? 'fill-parent' : 'fixed';
  const widthValue = widthPx ?? fallbackWidthPx;

  const update = (patch) => {
    setComponentLayout({ [selectedComponentId]: patch });
  };

  const handleWidthModeChange = (value) => {
    if (value === 'fill-parent') {
      update({ fillWidth: true });
    } else {
      update({ fillWidth: false, widthPx: widthValue });
    }
  };

  const handleWidthPxChange = (e) => {
    const parsed = parseInt(e.target.value, 10);
    if (!isNaN(parsed) && parsed > 0) {
      update({ fillWidth: false, widthPx: parsed });
    }
  };

  return (
    <div
      className="flex-child-layout-panel"
      data-cy="flex-child-layout-panel"
      style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={labelStyle}>Width</label>
        <div data-cy="flex-child-width-mode" style={{ width: '168px' }}>
          <Dropdown
            options={SIZE_OPTIONS}
            value={widthMode}
            size="small"
            width="168px"
            onChange={handleWidthModeChange}
          />
        </div>
      </div>

      {!fillWidth && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={labelStyle}>Width (px)</label>
          <input
            data-cy="flex-child-width-px"
            type="number"
            min={1}
            value={widthValue}
            onChange={handleWidthPxChange}
            style={inputStyle}
          />
        </div>
      )}
    </div>
  );
};
