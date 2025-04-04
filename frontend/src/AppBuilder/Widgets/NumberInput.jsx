import React, { useEffect } from 'react';
import { BaseInput } from './BaseComponents/BaseInput';
import { useInput } from './BaseComponents/hooks/useInput';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const NumberInput = (props) => {
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
    e.stopPropagation();
    props.fireEvent('onBlur');
    inputLogic.setIsFocused(false);
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
      paddingRight: '20px', // Make room for number controls
    };
  };

  const numberControls = !inputLogic.isResizing && (
    <div
      style={{
        position: 'absolute',
        right:
          inputLogic.labelWidth === 0
            ? 0
            : props.styles.alignment === 'side' && props.styles.direction === 'right'
            ? `${inputLogic.labelWidth}px`
            : 0,
        top: 0,
        height: '100%',
        width: '20px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 2,
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
            right: '1px',
            borderLeft:
              inputLogic.disable || inputLogic.loading
                ? '1px solid var(--borders-weak-disabled)'
                : '1px solid var(--borders-default)',
            borderBottom:
              inputLogic.disable || inputLogic.loading
                ? '1px solid var(--borders-weak-disabled)'
                : '.5px solid var(--borders-default)',
            borderTopRightRadius: props.styles.borderRadius - 1,
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
            right: '1px',
            bottom: '1px',
            borderLeft:
              inputLogic.disable || inputLogic.loading
                ? '1px solid var(--borders-weak-disabled)'
                : '1px solid var(--borders-default)',
            borderTop:
              inputLogic.disable || inputLogic.loading
                ? '1px solid var(--borders-weak-disabled)'
                : '.5px solid var(--borders-default)',
            borderBottomRightRadius: props.styles.borderRadius - 1,
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
      props.setExposedVariable('value', null);
    }
  }, [inputLogic.value]);

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
