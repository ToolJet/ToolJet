import React from 'react';
import { useTrail } from 'react-spring';

import Star from './star'

export const StarRating = function StarRating({component, onComponentOptionChanged, onEvent}) {
  const label = component.definition.properties.label.value;
  const rating = +component.definition.properties.rating.value ?? 5;
  const textColorProperty = component.definition.styles.textColor;
  const textColor = textColorProperty ? textColorProperty.value : '#000';

  const animatedStars = useTrail(rating, {
    config: {
      friction: 22,
      tension: 500
    },
    from: { opacity: 0,
     transform: "scale(0.8)" },
    opacity: 1,
    transform: "scale(1)",
    color: textColor
  });

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
