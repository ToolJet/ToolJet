import React, { cloneElement, useCallback, useRef, useState } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Overlay from 'react-bootstrap/Overlay';

const noop = () => {};
const NO_POPPER_CONFIG = {};

/**
 * react-bootstrap's OverlayTrigger, with its overlay mounted only once it first shows.
 *
 * Table cells render one of these each (the tooltip of a cell whose content overflows) and almost never show it, yet
 * the overlay is mounted from the start: a Popper instance, a root-close listener and a transition per cell, about
 * half of a text cell's rendering. With a controlled `show` (a boolean, no `onToggle`, an element child) the trigger's
 * own handlers change nothing (they can only call `onToggle`), so this renders the same child with the same ref and, from
 * the first `show`, the same Overlay. Anything else is the real OverlayTrigger, decided when it mounts.
 */
export default function LazyOverlayTrigger(props) {
  const controlled = useRef(
    typeof props.show === 'boolean' && !props.onToggle && typeof props.children !== 'function'
  ).current;
  return controlled ? <ControlledTrigger {...props} /> : <OverlayTrigger {...props} />;
}

function ControlledTrigger({
  children,
  overlay,
  show,
  placement,
  flip = placement && placement.indexOf('auto') !== -1,
  popperConfig = NO_POPPER_CONFIG,
  // OverlayTrigger's own props, not the Overlay's.
  trigger, // eslint-disable-line no-unused-vars
  delay, // eslint-disable-line no-unused-vars
  defaultShow, // eslint-disable-line no-unused-vars
  ...props
}) {
  const node = useRef(null);
  const [mounted, setMounted] = useState(show);
  if (show && !mounted) setMounted(true);

  const childRef = children.ref;
  const attachRef = useCallback(
    (element) => {
      node.current = element;
      if (typeof childRef === 'function') childRef(element);
      else if (childRef) childRef.current = element;
    },
    [childRef]
  );

  return (
    <>
      {cloneElement(children, { ref: attachRef })}
      {(mounted || show) && (
        <Overlay
          {...props}
          show={show}
          onHide={noop}
          flip={flip}
          placement={placement}
          popperConfig={popperConfig}
          target={node.current}
        >
          {overlay}
        </Overlay>
      )}
    </>
  );
}
