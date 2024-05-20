import React from 'react';
import { authenticationService, orgEnvironmentVariableService } from '@/_services';
import { ConfirmDialog } from '@/_components';
import { toast } from 'react-hot-toast';
import VariablesTable from './VariablesTable';
// eslint-disable-next-line import/no-unresolved
import { withTranslation } from 'react-i18next';
import _ from 'lodash';
import ManageOrgVarsDrawer from './ManageOrgVarsDrawer';
import { Alert } from '@/_ui/Alert/Alert';
import { Button } from '@/_ui/LeftSidebar';
import { useNavigate, useParams } from 'react-router-dom';

function useWorkspaceRouting() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  return { workspaceId, navigate };
}

function withWorkspaceRouting(WrappedComponent) {
  return function (props) {
    const { workspaceId, navigate } = useWorkspaceRouting();
    return <WrappedComponent {...props} workspaceId={workspaceId} navigate={navigate} />;
  };
}
class RawManageOrgVarsComponent extends React.Component {
  constructor(props) {
    super(props);

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
      isManageVarDrawerOpen: false,
    };

    this.tableRef = React.createRef(null);
  }

  componentDidMount() {
    this.fetchVariables();
  }

  onEditBtnClicked = (variable) => {
    this.setState({
      showVariableForm: true,
      isManageVarDrawerOpen: true,
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
      isManageVarDrawerOpen: false,
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
      const variables = _.cloneDeep(data.variables)?.filter(({ variable_name }) => !/copilot_/.test(variable_name));
      this.setState({
        variables: variables,
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
              isManageVarDrawerOpen: false,
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
              isManageVarDrawerOpen: false,
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
      this.setState({ addingVar: false, showVariableForm: true, isManageVarDrawerOpen: true });
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

  canDeleteVariable = () => {
    return this.canAnyGroupPerformAction(
      'org_environment_variable_delete',
      authenticationService.currentSessionValue.group_permissions
    );
  };
  setIsManageVarDrawerOpen = (val) => {
    this.setState({ isManageVarDrawerOpen: val });
  };

  goToOrgConstantsDashboard = () => {
    const { workspaceId, navigate } = this.props;
    navigate(`/${workspaceId}/workspace-constants`);
  };

  render() {
    const { isLoading, addingVar, variables, isManageVarDrawerOpen } = this.state;

    const renderDeprecationText =
      variables?.length > 0 ? (
        <div class="text-muted">
          Workspace variables will no longer be supported after April 30, 2024. To maintain optimal performance, please
          make the switch to Workspace constants
        </div>
      ) : (
        <div className="text-muted">
          Can&apos;t add or edit workspace variables as we are deprecating them soon. Please use Workspace constant
          instead.
        </div>
      );

    return (
      <div className="wrapper org-variables-page animation-fade">
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
            <div>
              <div className="row align-items-center ">
                <div className="workspace-variable-header mb-3">
                  <Alert svg="tj-info-warning" cls="workspace-variables-alert-banner" useDarkMode={false}>
                    <div className="d-flex align-items-center">
                      {renderDeprecationText}
                      <div>
                        <Button
                          onClick={this.goToOrgConstantsDashboard}
                          darkMode={this.props.darkMode}
                          size="sm"
                          styles={{
                            width: '100%',
                            fontSize: '12px',
                            fontWeight: 500,
                          }}
                        >
                          <Button.Content
                            iconSrc="assets/images/icons/arrow-right.svg"
                            title={'Go to workspace constants'}
                            direction="right"
                          />
                        </Button>
                      </div>
                    </div>
                  </Alert>
                </div>
              </div>
            </div>
          </div>

          <div className="workspace-variable-container-wrap">
            {isManageVarDrawerOpen ? (
              <ManageOrgVarsDrawer
                isManageVarDrawerOpen={this.state.isManageVarDrawerOpen}
                setIsManageVarDrawerOpen={this.setIsManageVarDrawerOpen}
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
                {variables?.length > 0 && (
                  <VariablesTable
                    isLoading={isLoading}
                    variables={variables}
                    canDeleteVariable={this.canDeleteVariable()}
                    onEditBtnClicked={this.onEditBtnClicked}
                    onDeleteBtnClicked={this.onDeleteBtnClicked}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
}

const ManageOrgVarsComponent = withWorkspaceRouting(RawManageOrgVarsComponent);

export const ManageOrgVars = withTranslation()(ManageOrgVarsComponent);
