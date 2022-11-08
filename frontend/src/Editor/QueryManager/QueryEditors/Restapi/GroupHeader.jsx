import React from 'react';

const GroupHeader = ({ paramType, descText, setBodyToggle, bodyToggle }) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  return (
    <div
      className="border-bottom query-manager-restapi-border-color"
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
    >
      <div className="content-title d-flex justify-content-beyween align-items-center">
        <p
          className="my-0 py-3 px-3 font-weight-500"
          style={{ marginRight: '10px', color: darkMode ? '#ECEDEE' : '#11181C' }}
        >
          {' '}
          {descText}{' '}
        </p>
        <div className="d-flex align-items-center">
          {paramType == 'body' && (
            <div className="form-check form-switch my-0">
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
    </div>
  );
};

export default GroupHeader;
