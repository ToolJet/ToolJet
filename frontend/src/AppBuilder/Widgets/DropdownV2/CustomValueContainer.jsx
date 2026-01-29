import React from 'react';
import { components } from 'react-select';
import TablerIcon from '@/_ui/Icon/TablerIcon';
import './dropdownV2.scss';

const { ValueContainer, SingleValue, Placeholder } = components;

const CustomValueContainer = ({ children, ...props }) => {
  const selectProps = props.selectProps;
  return (
    <ValueContainer {...props}>
      <div className="d-inline-flex">
        {selectProps?.doShowIcon && (
          <div>
            <TablerIcon
              iconName={selectProps?.icon}
              style={{
                width: '16px',
                height: '16px',
                color: selectProps?.iconColor,
                marginRight: '2px',
                marginBottom: '2px',
              }}
            />
          </div>
        )}
        <span className="d-flex" {...props}>
          {React.Children.map(children, (child) => {
            return child ? (
              child
            ) : props.hasValue ? (
              <SingleValue {...props} {...selectProps}>
                {selectProps?.getOptionLabel(props?.getValue()[0])}
              </SingleValue>
            ) : (
              <Placeholder {...props} key="placeholder" {...selectProps} data={props.getValue()}>
                {selectProps.placeholder}
              </Placeholder>
            );
          })}
        </span>
      </div>
    </ValueContainer>
  );
};

export default CustomValueContainer;
