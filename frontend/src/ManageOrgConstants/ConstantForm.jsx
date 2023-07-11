import React, { useState } from 'react';
import { withTranslation } from 'react-i18next';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { capitalize } from 'lodash';
import { Tooltip } from 'react-tooltip';

const ConstantForm = ({
  selectedConstant,
  createOrUpdate,
  onCancelBtnClicked,
  isLoading,
  currentEnvironment,
  checkIfConstantNameExists,
}) => {
  const [fields, setFields] = useState(() => ({
    ...selectedConstant,
    environments: [{ label: currentEnvironment.name, value: currentEnvironment.id }],
  }));

  const [error, setError] = useState({});

  function isValidPropertyName(name) {
    const validNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    return validNameRegex.test(name);
  }

  const handleConstantNameError = (name, value) => {
    const isNameAlreadyExists = name === 'name' && checkIfConstantNameExists(value, currentEnvironment.id);
    const invalidNameLength = name === 'name' && value.length > 32;
    const maxNameLengthReached = name === 'name' && value.length === 32;

    if (isNameAlreadyExists) {
      setError({
        name: `Constant with this name already exists in ${capitalize(currentEnvironment.name)} environment`,
      });
    } else if (invalidNameLength) {
      setError({
        name: `Constant name should be between 1 and 32 characters`,
      });
    } else if (maxNameLengthReached) {
      setError({
        name: `Maximum length has been reached`,
      });
    } else if (!isValidPropertyName(value)) {
      setError({
        name: `Constant name should start with a letter or underscore and can only contain letters, numbers and underscores`,
      });
    }
  };

  const handleConstantValueError = (name, value) => {
    const invalidValueLength = name === 'value' && value.length > 10000;

    if (invalidValueLength) {
      setError({
        value: `Value should be less than 10000 characters`,
      });
    }
  };

  const handleFieldChange = (e) => {
    setError({});
    const { name, value } = e.target;

    handleConstantNameError(name, value);
    handleConstantValueError(name, value);

    setFields((fields) => ({
      ...fields,
      [name]: value,
    }));
  };
  const handlecreateOrUpdate = (e) => {
    e.preventDefault();
    const isUpdate = !!selectedConstant;
    createOrUpdate(fields, isUpdate);
  };

  const shouldDisableButton =
    fields['name'] && fields['value'] && (fields['name'].length > 0 || fields['value'].length > 0) ? false : true;

  const [isOpen, setIsOpen] = useState(false);

  const inputRef = React.useRef(null);

  const handleInput = () => {
    const input = inputRef.current;
    if (fields['value'].length > 30 && input) {
      input.style.height = 'auto';
      input.style.height = `${input.scrollHeight}px`;
      input.style.overflow = fields['value'].length >= 300 ? 'scroll' : 'hidden';
    }
  };

  return (
    <div className="variable-form-wrap">
      <div className="card-header">
        <h3 className="card-title">
          {!selectedConstant ? 'Add new constant' : 'Update constant'} in {currentEnvironment?.name}{' '}
        </h3>
      </div>
      <div className="card-body org-constant-form">
        <form noValidate>
          <div className="form-group mb-3 ">
            <div className="d-flex mb-3">
              <div
                className="col tj-app-input"
                style={{
                  marginRight: '10px',
                }}
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
              >
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className={`tj-input-element ${error['name'] ? 'tj-input-error-state' : ''}`}
                  placeholder={'Enter Constant Name'}
                  name="name"
                  onChange={handleFieldChange}
                  value={fields['name']}
                  disabled={!!selectedConstant}
                  data-tooltip-id="tooltip-for-org-input-disabled"
                  data-tooltip-content={'Cannot edit constant name'}
                  data-tooltip-offset={5}
                />
                <Tooltip id="tooltip-for-org-input-disabled" isOpen={!!selectedConstant && isOpen} place={'bottom'} />
                <span className="text-danger">{error['name']}</span>
              </div>
            </div>
            <div className="col tj-app-input">
              <label className="form-label">Value</label>
              <textarea
                ref={inputRef}
                type="text"
                className={`tj-input-element ${error['value'] ? 'tj-input-error-state' : ''}`}
                placeholder={'Enter Value'}
                name="value"
                onChange={handleFieldChange}
                value={fields['value']}
                onInput={handleInput}
                onFocus={() => !!selectedConstant && handleInput()}
                style={{
                  height: !!selectedConstant && selectedConstant?.value?.length > 50 ? '300px' : '36px',
                  minHeight: '36px',
                  maxHeight: '500px',
                  whiteSpace: 'pre-line',
                  resize: 'none',
                  overflow: 'hidden',
                }}
              />

              <span className="text-danger">{error['value']}</span>
            </div>
          </div>
        </form>
      </div>
      <div className="form-footer gap-2 variable-form-footer">
        <ButtonSolid onClick={onCancelBtnClicked} data-cy="cancel-button" variant="tertiary">
          Cancel
        </ButtonSolid>
        <ButtonSolid
          type="submit"
          onClick={handlecreateOrUpdate}
          isLoading={isLoading}
          disabled={isLoading || shouldDisableButton || selectedConstant?.value === fields['value']}
          data-cy="add-constant-button"
        >
          {!selectedConstant ? 'Add constant' : 'Update'}
        </ButtonSolid>
      </div>
    </div>
  );
};
export default withTranslation()(ConstantForm);
