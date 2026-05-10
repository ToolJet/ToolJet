import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { resolveReferences } from '@/_helpers/utils';
import Dropdown from '@/components/ui/Dropdown/Index';
import { resolveFlexChildSizing } from '@/AppBuilder/Widgets/FlexContainer/flexContainer.utils';

const SIZE_OPTIONS = {
  'fill-parent': { label: 'Fill parent', value: 'fill-parent' },
  fixed: { label: 'Fixed', value: 'fixed' },
};

const STACKED_WIDTH_OPTIONS = {
  'fill-parent': { label: 'Fill parent', value: 'fill-parent' },
  'keep-original': { label: 'Keep original', value: 'keep-original' },
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

  const parentId = allComponents?.[selectedComponentId]?.component?.parent;
  const parentType = parentId ? allComponents?.[parentId]?.component?.component : null;

  if (parentType !== 'FlexContainer') return null;

  const rawDirection = allComponents?.[parentId]?.component?.definition?.properties?.direction?.value ?? 'column';
  const direction = resolveReferences(rawDirection) || 'column';

  const rawStackBelow = allComponents?.[parentId]?.component?.definition?.properties?.stackBelow?.value ?? 'none';
  const stackBelowResolved = resolveReferences(rawStackBelow) || 'none';
  const showStackedWidth = stackBelowResolved && stackBelowResolved !== 'none';

  const layoutData = allComponents?.[selectedComponentId]?.layouts?.[currentLayout] ?? {};

  // Backward-compat: derive new per-axis fields from legacy fillMain/mainSize when needed.
  const fallbackWidthPx = (layoutData.width ?? 10) * 10;
  const fallbackHeightPx = layoutData.height ?? 100;
  const { fillWidth, fillHeight, widthPx, heightPx } = resolveFlexChildSizing(layoutData, direction, {
    widthPx: fallbackWidthPx,
    heightPx: fallbackHeightPx,
  });

  const widthMode = fillWidth ? 'fill-parent' : 'fixed';
  const heightMode = fillHeight ? 'fill-parent' : 'fixed';
  const widthValue = widthPx ?? fallbackWidthPx;
  const heightValue = heightPx ?? fallbackHeightPx;
  const stackedWidthBehavior = layoutData.stackedWidthBehavior ?? 'fill-parent';

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

  const handleHeightModeChange = (value) => {
    if (value === 'fill-parent') {
      update({ fillHeight: true });
    } else {
      update({ fillHeight: false, heightPx: heightValue });
    }
  };

  const handleWidthPxChange = (e) => {
    const parsed = parseInt(e.target.value, 10);
    if (!isNaN(parsed) && parsed > 0) {
      update({ fillWidth: false, widthPx: parsed });
    }
  };

  const handleHeightPxChange = (e) => {
    const parsed = parseInt(e.target.value, 10);
    if (!isNaN(parsed) && parsed > 0) {
      update({ fillHeight: false, heightPx: parsed });
    }
  };

  const handleStackedWidthBehaviorChange = (value) => {
    update({ stackedWidthBehavior: value });
  };

  return (
    <div className="flex-child-layout-panel" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={labelStyle}>Width</label>
        <div style={{ width: '168px' }}>
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
          <input type="number" min={1} value={widthValue} onChange={handleWidthPxChange} style={inputStyle} />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={labelStyle}>Height</label>
        <div style={{ width: '168px' }}>
          <Dropdown
            options={SIZE_OPTIONS}
            value={heightMode}
            size="small"
            width="168px"
            onChange={handleHeightModeChange}
          />
        </div>
      </div>

      {!fillHeight && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={labelStyle}>Height (px)</label>
          <input type="number" min={1} value={heightValue} onChange={handleHeightPxChange} style={inputStyle} />
        </div>
      )}

      {showStackedWidth && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={labelStyle}>When stacked, width</label>
          <div style={{ width: '168px' }}>
            <Dropdown
              options={STACKED_WIDTH_OPTIONS}
              value={stackedWidthBehavior}
              size="small"
              width="168px"
              onChange={handleStackedWidthBehaviorChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};
