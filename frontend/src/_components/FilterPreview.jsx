import React from 'react';
import PropTypes from 'prop-types';

function FilterPreview({ text, onClose }) {
  return (
    <div className="tj-ms-preview">
      <div className="count-main d-flex">
        <div className="selected-count">{text}</div>
        {onClose && (
          <div className="select-close-btn" title="clear" onClick={onClose}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon-tabler icon-tabler-x"
              width={24}
              height={24}
              viewBox="0 0 24 24"
              strokeWidth="1"
              stroke="currentColor"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <line x1={18} y1={6} x2={6} y2={18}></line>
              <line x1={6} y1={6} x2={18} y2={18}></line>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

FilterPreview.propTypes = {
  text: PropTypes.string.isRequired,
  onClose: PropTypes.func,
};

export { FilterPreview };
