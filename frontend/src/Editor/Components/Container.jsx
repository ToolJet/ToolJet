import React from 'react';

export const Container = function Container({
  id, width, height, component, onComponentClick
}) {
  const backgroundColor = component.definition.styles.backgroundColor.value;

  const computedStyles = {
    backgroundColor,
    width,
    height
  };

  return <div className="jet-container" onClick={() => onComponentClick(id, component)} style={computedStyles}></div>;
};
