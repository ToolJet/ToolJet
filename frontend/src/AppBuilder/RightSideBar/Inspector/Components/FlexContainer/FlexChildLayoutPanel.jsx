import React, { useEffect, useState } from 'react';
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
  const [widthPxEdit, setWidthPxEdit] = useState(null);

  const parentId = allComponents?.[selectedComponentId]?.component?.parent;
  const parentType = parentId ? allComponents?.[parentId]?.component?.component : null;
  const isFlexChild = parentType === 'FlexContainer';

  const layoutData = isFlexChild ? allComponents?.[selectedComponentId]?.layouts?.[currentLayout] ?? {} : {};

  const containerWidthPx = (parentId && subContainerWidths?.[parentId]) || subContainerWidths?.canvas;
  const gridCellWidthPx = containerWidthPx / NO_OF_GRIDS;
  const fallbackWidthPx = gridCellWidthPx;
  const fillWidth = layoutData.fillWidth ?? true;
  const widthPx = layoutData.widthPx ?? fallbackWidthPx;

  const widthMode = fillWidth ? 'fill-parent' : 'fixed';
  const widthValue = widthPx ?? fallbackWidthPx;

  useEffect(() => {
    setWidthPxEdit(null);
  }, [selectedComponentId, fillWidth]);

  if (!isFlexChild) return null;

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
    // Local edit only — commit on blur so partial values (e.g. "5" while clearing "50") are not saved.
    setWidthPxEdit(e.target.value);
  };

  const handleWidthPxBlur = () => {
    if (widthPxEdit === null) return;

    if (widthPxEdit === '') {
      setWidthPxEdit(null);
      return;
    }

    const parsed = parseInt(widthPxEdit, 10);
    if (isNaN(parsed)) {
      setWidthPxEdit(null);
      return;
    }

    update({ fillWidth: false, widthPx: parsed });
    setWidthPxEdit(null);
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
            value={widthPxEdit !== null ? widthPxEdit : String(widthValue)}
            onChange={handleWidthPxChange}
            onBlur={handleWidthPxBlur}
            style={inputStyle}
          />
        </div>
      )}
    </div>
  );
};
