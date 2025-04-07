import React from 'react';

export const Tags = function Tags({ width, height, properties, styles, dataCy }) {
  const { data } = properties;
  const { visibility, boxShadow, alignment } = styles;

  const computedStyles = {
    width,
    height,
    display: visibility ? 'flex' : 'none',
    overflowY: 'auto',
    boxShadow,
    justifyContent: alignment,
  };

  function renderTag(item, index) {
    const tagComputedStyles = {
      backgroundColor: item.color,
      color: item.textColor,
      textTransform: 'none',
    };

    return (
      <span className="badge mx-1 mb-1" style={tagComputedStyles} key={index}>
        {item.title}
      </span>
    );
  }

  return (
    <div style={computedStyles} data-cy={dataCy}>
      {data &&
        Array.isArray(data) &&
        data.map((item, index) => {
          return renderTag(item, index);
        })}
    </div>
  );
};
