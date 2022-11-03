import React from 'react';

const GroupHeader = ({ addNewKeyValuePair, paramType, descText, setBodyToggle, bodyToggle }) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  return (
    <div className="border" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="content-title d-flex justify-content-beyween align-items-center">
        <p className="my-0 py-3 px-3" style={{ marginRight: '10px', color: darkMode ? '#ffffff' : '#11181C' }}>
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
