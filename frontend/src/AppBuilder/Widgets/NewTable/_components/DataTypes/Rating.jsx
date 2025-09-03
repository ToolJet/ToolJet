import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { determineJustifyContentValue } from '@/_helpers/utils';
import { useTrail } from 'react-spring';
import RatingIcon from '@/AppBuilder/Widgets/Rating/RatingIcon';
import useTextColor from '../DataTypes/_hooks/useTextColor';
import useValidationStyle from '../DataTypes/_hooks/useValidationStyle';

export const RatingColumn = ({
  isEditable,
  handleCellValueChange,
  textColor,
  horizontalAlignment,
  cellValue,
  column,
  row,
  id,
}) => {
  const validateWidget = useStore((state) => state.validateWidget, shallow);
  const getResolvedValue = useStore.getState().getResolvedValue;

  const cellTextColor = useTextColor(id, textColor);

  // Rating-specific properties with defaults
  const maxRating = getResolvedValue(column.maxRating) || 5;
  const allowHalfStar = getResolvedValue(column.allowHalfStar) || false;
  const iconType = getResolvedValue(column.iconType) || 'stars';
  const tooltips = getResolvedValue(column.tooltips) || [];
  const selectedColor = getResolvedValue(column.selectedColor) || '#FFCB05';
  const unselectedColor = getResolvedValue(column.unselectedColor) || '#D1D5DB';

  const [announceValue, setAnnounceValue] = React.useState('');

  // Get default rating and convert cell value to rating index (0-based)
  const defaultRating = getResolvedValue(column.defaultRating) || 3;
  const currentRatingIndex = React.useMemo(() => {
    const numValue = Number(cellValue);
    // If cellValue is empty/null, use defaultRating, otherwise use cellValue
    const ratingValue = cellValue === null || cellValue === undefined || cellValue === '' ? defaultRating : numValue;
    return isNaN(ratingValue) ? defaultRating - 1 : ratingValue - 1;
  }, [cellValue, defaultRating]);

  const [hoverIndex, setHoverIndex] = React.useState(null);

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

  const validationData = validateWidget({
    validationObject: {
      minValue: { value: column.minValue },
      maxValue: { value: column.maxValue },
      customRule: { value: column.customRule },
    },
    widgetValue: cellValue,
    customResolveObjects: { cellValue },
  });
  const { isValid, validationError } = validationData;
  useValidationStyle(id, row, validationError);

  function handleClick(idx) {
    if (!isEditable) return;

    // +1 because we store rating as 1-based value
    const newValue = idx + 1;
    handleCellValueChange(row.index, column.key || column.name, newValue, row.original);

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

  const renderRatingWidget = () => {
    return (
      <div className="d-flex align-items-center h-100">
        {/* Accessibility: Live region for announcing rating changes */}
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {announceValue}
        </div>

        <div
          role="radiogroup"
          aria-label={`Rating widget, ${iconType === 'stars' ? 'stars' : 'hearts'} from 1 to ${maxRating}`}
          aria-required="false"
          aria-disabled={!isEditable}
          className={`rating-widget-group d-flex justify-content-${determineJustifyContentValue(horizontalAlignment)}`}
          style={{ color: cellTextColor || 'inherit' }}
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
                  handleClick(idx);
                }}
                allowHalfStar={allowHalfStar}
                key={index}
                index={index}
                color={iconType === 'stars' ? selectedColor : selectedColor}
                style={{ ...props }}
                setHoverIndex={setHoverIndex}
                unselectedBackground={unselectedColor}
                iconType={iconType}
                allowEditing={isEditable}
                currentRatingIndex={currentRatingIndex}
                ariaLabel={ariaLabel}
                isSelected={isSelected}
                ratingValue={ratingValue}
                isDisabled={!isEditable}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`h-100 d-flex flex-column justify-content-center ${!isValid ? 'is-invalid' : ''}`}>
      {renderRatingWidget()}
      {!isValid && <div className="invalid-feedback text-truncate">{validationError}</div>}
    </div>
  );
};
