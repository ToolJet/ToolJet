import React from 'react';
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

  return (
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
  );
};
