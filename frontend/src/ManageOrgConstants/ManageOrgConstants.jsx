import React, { useEffect, useState } from 'react';
import { authenticationService, orgEnvironmentConstantService, appEnvironmentService } from '@/_services';
import { ConfirmDialog } from '@/_components';
import { toast } from 'react-hot-toast';
import { capitalize } from 'lodash';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { Alert } from '../_ui/Alert/Alert';
import { Button } from '@/_ui/LeftSidebar';
import ConstantTable from './ConstantTable';
import Pagination from '@/_ui/Pagination';
import Drawer from '@/_ui/Drawer';
import ConstantForm from './ConstantForm';
import EmptyState from './EmptyState';
import FolderList from '@/_ui/FolderList/FolderList';

const MODES = Object.freeze({
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  NULL: null,
});

const ManageOrgConstantsComponent = ({ darkMode }) => {
  const [isManageVarDrawerOpen, setIsManageVarDrawerOpen] = useState(false);
  const [constants, setConstants] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [activeTabEnvironment, setActiveTabEnvironment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [mode, setMode] = useState(MODES.NULL);

  const perPage = 7;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentTableData, setTableData] = useState([]);

  const [errors, setErrors] = useState([]);
  const [showConstantDeleteConfirmation, setShowConstantDeleteConfirmation] = useState(false);
  const [selectedConstant, setSelectedConstant] = useState(null);

  const onCancelBtnClicked = () => {
    setSelectedConstant(null);
    setIsManageVarDrawerOpen(false);
    setMode(MODES.NULL);
  };

  const onEditBtnClicked = (constant) => {
    setMode(MODES.EDIT);
    setSelectedConstant(constant);
    setIsManageVarDrawerOpen(true);
  };

  const onDeleteBtnClicked = (constant) => {
    setMode(MODES.DELETE);
    setSelectedConstant(constant);
    setShowConstantDeleteConfirmation(true);
  };

  const computeTotalPages = (totalItems) => {
    const totalPages = Math.ceil(totalItems / perPage);
    setTotalPages(totalPages);
  };

  const updateActiveEnvironmentTab = (environment, allConstants = []) => {
    if (!activeTabEnvironment) {
      setActiveTabEnvironment(environment);
    }
    setCurrentPage(1);

    const envName = activeTabEnvironment ? activeTabEnvironment.name : environment.name;
    updateTableData(allConstants, envName, 0, perPage, true);
  };

  const updateTableData = (orgContants, envName, start, end, activeTabChanged = false) => {
    const constantsForEnvironment = orgContants
      .filter((constant) => {
        const envConstant = constant?.values.find((value) => value.environmentName === envName);

        return envConstant && envConstant.value !== '';
      })
      .map((constant) => {
        return {
          id: constant.id,
          name: constant.name,
          value: findValueForEnvironment(constant.values, envName),
        };
      });

    if (activeTabChanged) {
      computeTotalPages(constantsForEnvironment.length);
    }

    const envConstantants = constantsForEnvironment.slice(start, end);

    setTableData(envConstantants);
  };

  const goToNextPage = () => {
    setCurrentPage(currentPage + 1);

    const start = (currentPage + 1 - 1) * perPage;
    const end = start + perPage;

    const envName = activeTabEnvironment.name;
    updateTableData(constants, envName, start, end);
  };

  const goToPreviousPage = () => {
    setCurrentPage(currentPage - 1);

    const start = (currentPage - 1 - 1) * perPage;
    const end = start + perPage;

    const envName = activeTabEnvironment.name;
    updateTableData(constants, envName, start, end);
  };

  const canAnyGroupPerformAction = (action, permissions) => {
    if (!permissions) {
      return false;
    }

    return permissions.some((p) => p[action]);
  };

  const canCreateVariable = () => {
    return canAnyGroupPerformAction(
      'org_environment_constant_create',
      authenticationService.currentSessionValue.group_permissions
    );
  };

  const canUpdateVariable = () => {
    return canAnyGroupPerformAction(
      'org_environment_constant_create',
      authenticationService.currentSessionValue.group_permissions
    );
  };

  const canDeleteVariable = () => {
    return canAnyGroupPerformAction(
      'org_environment_constant_delete',
      authenticationService.currentSessionValue.group_permissions
    );
  };

  const fetchEnvironments = () => {
    return new Promise((resolve, reject) => {
      appEnvironmentService
        .getAllEnvironments()
        .then((response) => {
          resolve(response);
        })
        .catch(({ error }) => {
          if (error === 'You do not have permissions to perform this action') {
            resolve({
              environments: [
                {
                  id: 1,
                  name: 'production',
                  is_default: true,
                },
              ],
            });
          }

          reject(error);
        });
    });
  };

  const fetchConstantsAndEnvironments = async () => {
    const orgConstants = await orgEnvironmentConstantService.getAll();

    if (orgConstants?.constants?.length > 1) {
      orgConstants.constants.sort((a, b) => {
        return new Date(b.createdAt).getTime().toString().localeCompare(new Date(a.createdAt).getTime().toString());
      });
    }

    setConstants(orgConstants?.constants);

    let orgEnvironments = await fetchEnvironments();
    setEnvironments(orgEnvironments?.environments);
    const currentEnvironment = orgEnvironments?.environments?.find((env) => env?.is_default === true);
    updateActiveEnvironmentTab(currentEnvironment, orgConstants?.constants);

    setIsLoading(false);
    setSelectedConstant(null);
  };

  const checkIfConstantNameExists = (name, environementId) => {
    if (!environementId) {
      return constants.some((constant) => constant.name === name);
    }

    const envConstants = constants.filter((constant) => {
      return constant.values.some((value) => value.id === environementId && value.value !== '');
    });

    return envConstants.some((constant) => constant.name === name);
  };

  const createOrUpdate = (variable, shouldUpdate = false) => {
    const currentEnv = activeTabEnvironment;

    const constantExistsInDiffEnv = checkIfConstantNameExists(variable.name);
    const shouldUpdateConstant = mode === 'edit' && shouldUpdate ? true : constantExistsInDiffEnv;

    if (shouldUpdateConstant) {
      const variableId = constantExistsInDiffEnv
        ? constants.find((constant) => constant.name === variable.name).id
        : variable.id;

      return orgEnvironmentConstantService
        .update(variableId, variable.value, currentEnv['id'])
        .then(() => {
          toast.success('Constant updated successfully');
          onCancelBtnClicked();
        })
        .catch(({ error }) => {
          setErrors(error);
          toast.error(error);
        })
        .finally(() => fetchConstantsAndEnvironments());
    }

    return orgEnvironmentConstantService
      .create(variable.name, variable.value, [currentEnv['id']])
      .then(() => {
        toast.success('Constant has been created');
        onCancelBtnClicked();
      })
      .catch(({ error }) => {
        setErrors(error);
        toast.error('Constant could not be created');
      })
      .finally(() => fetchConstantsAndEnvironments());
  };

  const handleOnCancelDelete = () => {
    setShowConstantDeleteConfirmation(false);
    setSelectedConstant(null);
    setMode(MODES.NULL);
  };

  const handleExecuteDelete = () => {
    setShowConstantDeleteConfirmation(false);

    return orgEnvironmentConstantService
      .remove(selectedConstant.id, activeTabEnvironment.id)
      .then(() => {
        toast.success('Constant deleted successfully');
        setSelectedConstant(null);
        setMode(MODES.NULL);
      })
      .catch(({ error }) => {
        toast.error(error);
      })
      .finally(() => fetchConstantsAndEnvironments());
  };

  const findValueForEnvironment = (constantValues, environmentName) => {
    if (!Array.isArray(constantValues)) return;

    const value = constantValues?.find((value) => value.environmentName === environmentName);
    return value?.value;
  };

  useEffect(() => {
    fetchConstantsAndEnvironments(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (constants.length > 0 && environments.length > 0) {
      updateActiveEnvironmentTab(activeTabEnvironment, constants);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabEnvironment]);

  const confirmMessage = (
    <span>
      Are you sure you want to delete <b>{selectedConstant?.name}</b> from <b>{activeTabEnvironment?.name}</b>?
    </span>
  );
  return (
    <div className="wrapper org-constant-page org-variables-page animation-fade">
      <ConfirmDialog
        show={showConstantDeleteConfirmation}
        message={confirmMessage}
        onConfirm={handleExecuteDelete}
        onCancel={handleOnCancelDelete}
        darkMode={darkMode}
      />

      {isManageVarDrawerOpen && (
        <Drawer disableFocus={true} isOpen={isManageVarDrawerOpen} onClose={onCancelBtnClicked} position="right">
          <ConstantForm
            errors={errors}
            selectedConstant={selectedConstant}
            createOrUpdate={createOrUpdate}
            onCancelBtnClicked={onCancelBtnClicked}
            isLoading={isLoading}
            currentEnvironment={activeTabEnvironment}
            checkIfConstantNameExists={checkIfConstantNameExists}
            mode={mode}
          />
        </Drawer>
      )}

      <div className="page-wrapper">
        <div className="container-xl">
          <div>
            <div className="page-header workspace-constant-header">
              <div className="tj-text-sm font-weight-500">{constants.length} constants</div>
              <div className="mt-3">
                <Alert svg="tj-info">
                  <div
                    className="d-flex align-items-center"
                    style={{
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      width: '100%',
                    }}
                  >
                    <div class="text-muted">
                      To resolve a Workspace constant use{' '}
                      <strong style={{ fontWeight: 500, color: '#3E63DD' }}>{'{{constants.access_token}}'}</strong>
                    </div>
                    <div>
                      <Button
                        // Todo: Update link to documentation: workspace constants
                        onClick={() =>
                          window.open('https://docs.tooljet.com/docs/tutorial/workspace-variables', '_blank')
                        }
                        darkMode={darkMode}
                        size="sm"
                        styles={{
                          width: '100%',
                          fontSize: '12px',
                          fontWeight: 500,
                        }}
                      >
                        <Button.Content title={'Read Documentation'} iconSrc="assets/images/icons/student.svg" />
                      </Button>
                    </div>
                  </div>
                </Alert>
              </div>
            </div>
          </div>
        </div>

        <div className="workspace-variable-container-wrap mt-2">
          <div className="container-xl">
            <div className="workspace-constant-table-card">
              <div className="manage-sso-container h-100">
                <div className="d-flex manage-sso-wrapper-card h-100">
                  <ManageOrgConstantsComponent.EnvironmentsTabs
                    allEnvironments={environments}
                    currentEnvironment={activeTabEnvironment}
                    setActiveTabEnvironment={setActiveTabEnvironment}
                    isLoading={isLoading}
                    allConstants={constants}
                  />
                  {constants.length > 0 ? (
                    <div className="w-100 workspace-constant-card-body">
                      <div className="align-items-center d-flex p-3 justify-content-between">
                        <div className="tj-text-sm font-weight-500">{capitalize(activeTabEnvironment?.name)}</div>
                        <div className="workspace-setting-buttons-wrap">
                          {canCreateVariable() && (
                            <ButtonSolid
                              data-cy="add-new-constant-button"
                              vaiant="primary"
                              onClick={() => {
                                setMode(MODES.CREATE);
                                setIsManageVarDrawerOpen(true);
                              }}
                              className="add-new-constant-button"
                              customStyles={{ minWidth: '200px', height: '32px' }}
                              disabled={isManageVarDrawerOpen}
                            >
                              Create new constant
                            </ButtonSolid>
                          )}
                        </div>
                      </div>
                      <ConstantTable
                        constants={currentTableData}
                        onEditBtnClicked={onEditBtnClicked}
                        onDeleteBtnClicked={onDeleteBtnClicked}
                        isLoading={isLoading}
                        canUpdateDeleteConstant={canUpdateVariable() || canDeleteVariable()}
                      />
                      <ManageOrgConstantsComponent.Footer
                        darkMode={darkMode}
                        totalPage={totalPages}
                        pageCount={currentPage}
                        dataLoading={false}
                        gotoNextPage={goToNextPage}
                        gotoPreviousPage={goToPreviousPage}
                        showPagination={constants.length > 0}
                      />
                    </div>
                  ) : (
                    <EmptyState
                      canCreateVariable={canCreateVariable()}
                      setIsManageVarDrawerOpen={setIsManageVarDrawerOpen}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RenderEnvironmentsTab = ({
  allEnvironments = [],
  currentEnvironment = {},
  setActiveTabEnvironment,
  isLoading,
  allConstants,
}) => {
  if (!currentEnvironment || allEnvironments.length <= 1) return null;

  const constantCount = (constants, envId) => {
    const envConstant = constants
      .map((constant) => constant.values.filter((v) => v.id === envId && v.value !== ''))
      .filter((constantValues) => constantValues.length > 0);

    const finalEnvConstant = envConstant.length > 0 ? envConstant : null;

    if (!finalEnvConstant) return 0;

    return finalEnvConstant.length;
  };

  const updateCurrentEnvironment = (env) => {
    const selectedEnv = allEnvironments.find((e) => e.id === env.id);
    setActiveTabEnvironment(selectedEnv);
  };

  const menuItems = allEnvironments.map((env) => ({
    id: env.id,
    label: `${capitalize(env.name)} (${constantCount(allConstants, env?.id)})`,
  }));

  return (
    <div className="left-menu">
      <ul data-cy="left-menu-items tj-text-xsm">
        {menuItems.map((item, index) => {
          return (
            <FolderList
              onClick={() => updateCurrentEnvironment(item)}
              key={index}
              selectedItem={currentEnvironment.id === item.id}
              items={menuItems}
              isLoading={isLoading}
            >
              {item.label}
            </FolderList>
          );
        })}
      </ul>
    </div>
  );
};

const Footer = ({ darkMode, totalPage, pageCount, dataLoading, gotoNextPage, gotoPreviousPage, showPagination }) => {
  if (!showPagination) return null;

  return (
    <div
      style={{
        position: 'sticky',
        bottom: '0',
      }}
      className={`card-footer d-flex align-items-center jet-table-footer justify-content-center`}
    >
      <div className="row gx-0" data-cy="table-footer-section">
        <Pagination
          darkMode={darkMode}
          gotoNextPage={gotoNextPage}
          gotoPreviousPage={gotoPreviousPage}
          currentPage={pageCount}
          totalPage={totalPage}
          isDisabled={dataLoading}
          disableInput={true}
        />
      </div>
    </div>
  );
};

ManageOrgConstantsComponent.EnvironmentsTabs = RenderEnvironmentsTab;
ManageOrgConstantsComponent.Footer = Footer;

export default ManageOrgConstantsComponent;
