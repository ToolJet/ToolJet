import React from 'react';
import { authenticationService, organizationService, organizationUserService } from '@/_services';
import { Header } from '@/_components';
import { toast } from 'react-hot-toast';
import { history } from '@/_helpers';
import ReactTooltip from 'react-tooltip';

class ManageOrgVars extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentUser: authenticationService.currentUserValue,
      isLoading: true,
      showNewVariableForm: false,
      addingVar: false,
      newVariable: {},
      fields: {
        encryption: false,
      },
      errors: {},
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

    organizationService.getUsers(null).then((data) =>
      this.setState({
        variables: data.users,
        isLoading: false,
      })
    );
  };

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

  addNewVariable = (event) => {
    event.preventDefault();

    if (this.handleValidation()) {
      let fields = {};
      Object.keys(this.state.fields).map((key) => {
        fields[key] = '';
      });

      this.setState({
        addingVar: true,
      });

      organizationUserService
        .create(
          this.state.fields.firstName,
          this.state.fields.lastName,
          this.state.fields.email,
          this.state.fields.role
        )
        .then(() => {
          toast.success('User has been created', {
            position: 'top-center',
          });
          this.fetchUsers();
          this.setState({
            addingVar: false,
            showNewVariableForm: false,
            fields: fields,
          });
        })
        .catch(({ error }) => {
          toast.error(error, { position: 'top-center' });
          this.setState({ addingVar: false });
        });
    } else {
      this.setState({ addingVar: false, showNewVariableForm: true });
    }
  };

  updateVariable = () => {
    this.setState({
      isLoading: true,
    });
  };

  deleteVariable = () => {
    this.setState({
      isLoading: true,
    });
  };

  logout = () => {
    authenticationService.logout();
    history.push('/login');
  };

  render() {
    const { isLoading, showNewVariableForm, addingVar, variables } = this.state;
    return (
      <div className="wrapper org-variables-page">
        <Header switchDarkMode={this.props.switchDarkMode} darkMode={this.props.darkMode} />
        <ReactTooltip type="dark" effect="solid" delayShow={250} />

        <div className="page-wrapper">
          <div className="container-xl">
            <div className="page-header d-print-none">
              <div className="row align-items-center">
                <div className="col">
                  <div className="page-pretitle"></div>
                  <h2 className="page-title">Environment Variables</h2>
                </div>
                <div className="col-auto ms-auto d-print-none">
                  {!showNewVariableForm && (
                    <div className="btn btn-primary" onClick={() => this.setState({ showNewVariableForm: true })}>
                      Add new variable
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="page-body">
            {showNewVariableForm && (
              <div className="container-xl">
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Add new variable</h3>
                  </div>
                  <div className="card-body">
                    <form onSubmit={this.addNewVariable} noValidate>
                      <div className="form-group mb-3 ">
                        <div className="row">
                          <div className="col">
                            <label className="form-label">Name</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Enter Variable Name"
                              name="variableName"
                              onChange={this.changeNewVariableOption.bind(this, 'variableName')}
                              value={this.state.fields['variableName']}
                            />
                            <span className="text-danger">{this.state.errors['variableName']}</span>
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
                              showNewVariableForm: false,
                              newVariable: {},
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
                          Create variable
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {!showNewVariableForm && (
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
                                <span>{variable.name}</span>
                              </td>
                              <td className="text-muted">
                                <a className="text-reset user-email">{variable.email}</a>
                              </td>
                              <td className="text-muted">
                                <small className="user-status">{variable.status}</small>
                              </td>
                              <td>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 5 }}>
                                  <button className="btn btn-sm" onClick={() => this.updateVariable()}>
                                    <div>
                                      <img
                                        data-tip="Copy invitation link"
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
                                  <button className="btn btn-sm" onClick={() => this.deleteVariable()}>
                                    <div>
                                      <img src="/assets/images/icons/query-trash-icon.svg" width="12" height="12" />
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
