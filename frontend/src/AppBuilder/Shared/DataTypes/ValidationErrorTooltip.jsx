import React, { useRef, useState } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { isCellContentOverflowing } from './utils';

/**
 * ValidationErrorTooltip - Renders a truncated (ellipsized) validation error message,
 * with the full text available in a hover tooltip whenever it's actually truncated.
 *
 * `show` is controlled (rather than relying on OverlayTrigger's own `trigger` prop) because
 * overflow can only be measured once the ref is attached post-mount: the hover handler forces
 * the re-render that re-evaluates `isCellContentOverflowing` against the now-attached node.
 */
export const ValidationErrorTooltip = ({ message, className = 'invalid-feedback', onClick }) => {
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);
  const overflowing = isCellContentOverflowing(ref.current);

  return (
    <OverlayTrigger
      placement="bottom"
      overlay={
        <div className="overlay-cell-table" style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
          {message}
        </div>
      }
      show={overflowing && hovered}
      rootClose
    >
      <div
        ref={ref}
        className={`${className} text-truncate`}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {message}
      </div>
    </OverlayTrigger>
  );
};

export default ValidationErrorTooltip;
