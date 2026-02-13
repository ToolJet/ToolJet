import React from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { determineJustifyContentValue } from '@/_helpers/utils';

/**
 * BooleanRenderer - Pure boolean value renderer
 *
 * Renders boolean values either as:
 * - A toggle switch (editable mode)
 * - A checkmark/cross icon (read-only mode)
 *
 * @param {Object} props
 * @param {boolean} props.value - The boolean value to render
 * @param {boolean} props.isEditable - Whether the value can be edited
 * @param {Function} props.onChange - Callback when value changes
 * @param {string} props.toggleOnBg - Custom background color when toggle is ON
 * @param {string} props.toggleOffBg - Custom background color when toggle is OFF
 * @param {string} props.horizontalAlignment - Horizontal alignment ('left' | 'center' | 'right')
 */
export const BooleanRenderer = ({
  value = false,
  isEditable = false,
  onChange,
  toggleOnBg,
  toggleOffBg,
  horizontalAlignment = 'left',
}) => {
  const getCustomBgStyles = (val, onBg, offBg) => {
    if (val && onBg) {
      return { backgroundColor: onBg };
    }
    if (!val && offBg) {
      return { backgroundColor: offBg };
    }
    return {};
  };

  const renderReadOnlyContent = (isTruthyValue) =>
    isTruthyValue ? (
      <SolidIcon name="tick" width="24" fill="var(--grass9)" />
    ) : (
      <SolidIcon name="remove" width="24" fill="var(--tomato9)" />
    );

  const renderEditableContent = () => (
    <label className="boolean-switch">
      <input type="checkbox" disabled={!isEditable} checked={value} onChange={() => onChange?.(!value)} />
      <span className="boolean-slider round" style={getCustomBgStyles(value, toggleOnBg, toggleOffBg)} />
    </label>
  );

  return (
    <div
      className={`h-100 d-flex align-items-center w-100 justify-content-${determineJustifyContentValue(
        horizontalAlignment
      )}`}
      style={{ lineHeight: 1 }}
    >
      {isEditable ? renderEditableContent() : renderReadOnlyContent(value)}
    </div>
  );
};

export default BooleanRenderer;
