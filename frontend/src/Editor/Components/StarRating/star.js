import React from 'react'
import { animated } from 'react-spring';

const Star = ({ index, active, inActive, rating, setHoverIndex, allowHalfStar, ...rest }) => {
  const star = <img width="20" height="20" src={`/assets/images/icons/star.svg`} />
  const halfStar = <img width="20" height="20" src={`/assets/images/icons/half-star.svg`} />
  const starOutline = <img width="20" height="20" src={`/assets/images/icons/widgets/starrating.svg`} />

  const [icon, setIcon] = React.useState(star)
  const [outlineIcon, setOutlineIcon] = React.useState(starOutline)

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
    }
  }

  const handleMouseLeave = () => {
    setHoverIndex(null)
    // setIcon(star)
    // setOutlineIcon(starOutline)
  }

  let conditionalProps = {}

  if(allowHalfStar) {
    conditionalProps = {
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave
    }
  }

  const handleMouseOver = (e) => {
    console.log('here', index)
    setHoverIndex(index)
  }

  // const getIcon = () => {
  //   if(inActive) return outlineIcon

  //   if(active) return icon

  //   return outlineIcon
  // }

  // const handleClick = (e) => {

  // }

  return (
    <animated.span ref={ref} {...rest} onMouseEnter={handleMouseOver} onMouseLeave={handleMouseLeave} {...conditionalProps} className="star" role="button">
      {active ? icon : outlineIcon}
    </animated.span>
  );
};

export default Star
