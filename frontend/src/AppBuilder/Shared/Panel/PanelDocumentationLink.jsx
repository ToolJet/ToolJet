import React from 'react';
import PropTypes from 'prop-types';
import { BookOpen } from 'lucide-react';
import { ToolTip } from '@/_components/ToolTip';

// The documentation icon link shared by right-side panel headers: 28px ghost hit target, 15px BookOpen icon.
const PanelDocumentationLink = ({ href, label, dataCy, placement = 'bottom', tooltipClassName = '' }) => (
  <ToolTip
    message={label}
    placement={placement}
    trigger={['hover', 'focus']}
    show={true}
    tooltipClassName={tooltipClassName}
  >
    <a
      className="tj-panel-header__doc-link"
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      data-cy={dataCy}
      onClick={(event) => event.stopPropagation()}
    >
      <BookOpen size={15} strokeWidth={1.75} aria-hidden="true" />
    </a>
  </ToolTip>
);

PanelDocumentationLink.propTypes = {
  href: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  dataCy: PropTypes.string,
  placement: PropTypes.string,
  tooltipClassName: PropTypes.string,
};

export default PanelDocumentationLink;
