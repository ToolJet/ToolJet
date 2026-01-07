import React, { useState, useEffect } from 'react';
import { components } from 'react-select';
import { loadIcon } from '@/_helpers/iconLoader';
import './dropdownV2.scss';

const { ValueContainer, SingleValue, Placeholder } = components;

const CustomValueContainer = ({ children, ...props }) => {
  const selectProps = props.selectProps;

  // Load icon dynamically
  const [IconElement, setIconElement] = useState(null);

  useEffect(() => {
    const iconName = selectProps?.icon;
    if (!iconName) {
      setIconElement(null);
      return;
    }

    loadIcon(iconName)
      .then((component) => setIconElement(() => component))
      .catch(() => setIconElement(null));
  }, [selectProps?.icon]);

  return (
    <ValueContainer {...props}>
      <div className="d-inline-flex">
        {selectProps?.doShowIcon && IconElement && (
          <div>
            <IconElement
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
