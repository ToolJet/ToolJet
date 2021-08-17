import React from 'react';
import { useTrail, animated } from 'react-spring';

import Star from './star'

export const StarRating = function StarRating({rating = 5}) {
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

  const [currentRating, setRating] = React.useState(rating);
  return (
    <div>
      {animatedStars.map((props, index) => (
        <Star
          active={index + 1 <= currentRating}
          onClick={e => {
            e.stopPropagation();
            setRating(index + 1);
          }}
          key={index}
          style={{ ...props }}
        />
      ))}
    </div>
  );
};
