import React from 'react';
import Input from '../Input';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import AddRectangle from '@/_ui/Icon/bulkIcons/AddRectangle';
import '@/_ui/HttpHeaders/sourceEditorStyles.scss';
import InfoIcon from '@assets/images/icons/info.svg';

export default ({ options, addNewKeyValuePair, removeKeyValuePair, keyValuePairValueChanged, workspaceConstants }) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  return (
    <div className="table-content-wrapper">
      {options.length === 0 && (
        <div className="empty-key-value">
          <InfoIcon style={{ width: '16px', marginRight: '5px' }} />
          <span>There are no key value pairs added</span>
        </div>
      )}

      {options.map((option, index) => (
        <div className="d-flex align-items-top row-container query-manager-border-color" key={index}>
          <Input
            type="text"
            className="input-control"
            onChange={(e) => keyValuePairValueChanged(e.target.value, 0, index)}
            value={option[0]}
            workspaceConstants={workspaceConstants}
            placeholder="Key"
            autoComplete="off"
            style={{
              flex: 1,
              width: '316px',
              borderTopRightRadius: '0',
              borderBottomRightRadius: '0',
              borderRight: 'none',
            }}
          />

          <Input
            type="text"
            value={option[1]}
            placeholder="Value"
            autoComplete="off"
            className="input-control"
            onChange={(e) => keyValuePairValueChanged(e.target.value, 1, index)}
            workspaceConstants={workspaceConstants}
            style={{
              flex: 2,
              width: '316px',
              borderTopLeftRadius: '0',
              borderBottomLeftRadius: '0',
              borderTopRightRadius: '0',
              borderBottomRightRadius: '0',
            }}
          />

          <button
            className={`d-flex justify-content-center align-items-center delete-field-option bg-transparent border-0 rounded-0 border-top border-bottom border-end rounded-end ${
              darkMode ? 'delete-field-option-dark' : ''
            }`}
            style={{ height: '35px' }}
            role="button"
            onClick={() => removeKeyValuePair(index)}
          >
            <Trash fill="var(--slate9)" style={{ height: '16px' }} />
          </button>
        </div>
      ))}

      <div className="d-flex mb-2" style={{ height: '16px' }}>
        <ButtonSolid
          variant="ghostBlue"
          size="sm"
          onClick={() => addNewKeyValuePair(options)}
          style={{ gap: '0px', fontSize: '12px', fontWeight: '500', padding: '0px 9px' }}
        >
          <AddRectangle width="15" fill="#3E63DD" opacity="1" secondaryFill="#ffffff" />
          &nbsp;&nbsp;Add more
        </ButtonSolid>
      </div>
    </div>
  );
};
