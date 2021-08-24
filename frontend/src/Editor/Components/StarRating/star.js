import React from 'react'
import { animated } from 'react-spring';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

import StarSvg from './icons/star'
import HalfStarSvg from './icons/half-star'
import OutlineStarSvg from './icons/star-outline'

/**
 1. on hover show filled icon
 2. on dismiss show outline icon
 3. on hover reaching 50% of the icon show half filled icon
 4. on dismiss show outline icon for half filled icon
 5. on click set the half-filled icon if precision = 0.5 else set the filled icon
 */
const Star = ({ index, active, color, isHalfStar, onClick, maxRating, setHoverIndex, tooltip, allowHalfStar, ...rest }) => {
  const star = <StarSvg fill={color} />
  const halfStar = <HalfStarSvg fill={color} />
  const starOutline = <OutlineStarSvg fill={color} />

  const [icon, setIcon] = React.useState(star)
  const [outlineIcon, setOutlineIcon] = React.useState(starOutline)
  const [currentPrecision, setPrecision] = React.useState(0)

  React.useEffect(() => {
    setIcon(isHalfStar ? halfStar : star)
    setOutlineIcon(isHalfStar ? halfStar : starOutline)
  }, [color]);

  const ref = React.useRef(null)

  function getDecimalPrecision(num) {
    const decimalPart = num.toString().split('.')[1];
    return decimalPart ? decimalPart.length : 0;
  }

  function roundValueToPrecision(value, precision) {
    if (value == null) {
      return value;
    }
  
    const nearest = Math.round(value / precision) * precision;
    return Number(nearest.toFixed(getDecimalPrecision(precision)));
  }

  const handleMouseMove = (e) => {
    const { left } = ref.current.getBoundingClientRect()
    const { width } = ref.current.firstChild.getBoundingClientRect();
    const percent = (e.clientX - left) / (width * maxRating);
    const precision = 0.5;
    const isHalfStarHover = roundValueToPrecision(maxRating * percent + precision / 2, precision)

    if(isHalfStarHover === 0.5) {
      setIcon(halfStar)
      setOutlineIcon(halfStar)
      setPrecision(0.5)
    } else {
      setIcon(star)
      setOutlineIcon(starOutline)
      setPrecision(0)
    }
  }

  const handleMouseLeave = () => {
    setHoverIndex(null)
    setPrecision(0)
    setIcon(star)
    setOutlineIcon(starOutline)
  }

  const handleClick = (e) => {
    if(currentPrecision === 0.5) onClick(e, index - 0.5)
    else onClick(e, index)
  }

  let conditionalProps = {}

  if(allowHalfStar) {
    conditionalProps = {
      onMouseMove: handleMouseMove,
    }
  }

  const handleMouseEnter = () => {
    setHoverIndex(index)
  }

  const getIcon = () => {
    if(isHalfStar) return halfStar
    if(active) return icon
    return outlineIcon
  }

  const getAnimatedStar = () => {
    return (
      <animated.span onClick={handleClick} ref={ref} {...rest} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} {...conditionalProps} className="star" role="button">
        {getIcon(color)}
      </animated.span>
    )
  }

  if(tooltip) {
    return (
    <OverlayTrigger
      placement="bottom"
      delay={{ show: 250, hide: 400 }}
      overlay={<Tooltip>
        {tooltip}
      </Tooltip>}
    >
      {getAnimatedStar()}
    </OverlayTrigger>
    )
  }

  return (
    <>{getAnimatedStar()}</>
  );
};

export default Star
