import React, { useState } from 'react';
import Information from '../LeftSidebar/icons/information.svg';
import Dropdown from './Dropdown';
import DeletIcon from '../LeftSidebar/icons/delete.svg';
import TestParameter from './TestParameter';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import AddRectangle from '@/_ui/Icon/bulkIcons/AddRectangle';

function Parameter(props) {
  const [open, setOpen] = useState({});
  const { editorSession, editorSessionActions } = props;
  const { bodyParameters = [] } = editorSession;

  const handleInputChange = (index, value) => {
    const newFormData = [...bodyParameters];
    newFormData[index].key = value;
    editorSessionActions.getParameterValue(newFormData);
  };

  const handleDropdownChange = (index, value) => {
    const newFormData = [...bodyParameters];
    newFormData[index].dataType = value;
    editorSessionActions.getParameterValue(newFormData);
  };

  const handleAddClick = () => {
    editorSessionActions.getParameterValue([...bodyParameters, { key: '', dataType: 'string' }]);
    setOpen({ ...open, [bodyParameters.length]: false });
  };

  const handleDeleteClick = (index) => {
    const newFormData = [...bodyParameters];
    newFormData.splice(index, 1);
    editorSessionActions.getParameterValue(newFormData);
    setOpen(Array(newFormData.length).fill(false));
  };

  return (
    <div className="mt-3">
      <strong>Parameter</strong>

      {bodyParameters.length === 0 ? (
        <div className="parameterDashed d-flex align-items-center justify-content-center rounded mt-2 p-2">
          <Information />
          <p style={{ marginLeft: '6px', color: '#687076' }} className="mb-0">
            There are no items in the list
          </p>
        </div>
      ) : (
        bodyParameters.map((item, index) => {
          const containerStyle = {
            width: '120px',
            height: 'auto',
            borderRadius: '4px',
            border: '1px solid rgba(101, 109, 119, 0.16)',
            borderTop: 'none',
            borderBottom: 'none',
          };

          const containerStyleOpen = {
            width: '120px',
            height: 'auto',
            borderRadius: '4px',
            border: '1px solid #3E63DD',
          };

          const dropDownBlockStyle = open[index] ? containerStyleOpen : containerStyle;
          return (
            <div
              key={index}
              className="parentInput d-flex align-items-center justify-content-start border border-light rounded mt-2"
            >
              <input
                type="text"
                value={item.key}
                onChange={(e) => handleInputChange(index, e.target.value)}
                className="keyInput p-2"
                placeholder="Key"
              />
              <Dropdown
                open={open[index]}
                setOpen={(value) => setOpen({ ...open, [index]: value })}
                containerStyle={dropDownBlockStyle}
                title=""
                content={item.dataType}
                contentData={[
                  { name: 'string' },
                  { name: 'number' },
                  { name: 'object' },
                  { name: 'array' },
                  { name: 'boolean' },
                  { name: 'null' },
                ]}
                mt="mt-0"
                handleDropdownChange={handleDropdownChange}
                index={index}
              />
              <div className="deleteBox d-flex align-items-start justify-content-center cursor-pointer">
                <DeletIcon width="18" height="18" onClick={() => handleDeleteClick(index)} />
              </div>
            </div>
          );
        })
      )}

      <div className="d-flex mb-2 mt-2 border-none" style={{ maxHeight: '32px' }}>
        <ButtonSolid variant="ghostBlue" size="sm" onClick={handleAddClick}>
          <AddRectangle width="15" fill="#3E63DD" opacity="1" secondaryFill="#ffffff" />
          &nbsp;&nbsp; Add more
        </ButtonSolid>
      </div>

      {bodyParameters.length > 0 && (
        <TestParameter editorSession={editorSession} editorSessionActions={editorSessionActions} />
      )}
    </div>
  );
}

export default Parameter;
