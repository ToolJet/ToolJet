import '@/_styles/widgets/star-rating.scss';
import React from 'react';

import { Box, Rating, Tooltip, Typography } from '@mui/material';

export const StarRating = function StarRating({ properties, styles, fireEvent, setExposedVariable, darkMode, dataCy }) {
  const label = properties.label;
  const defaultSelected = properties.defaultSelected ?? 5;
  const maxRating = properties.maxRating ?? 5;
  const allowHalfStar = properties.allowHalfStar ?? false;
  const tooltips = properties.tooltips;

  const { visibility, disabledState, textColor, labelColor, boxShadow } = styles;
  const labelColorStyle = labelColor === '#333' ? (darkMode ? '#fff' : '#333') : labelColor;

  // -1 cos code is considering index from 0,1,2.....
  const [currentRatingIndex, setRatingIndex] = React.useState(defaultSelected - 1);
  const [hoverIndex, setHoverIndex] = React.useState(null);

  React.useEffect(() => {
    setRatingIndex(defaultSelected - 1);
    setExposedVariable('value', defaultSelected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultSelected]);

  React.useEffect(() => {
    setTimeout(() => {
      setExposedVariable('value', defaultSelected);
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getTooltip = (index) => {
    if (tooltips && Array.isArray(tooltips) && tooltips.length > 0) return tooltips[index];
    return '';
  };

  return (
    <Box
      style={{ display: visibility ? '' : 'none', boxShadow }}
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Typography sx={{ color: labelColorStyle }}>{label}</Typography>
      <Tooltip
        arrow
        title={getTooltip(hoverIndex)}
      >
        <Rating
          name="simple-controlled"
          disabled={disabledState}
          max={parseInt(maxRating)}
          defaultValue={defaultSelected}
          value={currentRatingIndex}
          sx={{ color: textColor }}
          precision={allowHalfStar === true ? 0.5 : 1}
          onChange={(event, currentRatingIndex) => {
            setRatingIndex(currentRatingIndex);
          }}
          onChangeActive={(event, hoverIndex) => {
            setHoverIndex([hoverIndex - 1]);
          }}
        />
      </Tooltip>
    </Box>
  );
};
