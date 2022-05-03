import React from 'react';

const GroupHeader = ({ addNewKeyValuePair, paramType, descText, setBodyToggle, bodyToggle }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div className="content-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <p style={{ marginRight: '10px' }}> {descText} </p>
        <div>
          {paramType == 'body' && (
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                onClick={() => setBodyToggle(!bodyToggle)}
                checked={bodyToggle}
              />
            </div>
          )}
        </div>
      </div>

      {!bodyToggle && (
        <div>
          <span onClick={() => addNewKeyValuePair(paramType)} role="button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon-tabler icon-tabler-square-plus svg-plus"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="#737373"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <line x1="9" y1="12" x2="15" y2="12" />
              <line x1="12" y1="9" x2="12" y2="15" />
            </svg>
          </span>
        </div>
      )}
    </div>
  );
};

export default GroupHeader;
