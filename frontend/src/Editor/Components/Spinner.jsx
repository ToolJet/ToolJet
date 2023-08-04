import React from 'react';
import config from 'config';
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
    <>
      {config.UI_LIB === 'tooljet' && (
        <div
          className="spinner-container"
          style={baseStyle}
          data-cy={dataCy}
        >
          <div
            className={`spinner-border spinner-border-${size}`}
            role="status"
            style={{ color: colour }}
          ></div>
        </div>
      )}
      {config.UI_LIB === 'mui' && (
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
      )}
    </>
  );
};
