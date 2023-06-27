import React, { useState } from 'react';
import Select from '@/_ui/Select';
import Multiselect from '@/_ui/Multiselect/Multiselect';
import { withTranslation } from 'react-i18next';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

const ConstantForm = ({
  errors,
  allConstants = [],
  selectedConstant,
  createOrUpdate,
  onCancelBtnClicked,
  isLoading,
  environments,
  currentEnvironment,
}) => {
  const [fields, setFields] = useState(() => ({
    ...selectedConstant,
    environments: [{ label: currentEnvironment.name, value: currentEnvironment.id }],
  }));

  const handleFieldChange = (e) => {
    const { name, value } = e.target;

    const isUpdate = !!selectedConstant;

    const constantValue = isUpdate && name === 'environments' ? [value] : value;

    if (isUpdate && name === 'environments') {
      const constantValueInSelectedValue = allConstants
        .find((constant) => constant.id === selectedConstant.id)
        ?.values?.find((v) => v.id === constantValue[0].value)?.value;

      return setFields((fields) => ({
        ...fields,
        value: constantValueInSelectedValue,
        [name]: constantValue,
      }));
    }

    setFields((fields) => ({
      ...fields,
      [name]: constantValue,
    }));
  };

  const selectOptions = environments.map((env) => ({
    name: env.name,
    value: env.id,
  }));

  const handlecreateOrUpdate = (e) => {
    e.preventDefault();
    const isUpdate = !!selectedConstant;
    createOrUpdate(fields, isUpdate);
  };

  return (
    <div className="variable-form-wrap">
      <div className="card-header">
        <h3 className="card-title">{!selectedConstant ? 'Add new constant' : 'Update constant'}</h3>
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

              <div className="col tj-app-input">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  {selectedConstant ? (
                    <Select
                      options={selectOptions}
                      hasSearch={false}
                      value={fields['environments'][0]['value']}
                      onChange={(value) =>
                        handleFieldChange({ target: { name: 'environments', value: { name: value, value } } })
                      }
                      useMenuPortal={false}
                      customWrap={true}
                    />
                  ) : (
                    <div className={'manage-constants-dropdown'} data-cy="select-search">
                      <Multiselect
                        value={fields['environments']}
                        onChange={(values) => handleFieldChange({ target: { name: 'environments', value: values } })}
                        options={selectOptions}
                        disableSearch={true}
                        overrideStrings={{
                          selectSomeItems: 'Select Environments',
                          allItemsAreSelected: 'All Environments are selected',
                        }}
                      />
                    </div>
                  )}
                </div>
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
          disabled={isLoading}
          data-cy="add-constant-button"
        >
          {!selectedConstant ? 'Add constant' : 'Save'}
        </ButtonSolid>
      </div>
    </div>
  );
};
export default withTranslation()(ConstantForm);
