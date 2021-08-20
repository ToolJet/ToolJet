import React from 'react'
import { animated } from 'react-spring';

/**
 1. on hover show filled icon
 2. on dismiss show outline icon
 3. on hover reaching 50% of the icon show half filled icon
 4. on dismiss show outline icon for half filled icon
 5. on click set the half-filled icon if precision = 0.5 else set the filled icon
 */
const Star = ({ index, active, inActive, rating, setHoverIndex, allowHalfStar, ...rest }) => {
  const star = <img width="20" height="20" src={`/assets/images/icons/star.svg`} />
  const halfStar = <img width="20" height="20" src={`/assets/images/icons/half-star.svg`} />
  const starOutline = <img width="20" height="20" src={`/assets/images/icons/widgets/starrating.svg`} />

  const [icon, setIcon] = React.useState(star)
  const [outlineIcon, setOutlineIcon] = React.useState(starOutline)
  const [currentPrecision, setPrecision] = React.useState(0)

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
    const percent = (e.clientX - left) / (width * rating);
    const precision = 0.5;
    const isHalfStarHover = roundValueToPrecision(rating * percent + precision / 2, precision)

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
    if(currentPrecision === 0.5) setIcon(halfStar)
    else setIcon(star)
    // onClick(e)
  }

  let conditionalProps = {}

  if(allowHalfStar) {
    conditionalProps = {
      onMouseMove: handleMouseMove,
    }
  }

  const handleMouseEnter = (e) => {
    setHoverIndex(index)
  }

  return (
    <animated.span ref={ref} {...rest} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} {...conditionalProps} className="star" role="button">
      {active ? icon : outlineIcon}
    </animated.span>
  );
};

export default Star
