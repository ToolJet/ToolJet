import React from 'react';
import Select from '@/_ui/Select';

export default class VariableForm extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="container-xl">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{!this.props.selectedVariableId ? 'Add new variable' : 'Update variable'}</h3>
          </div>
          <div className="card-body">
            <form onSubmit={this.props.createOrUpdate} noValidate>
              <div className="form-group mb-3 ">
                <div className="row">
                  <div className="col">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Variable Name"
                      name="variable_name"
                      onChange={this.props.changeNewVariableOption.bind(this, 'variable_name')}
                      value={this.props.fields['variable_name']}
                    />
                    <span className="text-danger">{this.props.errors['variable_name']}</span>
                  </div>
                  <div className="col">
                    <label className="form-label">Value</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Value"
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
                    <label className="form-label">Type</label>
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
                    <label className="form-check form-switch">
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
                      <span className="form-check-label">Enable encryption</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="form-footer">
                <button type="button" className="btn btn-light mr-2" onClick={() => this.props.onCancelBtnClicked()}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn mx-2 btn-primary ${this.props.addingVar ? 'btn-loading' : ''}`}
                  disabled={this.props.addingVar}
                >
                  {!this.props.selectedVariableId ? 'Add variable' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
}
