import React from 'react';

export const Tags = function Tags({ height, properties, styles }) {
  const { data } = properties;
  const { textColor, visibility } = styles;

  const computedStyles = {
    width: '100%',
    height,
    display: visibility ? '' : 'none',
  };

  function renderTag(item, index) {
    const tagComputedStyles = {
      backgroundColor: item.color,
      color: textColor,
    };

    return (
      <span className="col-auto badge p-2 mx-1 tag" style={tagComputedStyles} key={index}>
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
