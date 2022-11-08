import React from 'react';
import { authenticationService, orgEnvironmentVariableService } from '@/_services';
import { Header, ConfirmDialog } from '@/_components';
import { toast } from 'react-hot-toast';
import ReactTooltip from 'react-tooltip';
import VariableForm from './VariableForm';
import VariablesTable from './VariablesTable';
import { withTranslation } from 'react-i18next';
class ManageOrgVarsComponent extends React.Component {
  constructor(props) {
    super(props);
    this.currentUser = authenticationService.currentUserValue;

    this.state = {
      isLoading: true,
      showVariableForm: false,
      selectedVariableId: null,
      addingVar: false,
      newVariable: {},
      fields: {
        encryption: false,
        variable_type: 'client',
      },
      errors: {},
      showVariableDeleteConfirmation: false,
    };

    this.tableRef = React.createRef(null);
  }

  componentDidMount() {
    this.fetchVariables();
  }

  onEditBtnClicked = (variable) => {
    this.setState({
      showVariableForm: true,
      errors: {},
      fields: {
        ...variable,
        encryption: variable.encrypted,
      },
      selectedVariableId: variable.id,
    });
  };

  onCreationFailed() {
    this.setState({ addingVar: false });
  }

  onCancelBtnClicked = () => {
    this.setState({
      showVariableForm: false,
      newVariable: {},
      fields: { encryption: false, variable_type: 'client' },
      selectedVariableId: null,
    });
  };

  onDeleteBtnClicked = (variable) => {
    this.setState({
      selectedVariableId: variable.id,
      showVariableDeleteConfirmation: true,
    });
  };

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

    const fields = {};
    Object.keys(this.state.fields).map((key) => {
      fields[key] = '';
    });
    fields['encryption'] = false;
    fields['variable_type'] = 'client';

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
            this.onCreationFailed();
          });
      } else {
        orgEnvironmentVariableService
          .create(
            this.state.fields.variable_name,
            this.state.fields.value,
            this.state.fields.variable_type,
            this.state.fields.encryption
          )
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
            this.onCreationFailed();
          });
      }
    } else {
      this.setState({ addingVar: false, showVariableForm: true });
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
          fields: {
            encryption: false,
            variable_type: 'client',
          },
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

  handleVariableTypeSelect = (value) => {
    const fields = this.state.fields;
    fields['variable_type'] = value;

    this.setState({
      fields,
    });
  };

  canAnyGroupPerformAction(action, permissions) {
    if (!permissions) {
      return false;
    }

    return permissions.some((p) => p[action]);
  }

  canCreateVariable = () => {
    return this.canAnyGroupPerformAction('org_environment_variable_create', this.currentUser.group_permissions);
  };

  canUpdateVariable = () => {
    return this.canAnyGroupPerformAction('org_environment_variable_update', this.currentUser.group_permissions);
  };

  canDeleteVariable = () => {
    return this.canAnyGroupPerformAction('org_environment_variable_delete', this.currentUser.group_permissions);
  };

  render() {
    const { isLoading, showVariableForm, addingVar, variables } = this.state;
    return (
      <div className="wrapper org-variables-page">
        <Header switchDarkMode={this.props.switchDarkMode} darkMode={this.props.darkMode} />
        <ReactTooltip type="dark" effect="solid" delayShow={250} />

        <ConfirmDialog
          show={this.state.showVariableDeleteConfirmation}
          message={this.props.t(
            'header.organization.menus.manageSSO.environmentVar.envWillBeDeleted',
            'Variable will be deleted, do you want to continue?'
          )}
          onConfirm={() => {
            this.deleteVariable(this.state.selectedVariableId);
          }}
          onCancel={() =>
            this.setState({
              selectedVariableId: null,
              showVariableDeleteConfirmation: false,
            })
          }
          darkMode={this.props.darkMode}
        />

        <div className="page-wrapper">
          <div className="container-xl">
            <div className="page-header d-print-none">
              <div className="row align-items-center">
                <div className="col">
                  <div className="page-pretitle"></div>
                  <h2 className="page-title">{this.props.t('globals.environmentVar', 'Workspace Variables')}</h2>
                </div>
                <div className="col-auto ms-auto d-print-none">
                  {!showVariableForm && this.canCreateVariable() && (
                    <div
                      className="btn btn-primary"
                      onClick={() => this.setState({ showVariableForm: true, errors: {} })}
                    >
                      {this.props.t(
                        'header.organization.menus.manageSSO.environmentVar.addNewVariable',
                        'Add new variable'
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="page-body">
            {showVariableForm ? (
              <VariableForm
                fields={this.state.fields}
                errors={this.state.errors}
                selectedVariableId={this.state.selectedVariableId}
                createOrUpdate={this.createOrUpdate}
                changeNewVariableOption={this.changeNewVariableOption}
                handleEncryptionToggle={this.handleEncryptionToggle}
                handleVariableTypeSelect={this.handleVariableTypeSelect}
                onCancelBtnClicked={this.onCancelBtnClicked}
                addingVar={addingVar}
              />
            ) : (
              <>
                {variables?.length > 0 ? (
                  <VariablesTable
                    isLoading={isLoading}
                    variables={variables}
                    canUpdateVariable={this.canUpdateVariable()}
                    canDeleteVariable={this.canDeleteVariable()}
                    admin={this.currentUser.admin}
                    onEditBtnClicked={this.onEditBtnClicked}
                    onDeleteBtnClicked={this.onDeleteBtnClicked}
                  />
                ) : (
                  <span className="no-vars-text">
                    {this.props.t(
                      'header.organization.menus.manageSSO.environmentVar.noEnvConfig',
                      `You haven't configured any environment variables, press the 'Add new variable' button to create one`
                    )}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export const ManageOrgVars = withTranslation()(ManageOrgVarsComponent);
