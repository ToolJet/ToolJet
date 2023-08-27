import React from 'react';
import Select from '@/_ui/Select';
import { withTranslation } from 'react-i18next';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
class VariableForm extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="variable-form-wrap">
        <div className="card-header">
          <h3 className="card-title" data-cy="workspace-variable-form-title">
            {!this.props.selectedVariableId
              ? this.props.t(
                  'header.organization.menus.manageSSO.environmentVar.variableForm.addNewVariable',
                  'Add new variable'
                )
              : this.props.t(
                  'header.organization.menus.manageSSO.environmentVar.variableForm.updatevariable',
                  'Update variable'
                )}
          </h3>
        </div>
        <div className="card-body">
          <form onSubmit={this.props.createOrUpdate} noValidate>
            <div className="form-group mb-3 ">
              <div>
                <div className="col tj-app-input">
                  <label className="form-label" data-cy="workspace-variable-name-label">
                    {this.props.t('header.organization.menus.manageSSO.environmentVar.variableForm.name', 'Name')}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={this.props.t(
                      'header.organization.menus.manageSSO.environmentVar.variableForm.enterVariableName',
                      'Enter Variable Name'
                    )}
                    name="variable_name"
                    onChange={this.props.changeNewVariableOption.bind(this, 'variable_name')}
                    value={this.props.fields['variable_name']}
                    data
                    autoFocus
                    data-cy="workspace-variable-name-input"
                  />
                  <span className="text-danger" data-cy="name-error-text">
                    {this.props.errors['variable_name']}
                  </span>
                </div>
                <div className="col tj-app-input">
                  <label className="form-label" data-cy="workspace-variable-value-label">
                    {this.props.t('header.organization.menus.manageSSO.environmentVar.variableForm.value', 'Value')}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={this.props.t(
                      'header.organization.menus.manageSSO.environmentVar.variableForm.enterValue',
                      'Enter Value'
                    )}
                    name="value"
                    onChange={this.props.changeNewVariableOption.bind(this, 'value')}
                    value={this.props.fields['value']}
                    data-cy="workspace-variable-value-input"
                  />
                  <span className="text-danger" data-cy="value-error-text">
                    {this.props.errors['value']}
                  </span>
                </div>
              </div>
            </div>
            <div className="form-group mb-3 ">
              <div className="row">
                <div className="col">
                  <label className="form-label" data-cy="workspace-variable-type-label">
                    {this.props.t('header.organization.menus.manageSSO.environmentVar.variableForm.type', 'Type')}
                  </label>
                  {this.props.selectedVariableId ? (
                    <span>{this.props.fields['variable_type']}</span>
                  ) : (
                    <Select
                      options={[
                        { name: 'Client', value: 'client' },
                        { name: 'Server', value: 'server' },
                      ]}
                      hasSearch={false}
                      value={this.props.fields['variable_type'] ?? 'client'}
                      onChange={(value) => this.props.handleVariableTypeSelect(value)}
                      useMenuPortal={false}
                      customWrap={true}
                    />
                  )}
                </div>
                <div className="col">
                  <label className="form-label" data-cy="enable-toggle-label">
                    {this.props.t(
                      'header.organization.menus.manageSSO.environmentVar.variableForm.enableEncryption',
                      ' Enable encryption'
                    )}
                  </label>
                  <div className="form-check form-switch encryption-input">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      disabled={
                        this.props.selectedVariableId || this.props.fields['variable_type'] === 'server' ? true : false
                      }
                      data-cy="enable-toggle"
                      onChange={(e) => this.props.handleEncryptionToggle(e)}
                      checked={this.props.fields['variable_type'] === 'server' ? true : this.props.fields['encryption']}
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className="form-footer gap-2 variable-form-footer">
          <ButtonSolid onClick={() => this.props.onCancelBtnClicked()} data-cy="cancel-button" variant="tertiary">
            {this.props.t('globals.cancel', 'Cancel')}
          </ButtonSolid>
          <ButtonSolid
            type="submit"
            onClick={this.props.createOrUpdate}
            isLoading={this.props.addingVar}
            disabled={this.props.addingVar}
            data-cy="add-varable-button"
          >
            {!this.props.selectedVariableId
              ? this.props.t(
                  'header.organization.menus.manageSSO.environmentVar.variableForm.addVariable',
                  'Add variable'
                )
              : this.props.t('globals.save', 'Save')}
          </ButtonSolid>
        </div>
      </div>
    );
  }
}
export default withTranslation()(VariableForm);
