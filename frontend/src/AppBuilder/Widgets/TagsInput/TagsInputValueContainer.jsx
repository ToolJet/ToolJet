import React from 'react';
import { components } from 'react-select';

const { ValueContainer } = components;

const TagsInputValueContainer = ({ children, ...props }) => {
  const childArray = React.Children.toArray(children);
  // Inside the chip row the placeholder becomes a flex sibling and pushes the caret past its text.
  const isPlaceholder = (child) => child?.type === components.Placeholder;

  return (
    <ValueContainer {...props}>
      {childArray.filter(isPlaceholder)}
      <div className="tags-input-values-wrapper">{childArray.filter((child) => !isPlaceholder(child))}</div>
    </ValueContainer>
  );
};

export default TagsInputValueContainer;
