import '@/_styles/widgets/star-rating.scss';

import React from 'react';
import { useTrail } from 'react-spring';

import Star from './star';

export const StarRating = function StarRating({ properties, styles, fireEvent, setExposedVariable, darkMode, dataCy }) {
  const label = properties.label;
  const defaultSelected = properties.defaultSelected ?? 5;
  const maxRating = properties.maxRating ?? 5;
  const allowHalfStar = properties.allowHalfStar ?? false;
  const tooltips = properties.tooltips;

  const { visibility, disabledState, textColor, labelColor } = styles;
  const color = textColor ?? '#ffb400';
  const labelColorStyle = labelColor === '#333' ? (darkMode ? '#fff' : '#333') : labelColor;

  const animatedStars = useTrail(maxRating, {
    config: {
      friction: 22,
      tension: 500,
    },
    from: {
      opacity: 0,
      transform: 'scale(0.8)',
    },
    opacity: 1,
    transform: 'scale(1)',
  });

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

  function handleClick(idx) {
    // +1 cos code is considering index from 0,1,2.....
    setExposedVariable('value', idx + 1);
    fireEvent('onChange');
  }

  const getActive = (index) => {
    if (hoverIndex !== null) return index <= hoverIndex;
    return index <= currentRatingIndex;
  };

  const isHalfStar = (index) => {
    if (hoverIndex !== null) return false;
    return index - 0.5 === currentRatingIndex;
  };

  const getTooltip = (index) => {
    if (tooltips && Array.isArray(tooltips) && tooltips.length > 0) return tooltips[index];
    return '';
  };

  return (
    <div
      data-disabled={disabledState}
      className="star-rating"
      style={{ display: visibility ? '' : 'none' }}
      data-cy={dataCy}
    >
      <span className="label form-check-label col-auto" style={{ color: labelColorStyle }}>
        {label}
      </span>
      <div className="col px-1 py-0 mt-0">
        {animatedStars.map((props, index) => (
          <Star
            tooltip={getTooltip(index)}
            active={getActive(index)}
            isHalfStar={isHalfStar(index)}
            maxRating={maxRating}
            onClick={(e, idx) => {
              e.stopPropagation();
              setRatingIndex(idx);
              handleClick(idx);
            }}
            allowHalfStar={allowHalfStar}
            key={index}
            index={index}
            color={color}
            style={{ ...props }}
            setHoverIndex={setHoverIndex}
          />
        ))}
      </div>
    </div>
  );
};
