import React, { useContext, useEffect, useState } from 'react';
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
import { BreadCrumbContext } from '@/App';
import './ConstantFormStyle.scss';
import { Constants } from '@/_helpers/utils';

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

  const perPage = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentTableData, setTableData] = useState([]);

  const [errors, setErrors] = useState([]);
  const [showConstantDeleteConfirmation, setShowConstantDeleteConfirmation] = useState(false);
  const [selectedConstant, setSelectedConstant] = useState(null);
  const { updateSidebarNAV } = useContext(BreadCrumbContext);

  const [activeTab, setActiveTab] = useState(Constants.Global);
  const [searchTerm, setSearchTerm] = useState('');
  const [globalCount, setGlobalCount] = useState(0);
  const [secretCount, setSecretCount] = useState(0);

  const handleTabChange = (tab) => {
    setCurrentPage(1);
    updateTableData(constants, activeTabEnvironment?.name, 0, perPage, true, tab, searchTerm);
    setActiveTab(tab);
  };

  const handleSearchChange = (e) => {
    const searchTerm = e?.target?.value.toLowerCase();
    setSearchTerm(searchTerm);

    // Re-filter the constants based on the current search term and active tab
    updateTableData(constants, activeTabEnvironment?.name, 0, perPage, true, activeTab, searchTerm);
  };

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
    updateTableData(allConstants, envName, 0, perPage, true, activeTab, searchTerm);
  };

  const updateTableData = (orgConstants, envName, start, end, activeTabChanged = false, tab = null, search = '') => {
    if (!Array.isArray(orgConstants)) {
      return;
    }
    const filteredConstants = orgConstants
      .filter((constant) => {
        const envConstant = constant?.values.find((value) => value.environmentName === envName);

        // Filter based on the active tab: 'Global' or 'Secret'
        if (tab === Constants.Global) {
          return envConstant && envConstant.value !== '' && constant.type === Constants.Global;
        } else if (tab === Constants.Secret) {
          return envConstant && envConstant.value !== '' && constant.type === Constants.Secret;
        }
        return envConstant && envConstant.value !== '';
      })
      .filter((constant) => {
        // Filter based on the search term
        return constant.name.toLowerCase().includes(search.toLowerCase());
      })
      .map((constant) => ({
        id: constant.id,
        name: constant.name,
        type: constant.type,
        value: findValueForEnvironment(constant.values, envName),
      }));

    if (activeTabChanged) {
      computeTotalPages(filteredConstants.length || 1);
    }
    const paginatedConstants = filteredConstants ? filteredConstants.slice(start, end) : filteredConstants;
    setTableData(paginatedConstants);
  };

  const goToNextPage = () => {
    setCurrentPage(currentPage + 1);

    const start = currentPage * perPage;
    const end = start + perPage;

    const envName = activeTabEnvironment.name;
    updateTableData(constants, envName, start, end, false, activeTab, searchTerm);
  };

  const goToPreviousPage = () => {
    setCurrentPage(currentPage - 1);

    const start = (currentPage - 2) * perPage;
    const end = start + perPage;

    const envName = activeTabEnvironment.name;
    updateTableData(constants, envName, start, end, false, activeTab, searchTerm);
  };

  const canAnyGroupPerformAction = (action, permissions) => {
    if (!permissions) {
      return false;
    }

    return permissions.some((p) => p[action]);
  };

  const canCreateVariable = () => {
    return canAnyGroupPerformAction(
      'org_environment_variable_create',
      authenticationService.currentSessionValue.group_permissions
    );
  };

  const canUpdateVariable = () => {
    return canAnyGroupPerformAction(
      'org_environment_variable_update',
      authenticationService.currentSessionValue.group_permissions
    );
  };

  const canDeleteVariable = () => {
    return canAnyGroupPerformAction(
      'org_environment_variable_delete',
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
    const orgConstants = await orgEnvironmentConstantService.getAll(true);

    if (orgConstants?.constants?.length > 1) {
      orgConstants.constants.sort((a, b) => {
        return new Date(b.createdAt).getTime().toString().localeCompare(new Date(a.createdAt).getTime().toString());
      });
    }

    setConstants(orgConstants?.constants);

    // Calculate counts for Global and Secret constants
    const globalCount = orgConstants.constants.filter((constant) => constant.type === Constants.Global).length;
    const secretCount = orgConstants.constants.filter((constant) => constant.type === Constants.Secret).length;

    setGlobalCount(globalCount);
    setSecretCount(secretCount);

    let orgEnvironments = await fetchEnvironments();
    setEnvironments(orgEnvironments?.environments);
    const currentEnvironment = orgEnvironments?.environments?.find((env) => env?.is_default === true);
    updateActiveEnvironmentTab(currentEnvironment, orgConstants?.constants);

    setIsLoading(false);
    setSelectedConstant(null);
    const start = (currentPage - 1 - 1) * perPage;
    const end = start + perPage;

    const envName = activeTabEnvironment.name;
    updateTableData(orgConstants, envName, start, end, activeTab, searchTerm);
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

    const shouldUpdateConstant = mode === 'edit' && shouldUpdate ? true : false;

    if (shouldUpdateConstant) {
      const variableId = variable.id;

      return orgEnvironmentConstantService
        .update(variableId, variable.value, currentEnv['id'])
        .then(() => {
          toast.success('Constant updated successfully');
          onCancelBtnClicked();
        })
        .catch((error) => {
          setErrors(error);
          toast.error(error || 'Constant could not be updated');
        })
        .finally(() => fetchConstantsAndEnvironments());
    }

    return orgEnvironmentConstantService
      .create(variable.name, variable.value, variable.type, [currentEnv['id']])
      .then(() => {
        toast.success('Constant has been created');
        onCancelBtnClicked();
      })
      .catch(({ error }) => {
        setErrors(error);
        toast.error(error || 'Constant could not be created');
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
    updateSidebarNAV('');
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
    <div className="constant-wrapper org-constant-page org-variables-page animation-fade">
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
      <div className="align-items-center d-flex justify-content-between" style={{ marginBottom: '10px' }}>
        <div className="tj-text-sm font-weight-500" data-cy="env-name">
          {capitalize(activeTabEnvironment?.name)} ({globalCount + secretCount})
        </div>
        <div className="workspace-setting-buttons-wrap">
          {canCreateVariable() && (
            <ButtonSolid
              data-cy="add-new-constant-button"
              variant="primary"
              onClick={() => {
                setMode(() => MODES.CREATE);
                setIsManageVarDrawerOpen(() => true);
              }}
              className="add-new-constant-button"
              customStyles={{ minWidth: '200px', height: '32px' }}
              disabled={isManageVarDrawerOpen}
            >
              + Create new constant
            </ButtonSolid>
          )}
        </div>
      </div>
      <div className="constant-page-wrapper">
        <div className="container-xl">
          <div>
            <div className="workspace-constant-header">
              <div className="tabs-and-search">
                <div className="tabs">
                  <button
                    className={`tab ${activeTab === Constants.Global ? 'active' : ''}`}
                    onClick={() => handleTabChange(Constants.Global)}
                  >
                    Global constants
                    <span className={`tab-count ${activeTab === Constants.Global ? 'active' : ''}`}>
                      ({globalCount})
                    </span>
                  </button>
                  <button
                    className={`tab ${activeTab === Constants.Secret ? 'active' : ''}`}
                    onClick={() => handleTabChange(Constants.Secret)}
                  >
                    Secrets
                    <span className={`tab-count ${activeTab === Constants.Secret ? 'active' : ''}`}>
                      ({secretCount})
                    </span>
                  </button>
                </div>

                <div className="search-bar">
                  <input
                    type="text"
                    placeholder={activeTab === Constants.Global ? 'Search global constants' : 'Search secrets'}
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="search-input"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="workspace-variable-container-wrap mt-2">
          <div className="container-xl" style={{ width: '880px', padding: '0px' }}>
            <div className="workspace-constant-table-card">
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
                    <div className="text-muted" data-cy="workspace-constant-helper-text">
                      {activeTab === Constants.Global ? (
                        <>
                          To resolve a global workspace constant use{' '}
                          <strong style={{ fontWeight: 500, color: '#3E63DD' }}>{'{{constants.access_token}}'}</strong>
                        </>
                      ) : (
                        <>
                          To resolve a secret workspace constant use{' '}
                          <strong style={{ fontWeight: 500, color: '#3E63DD' }}>{'{{secrets.access_token}}'}</strong>
                        </>
                      )}
                    </div>

                    <div>
                      <Button
                        // Todo: Update link to documentation: workspace constants
                        onClick={() =>
                          window.open(
                            'https://docs.tooljet.com/docs/org-management/workspaces/workspace_constants/',
                            '_blank'
                          )
                        }
                        darkMode={darkMode}
                        size="sm"
                        styles={{
                          width: '100%',
                          fontSize: '12px',
                          fontWeight: 500,
                        }}
                      >
                        <Button.Content title={'Read documentation'} iconSrc="assets/images/icons/student.svg" />
                      </Button>
                    </div>
                  </div>
                </Alert>
              </div>
              <div className="manage-sso-container h-100">
                <div className="d-flex manage-constant-wrapper-card">
                  <ManageOrgConstantsComponent.EnvironmentsTabs
                    allEnvironments={environments}
                    currentEnvironment={activeTabEnvironment}
                    setActiveTabEnvironment={setActiveTabEnvironment}
                    isLoading={isLoading}
                    allConstants={constants}
                  />
                  {(activeTab === Constants.Global && globalCount > 0) ||
                  (activeTab === Constants.Secret && secretCount > 0) ? (
                    <div className="w-100">
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
                      isLoading={isLoading}
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
