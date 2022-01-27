import React from 'react';

const GroupHeader = ({ darkMode }) => {
  return (
    <div className={`group-header row py-2 mb-1  mx-0 ${darkMode && 'bg-dark'}`}>
      <div className="col-5">
        <span className="text-uppercase small strong" style={{ fontSize: '10px' }}>
          Key
        </span>
      </div>
      <div className="col-6">
        <span className="text-uppercase small strong" style={{ fontSize: '10px' }}>
          Value
        </span>
      </div>
    </div>
  );
};

export default GroupHeader;
