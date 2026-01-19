import React, { useState, useEffect } from 'react';
import { components } from 'react-select';
import * as Icons from '@tabler/icons-react';
const { ValueContainer, Placeholder } = components;
import './multiselectV2.scss';

const CustomValueContainer = ({ children, ...props }) => {
  const selectProps = props.selectProps;
  const [valueContainerWidth, setValueContainerWidth] = useState(0);

  const values =
    Array.isArray(selectProps?.value) &&
    selectProps?.value
      ?.filter((option) => option.value !== 'multiselect-custom-menulist-select-all') //Remove the Select all option if selected
      ?.map((option) => option.label);
  const isAllOptionsSelected = selectProps?.value.length === selectProps.options.length;
  // eslint-disable-next-line import/namespace
  const IconElement = Icons[selectProps?.icon] == undefined ? Icons['IconHome2'] : Icons[selectProps?.icon];

  // Need this useEffect to update the width of the value container when the options change or opened in modal
  useEffect(() => {
    // Update width when ref is available or changes
    const updateWidth = () => {
      if (selectProps?.containerRef?.current?.offsetWidth) {
        setValueContainerWidth(selectProps.containerRef.current.offsetWidth);
      }
    };

    updateWidth();

    // Use ResizeObserver to handle dynamic width changes
    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });

    if (selectProps?.containerRef?.current) {
      resizeObserver.observe(selectProps.containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [selectProps?.containerRef, props.hasValue]);

  return (
    <ValueContainer {...props}>
      <div className="w-full">
        <span
          ref={selectProps.containerRef}
          className="d-flex w-full align-items-center"
          style={{ marginBottom: '2px' }}
        >
          {selectProps?.doShowIcon && (
            <IconElement
              style={{
                width: '16px',
                height: '16px',
                color: selectProps?.iconColor,
                marginRight: '4px',
                flexShrink: 0,
              }}
            />
          )}
          {!props.hasValue ? (
            <Placeholder {...props} key="placeholder" {...selectProps} data={selectProps?.visibleValues}>
              {selectProps.placeholder}
            </Placeholder>
          ) : (
            <span className="text-truncate" {...props} id="options" style={{ maxWidth: valueContainerWidth }}>
              {selectProps?.showAllSelectedLabel && isAllOptionsSelected
                ? 'All items are selected.'
                : values.join(', ')}
            </span>
          )}
          {/* Rendering children except Placeholder component to preserve the default behavior of react-select like focus
          handling */}
          {React.Children.map(children, (child) => {
            if (child?.type !== Placeholder) {
              return child;
            }
          })}
        </span>
      </div>
    </ValueContainer>
  );
};

export default CustomValueContainer;
