import React from 'react';
import { components } from 'react-select';

const { ValueContainer, Placeholder } = components;

const EditableTagsValueContainer = ({ children, ...props }) => {
  const { selectProps, hasValue } = props;

  return (
    <ValueContainer {...props}>
      <div
        className="editable-tags-values-wrapper"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          alignItems: 'center',
          width: '100%',
        }}
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

export default EditableTagsValueContainer;
