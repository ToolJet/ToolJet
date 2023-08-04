import React from 'react';
import config from 'config';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';

export const Tags = function Tags({ width, height, properties, styles, dataCy }) {
  const { data } = properties;
  const { visibility, boxShadow } = styles;

  const computedStyles = {
    width,
    height,
    display: visibility ? '' : 'none',
    overflowY: 'auto',
    boxShadow,
  };

  function renderTag(item, index) {
    const tagComputedStyles = {
      backgroundColor: item.color,
      color: item.textColor,
      textTransform: 'none',
    };

    return (
      <span
        className="badge mx-1 mb-1"
        style={tagComputedStyles}
        key={index}
      >
        {item.title}
      </span>
    );
  }

  return (
    <>
      {config.UI_LIB === 'tooljet' && (
        <div
          style={computedStyles}
          data-cy={dataCy}
        >
          {data &&
            data.map((item, index) => {
              return renderTag(item, index);
            })}
        </div>
      )}
      {config.UI_LIB === 'mui' && (
        <Stack
          data-cy={dataCy}
          style={computedStyles}
          direction="row"
          spacing={1}
        >
          {data &&
            data.map((item, index) => {
              return (
                <Chip
                  variant="outlined"
                  key={index}
                  label={item.title}
                  style={{ backgroundColor: item.color, color: item.textColor, textTransform: 'none' }}
                />
              );
            })}
        </Stack>
      )}
    </>
  );
};
