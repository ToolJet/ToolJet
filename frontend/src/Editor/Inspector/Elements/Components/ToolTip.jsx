import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

const tooltipStyle = {
  textDecorationLine: 'underline',
  textDecorationStyle: 'dashed',
};

export const ToolTip = ({ label, meta, labelClass }) => {
  function renderTooltip(props) {
    return (
      <Tooltip id="button-tooltip" {...props}>
        {meta.tip}
      </Tooltip>
    );
  }

  return meta.tip ? (<OverlayTrigger placement="left" delay={{ show: 250, hide: 400 }} overlay={renderTooltip}>
        <label style={tooltipStyle} className={labelClass || 'form-label'}>
          {label}
        </label>
        </OverlayTrigger>) : <label className={labelClass || 'form-label'}>{label}</label>;

};
