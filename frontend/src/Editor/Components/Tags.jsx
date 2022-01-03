import React from 'react';

export const Tags = function Tags({ height, properties, styles }) {
  const { data } = properties;
  const { textColor, visibility } = styles;

  const computedStyles = {
    width: '100%',
    height,
    display: visibility ? '' : 'none',
    color: textColor,
    overflowY: 'auto',
  };

  function renderTag(item, index) {
    const tagComputedStyles = {
      backgroundColor: item.color,
      color: item.textColor,
      textTransform: 'none',
      height,
    };

    return (
      <span className="badge mx-1 mb-1" style={tagComputedStyles} key={index}>
        {item.title}
      </span>
    );
  }

  return (
    <div style={computedStyles}>
      {data &&
        data.map((item, index) => {
          return renderTag(item, index);
        })}
    </div>
  );
};
