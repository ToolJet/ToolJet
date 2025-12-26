import React from 'react';
import { components } from 'react-select';

const { ValueContainer } = components;

const TagsInputValueContainer = ({ children, ...props }) => {

  return (
    <ValueContainer {...props}>
      <div
        className="tags-input-values-wrapper"
      >
        {/* Render the MultiValue (chips) and Input components */}
        {React.Children.map(children, (child) => {
          // Keep all children (MultiValue chips and Input)
          return child;
        })}
      </div>
    </ValueContainer>
  );
};

export default TagsInputValueContainer;
