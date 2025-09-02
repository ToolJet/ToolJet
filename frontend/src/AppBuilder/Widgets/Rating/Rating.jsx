import '@/_styles/widgets/star-rating.scss';
import React from 'react';
import { useTrail } from 'react-spring';
import Label from '@/_ui/Label';
import RatingIcon from './RatingIcon';
import {
  getLabelWidthOfInput,
  getWidthTypeOfComponentStyles,
} from '@/AppBuilder/Widgets/BaseComponents/hooks/useInput';
import classNames from 'classnames';
import Loader from '@/ToolJetUI/Loader/Loader';
import { useExposeState } from '@/AppBuilder/_hooks/useExposeVariables';

export const checkIfStarRatingLabelTypeIsDeprecated = (value) => {
  return value === 'legacy';
};

export const Rating = ({
  properties,
  styles,
  fireEvent,
  setExposedVariable,
  setExposedVariables,
  darkMode,
  dataCy,
}) => {
  const {
    iconType = 'stars',
    label,
    defaultSelected = 5,
    maxRating = 5,
    allowHalfStar = false,
    tooltips = [],
    allowEditing = true,
    loadingState = false,
    visibility = true,
    disabledState,
  } = properties;

  const {
    labelStyle,
    textColor: selectedBgColorStars,
    boxShadow,
    alignment,
    direction,
    auto,
    labelWidth,
    widthType,
    color: labelTextColor,
    selectedBackgroundHearts,
    unselectedBackground,
  } = styles;

  const { isDisabled, isVisible, isLoading } = useExposeState(
    loadingState,
    visibility,
    disabledState,
    setExposedVariables,
    setExposedVariable
  );

  const labelColorStyle = labelTextColor === '#333' ? (darkMode ? '#fff' : '#333') : labelTextColor;
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
  const labelRef = React.useRef(null);

  const defaultAlignment = alignment === 'side' || alignment === 'top' ? alignment : 'side';

  const _width = getLabelWidthOfInput(widthType, labelWidth); // Max width which label can go is 70% for better UX calculate width based on this value

  React.useEffect(() => {
    setRatingIndex(defaultSelected - 1);
    setExposedVariable('value', defaultSelected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultSelected]);

  function handleClick(idx) {
    // +1 cos code is considering index from 0,1,2.....
    setExposedVariable('value', idx + 1);
    fireEvent('onChange');
  }

  const getActive = (index) => {
    if (hoverIndex !== null) return index <= hoverIndex;
    return index <= currentRatingIndex;
  };

  const isHalfIcon = (index) => {
    if (hoverIndex !== null) return false;
    return index - 0.5 === currentRatingIndex;
  };

  const getTooltip = (index) => {
    if (tooltips && Array.isArray(tooltips) && tooltips.length > 0) return tooltips[index];
    return '';
  };

  const _renderRatingWidget = () => {
    return (
      <>
        {animatedStars.map((props, index) => (
          <RatingIcon
            tooltip={getTooltip(index)}
            active={getActive(index)}
            isHalfIcon={isHalfIcon(index)}
            maxRating={maxRating}
            onClick={(e, idx) => {
              e.stopPropagation();
              setRatingIndex(idx);
              handleClick(idx);
            }}
            allowHalfStar={allowHalfStar}
            key={index}
            index={index}
            color={iconType === 'stars' ? selectedBgColorStars : selectedBackgroundHearts}
            style={{ ...props }}
            setHoverIndex={setHoverIndex}
            unselectedBackground={unselectedBackground}
            iconType={iconType}
            allowEditing={allowEditing}
          />
        ))}
      </>
    );
  };

  if (labelStyle === 'legacy') {
    return (
      <div
        data-disabled={isDisabled}
        className="star-rating"
        style={{ display: isVisible ? '' : 'none', boxShadow }}
        data-cy={dataCy}
      >
        <span className={label && `label form-check-label col-auto`} style={{ color: labelColorStyle }}>
          {label}
        </span>
        <div className="col px-1 py-0 mt-0">
          {loadingState ? (
            <Loader style={{ right: '50%', zIndex: 3, position: 'absolute' }} width="20" />
          ) : (
            _renderRatingWidget()
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      data-disabled={isDisabled}
      className={classNames('star-rating-container d-flex', {
        'flex-column':
          defaultAlignment === 'top' &&
          ((labelWidth != 0 && label?.length != 0) || (auto && labelWidth == 0 && label && label?.length != 0)),
        'align-items-center': defaultAlignment !== 'top',
        'flex-row-reverse': direction === 'right' && defaultAlignment === 'side',
        'text-right': direction === 'right' && defaultAlignment === 'top',
        invisible: !isVisible,
      })}
      style={{
        boxShadow,
        position: 'relative',
      }}
      data-cy={dataCy}
    >
      <Label
        label={label}
        width={labelWidth}
        labelRef={labelRef}
        color={labelColorStyle}
        defaultAlignment={defaultAlignment}
        direction={direction}
        auto={auto}
        isMandatory={false}
        _width={_width}
        widthType={widthType}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: defaultAlignment === 'top' && direction === 'right' ? 'flex-end' : 'flex-start',
          ...getWidthTypeOfComponentStyles(widthType, labelWidth, auto, alignment),
        }}
      >
        {isLoading ? (
          <Loader style={{ right: '50%', zIndex: 3, position: 'absolute', top: 0 }} width="20" />
        ) : (
          _renderRatingWidget()
        )}
      </div>
    </div>
  );
};
