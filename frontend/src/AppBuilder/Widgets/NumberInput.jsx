import React, { useEffect } from 'react';
import { BaseInput } from './BaseComponents/BaseInput';
import { useInput } from './BaseComponents/hooks/useInput';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const NumberInput = (props) => {
  const { rtl } = props.properties;
  const { setExposedVariable } = props;

  const inputLogic = useInput({
    ...props,
    properties: {
      ...props.properties,
      value: Number(parseFloat(props.properties.value).toFixed(props.properties.decimalPlaces)),
    },
  });

  const handleChange = (e) => {
    if (e.target.value === '') {
      inputLogic.setInputValue(null);
      props.fireEvent('onChange');
    } else {
      const newValue = Number(parseFloat(e.target.value));
      inputLogic.setInputValue(newValue);
      if (!isNaN(newValue)) {
        props.fireEvent('onChange');
      }
    }
  };

  const handleBlur = (e) => {
    const value = Number(parseFloat(e.target.value).toFixed(props.properties.decimalPlaces));
    inputLogic.setInputValue(value);
    inputLogic.handleBlur(e);
  };

  const handleIncrement = (e) => {
    e.preventDefault();
    const newValue = (inputLogic.value || 0) + 1;
    inputLogic.setInputValue(newValue);
    if (!isNaN(newValue)) {
      props.fireEvent('onChange');
    }
  };

  const handleDecrement = (e) => {
    e.preventDefault();
    const newValue = (inputLogic.value || 0) - 1;
    inputLogic.setInputValue(newValue);
    if (!isNaN(newValue)) {
      props.fireEvent('onChange');
    }
  };

  // Override the base input styles to account for number controls
  const getCustomStyles = (baseStyles) => {
    return {
      ...baseStyles,
      paddingRight: rtl ? '8px' : '20px', // Make room for number controls
      paddingLeft: rtl ? '20px' : baseStyles.paddingLeft || '8px',
    };
  };

  const numberControls = !inputLogic.isResizing && (
    <div
      style={{
        position: 'absolute',
        right: rtl ? 'auto' : 0,
        left: rtl ? '2px' : 'auto',
        top: 0,
        height: '100%',
        width: '20px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 2,
        // Ensure controls stay within input bounds when label is present
        transform:
          rtl && props.styles.alignment === 'side' && props.styles.direction === 'left' && inputLogic.labelWidth > 0
            ? `translateX(${inputLogic.labelWidth}px)`
            : !rtl &&
              props.styles.alignment === 'side' &&
              props.styles.direction === 'right' &&
              inputLogic.labelWidth > 0
            ? `translateX(-${inputLogic.labelWidth}px)`
            : 'none',
      }}
    >
      <div
        onClick={handleIncrement}
        style={{
          height: '50%',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <SolidIcon
          width={props.styles.padding === 'default' ? `${props.height / 2 - 1}px` : `${props.height / 2 + 1}px`}
          height={props.styles.padding === 'default' ? `${props.height / 2 - 1}px` : `${props.height / 2 + 1}px`}
          fill={'var(--icons-default)'}
          style={{
            position: 'absolute',
            top:
              props.styles.alignment === 'top' && props.properties.label?.length > 0 && props.styles.width > 0
                ? '21px'
                : '1px',
            right: rtl ? 'auto' : '1px',
            left: rtl ? '1px' : 'auto',
            borderLeft: rtl ? 'none' : '1px solid var(--cc-default-border)',
            borderRight: rtl ? '1px solid var(--cc-default-border)' : 'none',
            borderBottom: '.5px solid var(--cc-default-border)',
            borderTopRightRadius: rtl ? 0 : props.styles.borderRadius - 1,
            borderTopLeftRadius: rtl ? props.styles.borderRadius - 1 : 0,
            backgroundColor: 'transparent',
          }}
          className="numberinput-up-arrow arrow number-input-arrow"
          name="TriangleDownCenter"
        />
      </div>
      <div
        onClick={handleDecrement}
        style={{
          height: '50%',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <SolidIcon
          fill={'var(--icons-default)'}
          style={{
            position: 'absolute',
            right: rtl ? 'auto' : '1px',
            left: rtl ? '1px' : 'auto',
            bottom: '1px',
            borderLeft: rtl ? 'none' : '1px solid var(--cc-default-border)',
            borderRight: rtl ? '1px solid var(--cc-default-border)' : 'none',
            borderTop: '.5px solid var(--cc-default-border)',
            borderBottomRightRadius: rtl ? 0 : props.styles.borderRadius - 1,
            borderBottomLeftRadius: rtl ? props.styles.borderRadius - 1 : 0,
            backgroundColor: 'transparent',
          }}
          width={props.styles.padding === 'default' ? `${props.height / 2 - 1}px` : `${props.height / 2 + 1}px`}
          height={props.styles.padding === 'default' ? `${props.height / 2 - 1}px` : `${props.height / 2 + 1}px`}
          className="numberinput-down-arrow arrow number-input-arrow"
          name="TriangleUpCenter"
        />
      </div>
    </div>
  );

  useEffect(() => {
    if (isNaN(inputLogic.value) || inputLogic.value === '') {
      setExposedVariable('value', null);
    }
  }, [inputLogic.value, setExposedVariable]);

  return (
    <BaseInput
      {...props}
      {...inputLogic}
      inputType="number"
      handleChange={handleChange}
      handleBlur={handleBlur}
      additionalInputProps={{
        min: props.validation?.minValue ?? null,
        max: props.validation?.maxValue ?? null,
      }}
      rightIcon={numberControls}
      getCustomStyles={getCustomStyles}
    />
  );
};
