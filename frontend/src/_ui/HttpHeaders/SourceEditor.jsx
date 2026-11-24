import React from 'react';
import Input from '../Input';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import AddRectangle from '@/_ui/Icon/bulkIcons/AddRectangle';
import '@/_ui/HttpHeaders/sourceEditorStyles.scss';
import InfoIcon from '@assets/images/icons/info.svg';

export default ({
  options,
  addNewKeyValuePair,
  removeKeyValuePair,
  keyValuePairValueChanged,
  workspaceConstants,
  isDisabled,
  width,
  dataCy,
  classes = null,
  secretValues = false,
}) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const Field = secretValues ? 'input' : Input;
  const inputProps = secretValues ? {} : { workspaceConstants, classes };

  return (
    <div className="table-content-wrapper">
      {options.length === 0 && (
        <div className="empty-key-value" data-cy="label-empty-key-value">
          <InfoIcon style={{ width: '16px', marginRight: '5px' }} />
          <span>There are no key value pairs added</span>
        </div>
      )}

      {options.map((option, index) => (
        <div className="d-flex align-items-top row-container query-manager-border-color" key={index}>
          <Field
            {...inputProps}
            data-cy={`${dataCy}-key-input-field-${index}`}
            name={secretValues ? `http-header-name-${index}` : undefined}
            aria-label={secretValues ? `Header name ${index + 1}` : undefined}
            type="text"
            className="input-control"
            onChange={(e) => keyValuePairValueChanged(e.target.value, 0, index)}
            value={option[0]}
            placeholder="Key"
            autoComplete="off"
            disabled={isDisabled}
            style={{
              flex: 1,
              width: '316px',
              borderTopRightRadius: '0',
              borderBottomRightRadius: '0',
              borderRight: 'none',
            }}
          />

          <Field
            {...inputProps}
            data-cy={`${dataCy}-value-input-field-${index}`}
            name={secretValues ? `http-header-value-${index}` : undefined}
            aria-label={secretValues ? `Header value ${index + 1}` : undefined}
            type={secretValues ? 'password' : 'text'}
            value={option[1]}
            placeholder="Value"
            autoComplete={secretValues ? 'new-password' : 'off'}
            className="input-control"
            onChange={(e) => keyValuePairValueChanged(e.target.value, 1, index)}
            disabled={isDisabled}
            style={{
              flex: 2,
              width: width ? width : '316px',
              borderTopLeftRadius: '0',
              borderBottomLeftRadius: '0',
              borderTopRightRadius: '0',
              borderBottomRightRadius: '0',
            }}
          />

          <button
            data-cy={`${dataCy}-delete-button-${index}`}
            className={`d-flex justify-content-center align-items-center delete-field-option bg-transparent border-0 rounded-0 border-top border-bottom border-end rounded-end ${
              darkMode ? 'delete-field-option-dark' : ''
            }`}
            style={{ height: '35px' }}
            type="button"
            aria-label={`Remove row ${index + 1}`}
            disabled={isDisabled}
            onClick={() => removeKeyValuePair(index)}
          >
            <Trash fill="var(--slate9)" style={{ height: '16px' }} />
          </button>
        </div>
      ))}

      <div className="d-flex mb-2" style={{ height: '16px' }}>
        <ButtonSolid
          data-cy={`${dataCy}-add-button`}
          variant="ghostBlue"
          size="sm"
          onClick={() => addNewKeyValuePair(options)}
          style={{ gap: '0px', fontSize: '12px', fontWeight: '500', padding: '0px 9px' }}
          disabled={isDisabled}
        >
          {/* <AddRectangle width="15" fill="#3E63DD" opacity="1" secondaryFill="#ffffff" /> */}
          <AddRectangle
            width="15"
            fill={isDisabled ? '#C1C8CD' : '#3E63DD'}
            opacity={isDisabled ? '0.3' : '1'}
            secondaryFill={isDisabled ? '#ffffff' : '#ffffff'}
          />
          &nbsp;&nbsp;Add
        </ButtonSolid>
      </div>
    </div>
  );
};
