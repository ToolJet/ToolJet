import React, { forwardRef } from 'react';

export const CustomInputComponent = forwardRef(
  ({ value, onClick, styles = {}, setShowValidationError, setIsFocused, fireEvent, isItComponent = false }, ref) => {
    return (
      <input
        onBlur={(e) => {
          if (isItComponent) {
            setShowValidationError(true);
            setIsFocused(false);
            e.stopPropagation();
            fireEvent('onBlur');
            setIsFocused(false);
          }
        }}
        onFocus={(e) => {
          if (isItComponent) {
            setIsFocused(true);
            e.stopPropagation();
            fireEvent('onFocus');
          }
        }}
        className="custom-input-datepicker"
        value={value || '25/01/2024'}
        onClick={onClick}
        ref={ref}
        style={styles}
      ></input>
    );
  }
);
