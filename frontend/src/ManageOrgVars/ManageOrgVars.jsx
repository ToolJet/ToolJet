import React from 'react';
import { authenticationService, orgEnvironmentVariableService } from '@/_services';
import { Header, ConfirmDialog } from '@/_components';
import { toast } from 'react-hot-toast';
import { history } from '@/_helpers';
import ReactTooltip from 'react-tooltip';

class ManageOrgVars extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentUser: authenticationService.currentUserValue,
      isLoading: true,
      showVariableForm: false,
      selectedVariableId: null,
      addingVar: false,
      newVariable: {},
      fields: {
        encryption: false,
      },
      errors: {},
      showVariableDeleteConfirmation: false,
    };

    this.tableRef = React.createRef(null);
  }

  componentDidMount() {
    this.fetchVariables();
  }

  calculateOffset() {
    const elementHeight = this.tableRef.current.getBoundingClientRect().top;
    return window.innerHeight - elementHeight;
  }

  fetchVariables = () => {
    this.setState({
      isLoading: true,
    });

    orgEnvironmentVariableService.getVariables().then((data) => {
      this.setState({
        variables: data.variables,
        isLoading: false,
      });
    });
  };

  handleValidation() {
    let fields = this.state.fields;
    let errors = {};
    //variable name
    if (!fields['variable_name']) {
      errors['variable_name'] = 'Variable name is required';
    }
    //variable value
    if (!fields['value']) {
      errors['value'] = 'Value is required';
    }
    this.setState({ errors: errors });
    return Object.keys(errors).length === 0;
  }

  handleEncryptionToggle = (event) => {
    let fields = this.state.fields;
    fields['encryption'] = event.target.checked;

    this.setState({
      fields,
    });
  };

  changeNewVariableOption = (name, e) => {
    let fields = this.state.fields;
    fields[name] = e.target.value;

    this.setState({
      fields,
    });
  };

  createOrUpdate = (event) => {
    event.preventDefault();

    let fields = {};
    Object.keys(this.state.fields).map((key) => {
      fields[key] = '';
    });
    fields['encryption'] = false;

    this.setState({
      addingVar: true,
    });

    if (this.handleValidation()) {
      if (this.state.selectedVariableId) {
        orgEnvironmentVariableService
          .update(this.state.selectedVariableId, this.state.fields.variable_name, this.state.fields.value)
          .then(() => {
            toast.success('Variable has been updated', {
              position: 'top-center',
            });
            this.fetchVariables();
            this.setState({
              addingVar: false,
              showVariableForm: false,
              fields: fields,
              selectedVariableId: null,
            });
          })
          .catch(({ error }) => {
            toast.error(error, { position: 'top-center' });
            this.setState({ addingVar: false, selectedVariableId: null });
          });
      } else {
        orgEnvironmentVariableService
          .create(this.state.fields.variable_name, this.state.fields.value, this.state.fields.encryption)
          .then(() => {
            toast.success('Variable has been created', {
              position: 'top-center',
            });
            this.fetchVariables();
            this.setState({
              addingVar: false,
              showVariableForm: false,
              fields: fields,
              selectedVariableId: null,
            });
          })
          .catch(({ error }) => {
            toast.error(error, { position: 'top-center' });
            this.setState({ addingVar: false, selectedVariableId: null });
          });
      }
    } else {
      this.setState({ addingVar: false, showVariableForm: true, selectedVariableId: null });
    }
  };

  deleteVariable = (id) => {
    this.setState({
      isLoading: true,
      showVariableDeleteConfirmation: false,
      selectedVariableId: null,
    });
    orgEnvironmentVariableService
      .deleteVariable(id)
      .then(() => {
        toast.success('The variable has been deleted', {
          position: 'top-center',
        });
        this.setState({
          isLoading: false,
        });
        this.fetchVariables();
      })
      .catch(({ error }) => {
        toast.error(error, { position: 'top-center' });
        this.setState({
          isLoading: false,
        });
      });
  };

  logout = () => {
    authenticationService.logout();
    history.push('/login');
  };

  render() {
    const { isLoading, showVariableForm, addingVar, variables } = this.state;
    return (
      <div className="wrapper org-variables-page">
        <Header switchDarkMode={this.props.switchDarkMode} darkMode={this.props.darkMode} />
        <ReactTooltip type="dark" effect="solid" delayShow={250} />

        <ConfirmDialog
          show={this.state.showVariableDeleteConfirmation}
          message={'Variable will be deleted, do you want to continue?'}
          onConfirm={() => {
            this.deleteVariable(this.state.selectedVariableId);
          }}
          onCancel={() =>
            this.setState({
              selectedVariableId: null,
              showVariableDeleteConfirmation: false,
            })
          }
        />

        <div className="page-wrapper">
          <div className="container-xl">
            <div className="page-header d-print-none">
              <div className="row align-items-center">
                <div className="col">
                  <div className="page-pretitle"></div>
                  <h2 className="page-title">Environment Variables</h2>
                </div>
                <div className="col-auto ms-auto d-print-none">
                  {!showVariableForm && (
                    <div className="btn btn-primary" onClick={() => this.setState({ showVariableForm: true })}>
                      Add new variable
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="page-body">
            {showVariableForm && (
              <div className="container-xl">
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">
                      {!this.state.selectedVariableId ? 'Add new variable' : 'Update variable'}
                    </h3>
                  </div>
                  <div className="card-body">
                    <form onSubmit={this.createOrUpdate} noValidate>
                      <div className="form-group mb-3 ">
                        <div className="row">
                          <div className="col">
                            <label className="form-label">Name</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Enter Variable Name"
                              name="variable_name"
                              onChange={this.changeNewVariableOption.bind(this, 'variable_name')}
                              value={this.state.fields['variable_name']}
                            />
                            <span className="text-danger">{this.state.errors['variable_name']}</span>
                          </div>
                          <div className="col">
                            <label className="form-label">Value</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Enter Value"
                              name="value"
                              onChange={this.changeNewVariableOption.bind(this, 'value')}
                              value={this.state.fields['value']}
                            />
                            <span className="text-danger">{this.state.errors['value']}</span>
                          </div>
                        </div>
                      </div>
                      <div className="form-group mb-3 ">
                        <label className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            disabled={this.state.selectedVariableId ? true : false}
                            onChange={(e) => this.handleEncryptionToggle(e)}
                            checked={this.state.fields['encryption']}
                          />
                          <span className="form-check-label">Enable encryption</span>
                        </label>
                      </div>
                      <div className="form-footer">
                        <button
                          type="button"
                          className="btn btn-light mr-2"
                          onClick={() =>
                            this.setState({
                              showVariableForm: false,
                              newVariable: {},
                              fields: { encryption: false },
                              selectedVariableId: null,
                            })
                          }
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className={`btn mx-2 btn-primary ${addingVar ? 'btn-loading' : ''}`}
                          disabled={addingVar}
                        >
                          {!this.state.selectedVariableId ? 'Create variable ' : 'Save'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {!showVariableForm && (
              <div className="container-xl">
                <div className="card">
                  <div
                    className="card-table fixedHeader table-responsive table-bordered"
                    ref={this.tableRef}
                    style={{ maxHeight: this.tableRef.current && this.calculateOffset() }}
                  >
                    <table data-testid="variablesTable" className="table table-vcenter" disabled={true}>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Value</th>
                          <th>Encrypted</th>
                          <th className="w-1"></th>
                        </tr>
                      </thead>
                      {isLoading ? (
                        <tbody className="w-100" style={{ minHeight: '300px' }}>
                          {Array.from(Array(4)).map((_item, index) => (
                            <tr key={index}>
                              <td className="col-4 p-3">
                                <div className="skeleton-line w-10"></div>
                              </td>
                              <td className="col-2 p-3">
                                <div className="skeleton-line"></div>
                              </td>
                              <td className="text-muted col-auto col-1 pt-3">
                                <div className="skeleton-line"></div>
                              </td>
                              <td className="text-muted col-auto col-1 pt-3">
                                <div className="skeleton-line"></div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      ) : (
                        <tbody>
                          {variables.map((variable) => (
                            <tr key={variable.id}>
                              <td>
                                <span>{variable.variable_name}</span>
                              </td>
                              <td className="text-muted">
                                <a className="text-reset user-email">{variable.value}</a>
                              </td>
                              <td className="text-muted">
                                <small className="user-status">{variable.encrypted.toString()}</small>
                              </td>
                              <td>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 5 }}>
                                  <button
                                    className="btn btn-sm btn-org-env"
                                    onClick={() =>
                                      this.setState({
                                        showVariableForm: true,
                                        fields: {
                                          ...variable,
                                          encryption: variable.encrypted,
                                        },
                                        selectedVariableId: variable.id,
                                      })
                                    }
                                  >
                                    <div>
                                      <img
                                        data-tip="Update"
                                        className="svg-icon"
                                        src="/assets/images/icons/edit.svg"
                                        width="15"
                                        height="15"
                                        style={{
                                          cursor: 'pointer',
                                        }}
                                      ></img>
                                    </div>
                                  </button>
                                  <button
                                    className="btn btn-sm btn-org-env"
                                    onClick={() =>
                                      this.setState({
                                        selectedVariableId: variable.id,
                                        showVariableDeleteConfirmation: true,
                                      })
                                    }
                                  >
                                    <div>
                                      <img
                                        data-tip="Delete"
                                        className="svg-icon"
                                        src="/assets/images/icons/query-trash-icon.svg"
                                        width="15"
                                        height="15"
                                        style={{
                                          cursor: 'pointer',
                                        }}
                                      />
                                    </div>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      )}
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export { ManageOrgVars };
