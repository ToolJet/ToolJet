import React, { cloneElement, useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import OverlayTrigger from 'react-bootstrap/esm/OverlayTrigger';
import Tooltip from 'react-bootstrap/esm/Tooltip';
import 'bootstrap/dist/css/bootstrap.min.css';

export function ToolTip({
  message,
  children,
  placement = 'top',
  trigger = ['hover', 'focus'],
  delay = { show: 50, hide: 100 },
  show = true,
  tooltipClassName = '',
  checkOverflow = false,
  ...rest
}) {
  const [isOverflow, setIsOverflow] = useState(false);
  const childRef = useRef(null);

  const checkOverflowCondition = useCallback(() => {
    if (childRef.current) setIsOverflow(childRef.current.scrollWidth > childRef.current.clientWidth);
  }, [childRef]);
  
  useEffect(() => {
    if (checkOverflow)checkOverflowCondition();
  }, [checkOverflow, checkOverflowCondition, children]);

  if (!show || (checkOverflow && !isOverflow)) return cloneElement(children, { ref: childRef });

  return (
    <OverlayTrigger
      trigger={trigger}
      placement={placement}
      delay={delay}
      overlay={
        <Tooltip className={tooltipClassName} style={{ width: rest?.width ? rest?.width : 'auto' }}>
          {message}
        </Tooltip>
      }
    >
      {children}
    </OverlayTrigger>
  );
}
ToolTip.propTypes = {
  message: PropTypes.string.isRequired,
  children: PropTypes.object.isRequired,
  placement: PropTypes.string,
  trigger: PropTypes.array,
  checkOverflow: PropTypes.bool,
};
