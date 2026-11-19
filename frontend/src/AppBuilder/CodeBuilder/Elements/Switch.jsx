import ToggleGroup from '@/ToolJetUI/SwitchGroup/ToggleGroup';
import ToggleGroupItem from '@/ToolJetUI/SwitchGroup/ToggleGroupItem';
import React, { useLayoutEffect, useRef, useState } from 'react';
import './Switch.scss';
import cx from 'classnames';

const Switch = ({ value, onChange, meta, paramName, component, onLayoutChange }) => {
  const options = meta?.options || [];
  const rootRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const optionSignature = JSON.stringify(options.map((option) => option.displayName));
  useLayoutEffect(() => {
    const root = rootRef.current;
    const wrapper = root.closest('.wrapper-div-code-editor');
    const measure = () => {
      const labels = Array.from(root.querySelectorAll('[data-segment-measure]'));
      const widest = meta.isIcon ? 12 : Math.max(0, ...labels.map((label) => label.scrollWidth));
      // Equal cells must fit the widest label, including the SAME padding in both states.
      const available = Math.min(142, wrapper?.clientWidth || 142);
      const needsRow = (widest + 16) * options.length > available;
      setExpanded(needsRow);
      onLayoutChange?.(needsRow);
    };
    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(wrapper || root);
    let active = true;
    document.fonts?.ready.then(() => {
      if (active) measure();
    });
    return () => {
      active = false;
      observer?.disconnect();
    };
  }, [optionSignature, options.length, meta.isIcon, onLayoutChange]);
  const fullWidth = meta?.fullWidth || expanded;
  const defaultValue =
    paramName == 'defaultValue' && (component == 'Checkbox' || component == 'ToggleSwitchV2') ? `{{${value}}}` : value;
  return (
    <div ref={rootRef} className={cx('inspector-segmented-control', { 'inspector-segmented-control-full': fullWidth })}>
      <ToggleGroup onValueChange={onChange} defaultValue={defaultValue} className="inspector-segmented-options">
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            isIcon={meta.isIcon}
            lucideIconName={option?.lucideIconName}
          >
            {meta.isIcon ? (
              option?.lucideIconName ? (
                ''
              ) : (
                (option?.iconName ?? '')
              )
            ) : (
              <span data-segment-measure title={option.displayName}>
                {option.displayName}
              </span>
            )}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};

export default Switch;
