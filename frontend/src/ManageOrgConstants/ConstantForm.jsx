import React, { useState } from 'react';
import { withTranslation } from 'react-i18next';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

const ConstantForm = ({
  errors,
  selectedConstant,
  createOrUpdate,
  onCancelBtnClicked,
  isLoading,
  currentEnvironment,
}) => {
  const [fields, setFields] = useState(() => ({
    ...selectedConstant,
    environments: [{ label: currentEnvironment.name, value: currentEnvironment.id }],
  }));

  const handleFieldChange = (e) => {
    const { name, value } = e.target;

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

  const shouldDisbaleButton =
    fields['name'] && fields['value'] && (fields['name'].length > 0 || fields['value'].length > 0) ? false : true;

  return (
    <div className="variable-form-wrap">
      <div className="card-header">
        <h3 className="card-title">
          {!selectedConstant ? 'Add new constant' : 'Update constant'} in {currentEnvironment?.name}{' '}
        </h3>
      </div>
      <div className="card-body">
        <form noValidate>
          <div className="form-group mb-3 ">
            <div className="d-flex mb-3">
              <div
                className="col tj-app-input"
                style={{
                  marginRight: '10px',
                }}
              >
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={'Enter Variable Name'}
                  name="name"
                  onChange={handleFieldChange}
                  value={fields['name']}
                  data
                  autoFocus={!selectedConstant}
                  style={{ height: '32px' }}
                  disabled={!!selectedConstant}
                />
                <span className="text-danger">{errors['name']}</span>
              </div>
            </div>
            <div className="col tj-app-input">
              <label className="form-label">Value</label>
              <input
                type="text"
                className="form-control"
                placeholder={'Enter Value'}
                name="value"
                onChange={handleFieldChange}
                value={fields['value']}
              />
              <span className="text-danger">{errors['value']}</span>
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
          disabled={isLoading || shouldDisbaleButton}
          data-cy="add-constant-button"
        >
          {!selectedConstant ? 'Add constant' : 'Update'}
        </ButtonSolid>
      </div>
    </div>
  );
};
export default withTranslation()(ConstantForm);
