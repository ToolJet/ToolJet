import React from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';

/**
 * Checkbox component for the TreeSelect widget.
 *
 * Renders an HTML <input type="checkbox"> with icon overlays for checked and
 * indeterminate states. Supports full color customization via props.
 *
 * Note: react-checkbox-tree hides all inputs via
 *   `.react-checkbox-tree:not(.rct-native-display) input { display: none }`
 * The input's inline `display: block` overrides this so the checkbox stays visible.
 *
 * @param {boolean}  checked           - Controlled checked state
 * @param {boolean}  [indeterminate]   - Indeterminate / half-checked state
 * @param {string}   [checkboxColor]   - Background color when checked / indeterminate
 * @param {string}   [uncheckedColor]  - Background color when unchecked
 * @param {string}   [borderColor]     - Border color when unchecked
 * @param {string}   [handleColor]     - Icon fill color
 * @param {string}   [className]
 */
const TreeSelectCheckbox = ({
  checked = false,
  indeterminate = false,
  checkboxColor,
  uncheckedColor,
  borderColor,
  handleColor,
  className = '',
}) => {
  const isActive = checked || indeterminate;

  return (
    <div className={`d-flex flex-column align-items-center${className ? ` ${className}` : ''}`}>
      {/* Fixed 18×18 container: input and icons are absolutely positioned within it */}
      <div style={{ position: 'relative', width: '18px', height: '18px', flexShrink: 0 }}>
        <input
          type="checkbox"
          checked={checked}
          readOnly
          data-cy="checkbox-input"
          style={{
            // display:block overrides react-checkbox-tree's rule:
            // .react-checkbox-tree:not(.rct-native-display) input { display: none }
            display: 'block',
            position: 'absolute',
            top: 0,
            left: 0,
            appearance: 'none',
            WebkitAppearance: 'none',
            width: '18px',
            height: '18px',
            borderRadius: '6px',
            border: `1px solid ${isActive ? 'transparent' : borderColor || 'var(--cc-default-border)'}`,
            backgroundColor: isActive
              ? checkboxColor || 'var(--cc-primary-brand)'
              : uncheckedColor || 'var(--cc-surface2-surface)',
            pointerEvents: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease, border-color 0.15s ease',
          }}
        />
        {/* Tick icon — visible only when fully checked (not indeterminate) */}
        <SolidIcon
          name="tickv3"
          width="14px"
          fill={handleColor || 'var(--icon-inverse)'}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: checked && !indeterminate ? 1 : 0,
            pointerEvents: 'none',
          }}
        />
        {/* Minus icon — visible only when indeterminate (half-checked) */}
        <SolidIcon
          name="minus"
          width="14x"
          fill={handleColor || 'var(--icon-inverse)'}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: indeterminate ? 1 : 0,
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
};

export default TreeSelectCheckbox;
