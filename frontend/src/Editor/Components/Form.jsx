import React, { useRef, useState, useEffect } from 'react';
import { SubCustomDragLayer } from '../SubCustomDragLayer';
import { SubContainer } from '../SubContainer';

export const Form = function Form(props) {
  console.log('props--- ', props);
  const { id, component, width, height, containerProps, removeComponent, styles, setExposedVariable, darkMode } = props;
  const { visibility, disabledState, borderRadius, borderColor } = styles;
  const backgroundColor =
    ['#fff', '#ffffffff'].includes(styles.backgroundColor) && darkMode ? '#232E3C' : styles.backgroundColor;
  const computedStyles = {
    backgroundColor,
    borderRadius: borderRadius ? parseFloat(borderRadius) : 0,
    border: `1px solid ${borderColor}`,
    height,
    display: visibility ? 'flex' : 'none',
  };

  const parentRef = useRef(null);

  const [childrenData, setChildrenData] = useState({});

  useEffect(() => {
    setExposedVariable('data', {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setExposedVariable('data', childrenData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childrenData]);

  const handleSubmit = (event) => {
    alert('A name was submitted: ');
    console.log('submit--- ', event.target);
    event.preventDefault();
  };

  return (
    <form
      data-disabled={disabledState}
      className="jet-container"
      id={id}
      ref={parentRef}
      style={computedStyles}
      onSubmit={handleSubmit}
      onClick={(e) => {
        if (e.target.className === 'real-canvas') containerProps.onComponentClick(id, component);
      }} //Hack, should find a better solution - to prevent losing z index when container element is clicked
    >
      <SubContainer
        parentComponent={component}
        containerCanvasWidth={width}
        parent={id}
        {...containerProps}
        parentRef={parentRef}
        removeComponent={removeComponent}
        onOptionChange={function ({ component, optionName, value }) {
          setChildrenData((prevData) => {
            console.log('component form--- ', component);
            console.log('optionName form--- ', optionName);
            console.log('value form--- ', value);
            // const changedData = { [component.name]: { [optionName]: value } };
            // const existingDataAtIndex = prevData[index] ?? {};
            // const newDataAtIndex = {
            //   ...prevData[index],
            //   [component.name]: { ...existingDataAtIndex[component.name], ...changedData[component.name] },
            // };
            // const newChildrenData = { ...prevData, [index]: newDataAtIndex };
            // return { ...prevData, ...newChildrenData };
          });
        }}
      />
      <SubCustomDragLayer
        containerCanvasWidth={width}
        parent={id}
        parentRef={parentRef}
        currentLayout={containerProps.currentLayout}
      />
    </form>
  );
};
