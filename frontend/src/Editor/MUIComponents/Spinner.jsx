import React from 'react';
import { Box } from '@mui/material';
import { CircularProgress } from '@mui/joy';

export const Spinner = ({ styles, height, dataCy }) => {
  const { colour, size, visibility, boxShadow } = styles;

  const baseStyle = {
    height,
    display: visibility ? '' : 'none',
    boxShadow,
  };
  console.log('colour', colour);

  return (
    <Box
      className="spinner-container"
      style={baseStyle}
    >
      <CircularProgress
        size={size}
        value={70}
        sx={{
          '& .MuiCircularProgress-progress': {
            stroke: colour,
          },
        }}
        role="status"
      />
    </Box>
  );
};
