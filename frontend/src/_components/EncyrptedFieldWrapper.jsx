import React, { useState } from 'react';
import { ButtonSolid } from './AppButton';

export default function EncryptedFieldWrapper({
  children,
  options,
  selectedDataSource,
  optionchanged,
  optionsChanged,
  name,
  label,
  encrypted = true,
}) {
  const [disabled, setDisabled] = useState(true);

  const handleEncryptedFieldsToggle = (field) => {
    const isEditing = disabled;
    if (isEditing) {
      optionchanged(field, '');
    } else {
      //Send old field value if editing mode disabled for encrypted fields
      const newOptions = { ...options };
      const oldFieldValue = selectedDataSource?.['options']?.[field];
      optionsChanged({ ...newOptions, [field]: oldFieldValue });
    }
    setDisabled(!isEditing);
  };

  return (
    <>
      <div className="d-flex align-items-center mt-3">
        <label className="form-label text-muted">{label}</label>
        <div className="mx-1 col">
          <ButtonSolid
            className="datasource-edit-btn mb-2"
            type="a"
            variant="tertiary"
            target="_blank"
            rel="noreferrer"
            onClick={() => handleEncryptedFieldsToggle(name)}
          >
            {disabled ? 'Edit' : 'Cancel'}
          </ButtonSolid>
        </div>
        <div className="col-auto mb-2">
          <small className="text-green mx-2">
            <img className="mx-2 encrypted-icon" src="assets/images/icons/padlock.svg" width="12" height="12" />
            Encrypted
          </small>
        </div>
      </div>
      {React.cloneElement(children, { encrypted, disabled, placeholder: '**************' })}
    </>
  );
}
