import React from 'react';
import { useTrail, animated } from 'react-spring';

import Star from './star'

export const StarRating = function StarRating({rating = 5, component, onComponentOptionChanged, onEvent}) {
  const animatedStars = useTrail(5, {
    config: {
      friction: 22,
      tension: 500
    },
    from: { opacity: 0,
     transform: "scale(0.8)" },
    opacity: 1,
    transform: "scale(1)"
  });

  const label = component.definition.properties.label.value;
  const textColorProperty = component.definition.styles.textColor;
  const textColor = textColorProperty ? textColorProperty.value : '#000';

  const [currentRating, setRating] = React.useState(rating);

  function onChange() {
    onComponentOptionChanged(component, 'value', currentRating);
    onEvent('onChange', { component });
  }

  return (
    <div>
      <span className="form-check-label form-check-label col-auto mb-1">{label}</span>
      {animatedStars.map((props, index) => (
        <Star
          active={index + 1 <= currentRating}
          color={textColor}
          onClick={e => {
            e.stopPropagation();
            setRating(index + 1);
            onChange()
          }}
          key={index}
          style={{ ...props }}
        />
      ))}
    </div>
  );
};
