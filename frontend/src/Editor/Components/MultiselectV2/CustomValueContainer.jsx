import React from 'react';
import { components } from 'react-select';
import * as Icons from '@tabler/icons-react';
const { ValueContainer, Placeholder } = components;
import './multiselectV2.scss';

const CustomValueContainer = ({ children, ...props }) => {
  const selectProps = props.selectProps;
  const values = Array.isArray(selectProps?.value) && selectProps?.value?.map((option) => option.label);
  const isAllOptionsSelected = selectProps?.value.length === selectProps.options.length;
  const valueContainerWidth = selectProps?.containerRef?.current?.offsetWidth;
  // eslint-disable-next-line import/namespace
  const IconElement = Icons[selectProps?.icon] == undefined ? Icons['IconHome2'] : Icons[selectProps?.icon];

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
              }}
            />
          )}
          {!props.hasValue ? (
            <Placeholder {...props} key="placeholder" {...selectProps} data={selectProps?.visibleValues}>
              {selectProps.placeholder}
            </Placeholder>
          ) : (
            <span className="text-truncate" {...props} id="options" style={{ maxWidth: valueContainerWidth }}>
              {selectProps?.showAllSelectedLabel && isAllOptionsSelected ? 'All items are selected.' : values.join(', ')}
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
