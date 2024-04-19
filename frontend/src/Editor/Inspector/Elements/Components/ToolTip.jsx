import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

const tooltipStyle = {
  textDecorationLine: 'underline',
  textDecorationStyle: 'dashed',
};

export const ToolTip = ({ label, meta, labelClass, bold = false }) => {
  function renderTooltip(props) {
    return (
      <Tooltip id="button-tooltip" {...props}>
        {meta.tip}
      </Tooltip>
    );
  }

  if (meta?.tip) {
    return (
      <OverlayTrigger placement="left" delay={{ show: 250, hide: 400 }} overlay={renderTooltip}>
        <label style={tooltipStyle} className={labelClass || 'form-label'}>
          {label}
        </label>
      </OverlayTrigger>
    );
  } else {
    return (
      <label
        data-cy={`label-${String(label ?? '')
          .toLowerCase()
          .replace(/\s+/g, '-')}`}
        className={labelClass || 'form-label'}
        style={{ fontWeight: bold ? 500 : 400 }}
      >
        {label}
      </label>
    );
  }
};
