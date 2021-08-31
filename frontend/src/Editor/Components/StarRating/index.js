import '@/_styles/widgets/star-rating.scss';

import React from 'react';
import { useTrail } from 'react-spring';
import { resolveReferences, getParsedValue } from '@/_helpers/utils';

import Star from './star';

export const StarRating = function StarRating({
  id,
  component,
  onComponentClick,
  onComponentOptionChanged,
  currentState,
  onEvent,
}) {
  const label = component.definition.properties.label.value;
  const defaultSelected = +component.definition.properties.defaultSelected.value ?? 5;
  const maxRating = +component.definition.properties.maxRating.value ?? 5;
  const allowHalfStar = component.definition.properties.allowHalfStar.value ?? false;
  const textColorProperty = component.definition.styles.textColor;
  const color = textColorProperty ? textColorProperty.value : '#ffb400';
  const widgetVisibility = component.definition.styles?.visibility?.value || true;
  const disableState = component.definition.styles?.disableState?.value || false;

  const parsedDisableState = typeof disableState !== 'boolean' ? getParsedValue(resolveReferences, disableState, currentState) : disableState;

  let parsedWidgetVisibility = widgetVisibility;
  
  try {
    parsedWidgetVisibility = resolveReferences(parsedWidgetVisibility, currentState, []);
  } catch (err) { console.log(err); }

  const tooltips = component.definition.properties.tooltips.value ?? [];
  const _tooltips = resolveReferences(tooltips, currentState, []) ?? [];

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
    onComponentOptionChanged(component, 'value', defaultSelected);
  }, [defaultSelected]);

  React.useEffect(() => {
    setTimeout(() => {
      onComponentOptionChanged(component, 'value', defaultSelected);
    }, 1000)
  }, []);

  function handleClick(idx) {
    // +1 cos code is considering index from 0,1,2.....
    onComponentOptionChanged(component, 'value', idx + 1);
    onEvent('onChange', { component });
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
    if (_tooltips && Array.isArray(_tooltips) && _tooltips.length > 0) return _tooltips[index];
    return '';
  };

  return (
    <div disabled={parsedDisableState} className="star-rating" onClick={event => {event.stopPropagation(); onComponentClick(id, component)}} style={{display:parsedWidgetVisibility ? '' : 'none'}}>
      {/* TODO: Add label color defination property instead of hardcoded color*/}
      <span className="label form-check-label form-check-label col-auto" style={{ color: '#000' }}>
        {label}
      </span>
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
  );
};
