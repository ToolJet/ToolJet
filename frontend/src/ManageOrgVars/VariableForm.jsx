import React from 'react';
import Select from '@/_ui/Select';
import { withTranslation } from 'react-i18next';
class VariableForm extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="container-xl">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
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
                <div className="row">
                  <div className="col">
                    <label className="form-label">
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
                    />
                    <span className="text-danger">{this.props.errors['variable_name']}</span>
                  </div>
                  <div className="col">
                    <label className="form-label">
                      {' '}
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
                    />
                    <span className="text-danger">{this.props.errors['value']}</span>
                  </div>
                </div>
              </div>
              <div className="form-group mb-3 ">
                <div className="row">
                  <div className="col">
                    <label className="form-label">
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
                      />
                    )}
                  </div>
                  <div className="col">
                    <label className="form-label">
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
                          this.props.selectedVariableId || this.props.fields['variable_type'] === 'server'
                            ? true
                            : false
                        }
                        onChange={(e) => this.props.handleEncryptionToggle(e)}
                        checked={
                          this.props.fields['variable_type'] === 'server' ? true : this.props.fields['encryption']
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="form-footer">
                <button type="button" className="btn btn-light mr-2" onClick={() => this.props.onCancelBtnClicked()}>
                  {this.props.t('globals.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className={`btn mx-2 btn-primary ${this.props.addingVar ? 'btn-loading' : ''}`}
                  disabled={this.props.addingVar}
                >
                  {!this.props.selectedVariableId
                    ? this.props.t(
                        'header.organization.menus.manageSSO.environmentVar.variableForm.addVariable',
                        'Add variable'
                      )
                    : this.props.t('globals.save', 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
}
export default withTranslation()(VariableForm);
