import React from 'react';
import Headers from './index';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

function readHeaderRows(value) {
  if (!value) return [];
  try {
    const rows = JSON.parse(value);
    if (
      Array.isArray(rows) &&
      rows.every((row) => Array.isArray(row) && row.length === 2 && row.every((part) => typeof part === 'string'))
    )
      return rows;
  } catch {
    // The editor can replace a malformed draft without exposing its contents.
  }
  return null;
}

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
        Set headers
      </ButtonSolid>
    );
  }

  function changeHeaders(key, rows) {
    // Datasource credential storage gives workspace placeholders special treatment. Escape opening braces
    // in JSON so literal header values stay inside the encrypted credential, even if one looks like a placeholder.
    handleOptionChange(key, JSON.stringify(rows).replace(/{/g, '\\u007b'));
  }

  const rows = readHeaderRows(value);
  return (
    <>
      {hasSavedCredential && <p>Enter all headers to use for this connection.</p>}
      {rows === null && <p role="alert">Enter the headers again. The current format could not be read.</p>}
      <Headers
        getter={getter}
        options={rows ?? []}
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
