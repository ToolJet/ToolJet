import React from 'react';
import { animated } from 'react-spring';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import StarSvg from './icons/star';
import HeartSvg from './icons/heart';
import classNames from 'classnames';
/**
 1. on hover show filled icon
 2. on dismiss show outline icon
 3. on hover reaching 50% of the icon show half filled icon
 4. on dismiss show outline icon for half filled icon
 5. on click set the half-filled icon if precision = 0.5 else set the filled icon
 */
const RatingIcon = ({
  index,
  active,
  color,
  isHalfIcon,
  onClick,
  maxRating,
  setHoverIndex,
  tooltip,
  allowHalfStar,
  unselectedBackground,
  iconType,
  allowEditing,
  ariaLabel,
  isSelected,
  ratingValue,
  isDisabled,
  ...rest
}) => {
  // if the icon is star
  const star = iconType === 'hearts' ? <HeartSvg fill={color} /> : <StarSvg fill={color} />;
  const halfIcon =
    iconType === 'hearts' ? (
      <HeartSvg fill={color} unselected={unselectedBackground} isHalf={true} />
    ) : (
      <StarSvg fill={color} unselected={unselectedBackground} isHalf={true} />
    );
  const emptyIcon =
    iconType === 'hearts' ? <HeartSvg fill={unselectedBackground} /> : <StarSvg fill={unselectedBackground} />;

  const [icon, setIcon] = React.useState(star);
  const [outlineIcon, setOutlineIcon] = React.useState(emptyIcon);
  const [currentPrecision, setPrecision] = React.useState(0);

  React.useEffect(() => {
    setIcon(isHalfIcon ? halfIcon : star);
    setOutlineIcon(isHalfIcon ? halfIcon : emptyIcon);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iconType, isHalfIcon, color, unselectedBackground]);

  const ref = React.useRef(null);

  function getDecimalPrecision(num) {
    const decimalPart = num.toString().split('.')[1];
    return decimalPart ? decimalPart.length : 0;
  }

  function roundValueToPrecision(value, precision) {
    if (value === null || value === undefined) {
      return value;
    }

    const nearest = Math.round(value / precision) * precision;
    return Number(nearest.toFixed(getDecimalPrecision(precision)));
  }

  const handleMouseMove = (e) => {
    const { left } = ref.current.getBoundingClientRect();
    const { width } = ref.current.firstChild.getBoundingClientRect();
    const percent = (e.clientX - left) / (width * maxRating);
    const precision = 0.5;
    const isHalfStarHover = roundValueToPrecision(maxRating * percent + precision / 2, precision);

    if (isHalfStarHover === 0.5) {
      setIcon(halfIcon);
      setOutlineIcon(halfIcon);
      setPrecision(0.5);
    } else {
      setIcon(star);
      setOutlineIcon(emptyIcon);
      setPrecision(0);
    }
  };

  const handleMouseLeave = () => {
    // setHoverIndex(null);
    setPrecision(0);
    setIcon(star);
    setOutlineIcon(emptyIcon);
  };

  const handleClick = (e) => {
    if (isDisabled || !allowEditing) return;

    if (currentPrecision === 0.5) onClick(e, index - 0.5);
    else onClick(e, index);
  };

  const handleKeyDown = (e) => {
    if (isDisabled || !allowEditing) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  };

  let conditionalProps = {};

  if (allowHalfStar) {
    conditionalProps = {
      onMouseMove: handleMouseMove,
    };
  }

  const handleMouseEnter = () => {
    setHoverIndex(index);
  };

  const getIcon = () => {
    if (isHalfIcon) return halfIcon;
    if (active) return icon;
    return outlineIcon;
  };

  const getAnimatedStar = () => {
    return (
      <animated.span
        className={classNames('rating-icon-widget', {
          'pointer-events-none': !allowEditing || isDisabled,
        })}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        ref={ref}
        {...rest}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...conditionalProps}
        role="radio"
        tabIndex={allowEditing && !isDisabled ? 0 : -1}
        aria-label={ariaLabel}
        aria-checked={isSelected}
        aria-disabled={isDisabled || !allowEditing}
        aria-posinset={ratingValue}
        aria-setsize={maxRating}
      >
        {getIcon(color)}
      </animated.span>
    );
  };

  if (tooltip) {
    return (
      <OverlayTrigger placement="bottom" delay={{ show: 250, hide: 400 }} overlay={<Tooltip>{tooltip}</Tooltip>}>
        {getAnimatedStar()}
      </OverlayTrigger>
    );
  }

  return <>{getAnimatedStar()}</>;
};

export default RatingIcon;
