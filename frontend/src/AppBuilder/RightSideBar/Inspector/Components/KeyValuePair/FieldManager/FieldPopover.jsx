import React, { useState, useEffect, useRef } from 'react';
import Popover from 'react-bootstrap/Popover';
import { PropertiesTabElements } from './PropertiesTabElements';

//TO-DO --> Update it to use resuable table component
export const FieldPopoverContent = ({
  field,
  index,
  darkMode,
  currentState,
  onFieldItemChange,
  getPopoverFieldSource,
  setFieldPopoverRootCloseBlocker,
  component,
  props,
  fieldEventChanged,
}) => {
  const [isGoingBelowScreen, setIsGoingBelowScreen] = useState(false);
  const popoverRef = useRef(null);

  // Check popover position to handle scrollbar visibility
  useEffect(() => {
    const checkPopoverPosition = () => {
      if (popoverRef.current) {
        const popoverRect = popoverRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const isBelowScreen = popoverRect.bottom > viewportHeight;
        setIsGoingBelowScreen(isBelowScreen);
      }
    };

    const timeoutId = setTimeout(checkPopoverPosition, 100);
    window.addEventListener('resize', checkPopoverPosition);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkPopoverPosition);
    };
  }, [index]);

  return (
    <>
      <Popover.Body
        ref={popoverRef}
        className={`table-column-popover ${darkMode && 'theme-dark'} ${isGoingBelowScreen ? 'show-scrollbar' : ''}`}
      >
        <PropertiesTabElements
          field={field}
          index={index}
          darkMode={darkMode}
          currentState={currentState}
          onFieldItemChange={onFieldItemChange}
          getPopoverFieldSource={getPopoverFieldSource}
          setFieldPopoverRootCloseBlocker={setFieldPopoverRootCloseBlocker}
          component={component}
          props={props}
          fieldEventChanged={fieldEventChanged}
        />
      </Popover.Body>
    </>
  );
};
