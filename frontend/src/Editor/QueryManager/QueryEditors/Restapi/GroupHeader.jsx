import React from 'react';
import { CustomToggleSwitch } from '@/Editor/QueryManager/Components/CustomToggleSwitch';

const GroupHeader = ({ paramType, descText, setBodyToggle, bodyToggle }) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  return (
    <div className="border-bottom query-manager-restapi-border-color d-flex justify-content-between align-items-center">
      <div className="content-title d-flex justify-content-beyween align-items-center">
        <p
          className="my-0 py-3 px-3 font-weight-400"
          style={{ marginRight: '10px', color: darkMode ? '#ECEDEE' : '#11181C' }}
        >
          {' '}
          {descText}{' '}
        </p>
        <div className="d-flex align-items-center">
          {paramType == 'body' && (
            <div className=" my-0">
              <CustomToggleSwitch
                isChecked={bodyToggle}
                toggleSwitchFunction={setBodyToggle}
                action="bodyToggle"
                darkMode={darkMode}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupHeader;
