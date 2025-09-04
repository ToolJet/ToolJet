import './rating.scss';
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
    defaultSelected = 3,
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
    labelColor: labelTextColor,
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

  // Generate unique ID for ARIA labelling
  const ratingId = React.useMemo(() => `rating-${Math.random().toString(36).substr(2, 9)}`, []);
  const [announceValue, setAnnounceValue] = React.useState('');

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

  function handleClick(idx) {
    // +1 cos code is considering index from 0,1,2.....
    const newValue = idx + 1;
    setExposedVariable('value', newValue);
    fireEvent('onChange');

    // Announce the new rating value for screen readers
    const ratingText = `${newValue} out of ${maxRating} ${iconType === 'stars' ? 'stars' : 'hearts'}`;
    setAnnounceValue(ratingText);
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

  const resetRating = () => {
    setRatingIndex(defaultSelected - 1);
    setExposedVariable('value', defaultSelected);
  };

  const setValue = React.useCallback(
    (value) => {
      // Input validation: only accept numbers or numeric strings
      let numericValue;

      if (typeof value === 'number') {
        numericValue = value;
      } else if (typeof value === 'string') {
        // Check if string represents a valid number
        const parsed = parseFloat(value);
        if (isNaN(parsed) || value.trim() === '' || !isFinite(parsed)) {
          return; // Reject invalid string values
        }
        numericValue = parsed;
      } else {
        return; // Reject any other data types (objects, arrays, etc.)
      }

      // Helper function to round to nearest half
      const roundToNearestHalf = (num) => {
        return Math.round(num * 2) / 2;
      };

      // Helper function to round using floor/ceil based on decimal part
      const roundWithoutHalf = (num) => {
        const decimal = num % 1;
        if (decimal === 0) return num;

        // If decimal is >= 0.5, round up (ceil), otherwise round down (floor)
        return decimal >= 0.5 ? Math.ceil(num) : Math.floor(num);
      };

      let processedValue = numericValue;

      // Handle decimal values based on allowHalfStar setting
      if (numericValue % 1 !== 0) {
        if (allowHalfStar) {
          // Round to nearest half (e.g., 4.25-4.75 → 4.5)
          processedValue = roundToNearestHalf(numericValue);
        } else {
          // Round using floor/ceil logic
          processedValue = roundWithoutHalf(numericValue);
        }
      }

      // Ensure the value is within valid range
      processedValue = Math.max(0, Math.min(processedValue, maxRating));

      setRatingIndex(processedValue - 1);
      setExposedVariable('value', processedValue);
    },
    [allowHalfStar, maxRating, setExposedVariable]
  );

  React.useEffect(() => {
    setExposedVariable('label', label);
    setExposedVariable('setValue', setValue);
  }, [setValue, allowHalfStar, maxRating, label, setExposedVariable]);

  React.useEffect(() => {
    resetRating();
    setExposedVariable('resetRating', resetRating);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultSelected]);

  const _renderRatingWidget = () => {
    return (
      <>
        {/*Accessibility : Live region for announcing rating changes */}
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {announceValue}
        </div>

        <div
          role="radiogroup"
          aria-labelledby={label ? `${ratingId}-label` : undefined}
          aria-label={
            !label ? `Rating widget, ${iconType === 'stars' ? 'stars' : 'hearts'} from 1 to ${maxRating}` : undefined
          }
          aria-required="false"
          aria-disabled={isDisabled}
          className="rating-widget-group"
        >
          {animatedStars.map((props, index) => {
            const ratingValue = index + 1;
            const isSelected = index <= currentRatingIndex;
            const ariaLabel = `${ratingValue} out of ${maxRating} ${iconType === 'stars' ? 'stars' : 'hearts'}${
              getTooltip(index) ? `, ${getTooltip(index)}` : ''
            }`;

            return (
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
                currentRatingIndex={currentRatingIndex}
                ariaLabel={ariaLabel}
                isSelected={isSelected}
                ratingValue={ratingValue}
                isDisabled={isDisabled}
              />
            );
          })}
        </div>
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
        <span
          id={`${ratingId}-label`}
          className={label && `label form-check-label col-auto`}
          style={{ color: labelColorStyle }}
        >
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
        id={`${ratingId}-label`}
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
