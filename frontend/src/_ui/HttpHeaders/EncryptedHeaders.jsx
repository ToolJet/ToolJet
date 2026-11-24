import React from 'react';
import Headers from './index';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

export default function EncryptedHeaders({
  getter,
  value,
  hasSavedCredential,
  hasDraft,
  isDisabled,
  handleOptionChange,
  restoreCredential,
  dataCy,
}) {
  if (hasSavedCredential && !hasDraft) {
    return (
      <ButtonSolid variant="secondary" size="sm" disabled={isDisabled} onClick={() => handleOptionChange(getter, '')}>
        Replace headers
      </ButtonSolid>
    );
  }

  function changeHeaders(key, rows) {
    // Datasource credential storage gives workspace placeholders special treatment. Escape opening braces
    // in JSON so literal header values stay inside the encrypted credential, even if one looks like a placeholder.
    handleOptionChange(key, JSON.stringify(rows).replace(/{/g, '\\u007b'));
  }

  return (
    <>
      {hasSavedCredential && <p>Enter the complete set of replacement headers.</p>}
      <Headers
        getter={getter}
        options={value ? JSON.parse(value) : []}
        handleOptionChange={changeHeaders}
        secretValues
        isDisabled={isDisabled}
        dataCy={dataCy}
      />
      {hasSavedCredential && (
        <div className="tw-flex tw-gap-2">
          <ButtonSolid variant="secondary" size="sm" disabled={isDisabled} onClick={restoreCredential}>
            Cancel
          </ButtonSolid>
          <ButtonSolid variant="ghostBlue" size="sm" disabled={isDisabled} onClick={() => changeHeaders(getter, [])}>
            Clear headers
          </ButtonSolid>
        </div>
      )}
    </>
  );
}
