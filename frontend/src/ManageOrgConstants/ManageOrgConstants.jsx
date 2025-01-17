//Do not merge changes from ee
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
import { Constants, redirectToWorkspace } from '@/_helpers/utils';
import { SearchBox } from '@/_components/SearchBox';
import { OrganizationList } from '@/_components/OrganizationManager/List';
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
  const NoPermissionMessage = 'You do not have permissions to perform this action';

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

  const handleSearchClear = () => {
    const searchTerm = '';
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

    const envName = activeTabEnvironment ? activeTabEnvironment?.name : environment?.name;
    updateTableData(allConstants, envName, 0, perPage, true, activeTab, searchTerm);
    // Calculate counts for Global and Secret constants
    const globalCount =
      allConstants.length > 0
        ? allConstants.filter(
            (constant) =>
              constant.type === Constants.Global &&
              constant.values.find((env) => env.environmentName === envName)?.value !== ''
          ).length
        : 0;

    const secretCount =
      allConstants.length > 0
        ? allConstants.filter(
            (constant) =>
              constant.type === Constants.Secret &&
              constant.values.find((env) => env.environmentName === envName)?.value !== ''
          ).length
        : 0;

    setGlobalCount(globalCount);
    setSecretCount(secretCount);
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

    let globalTabCount = 0;
    let secretTabCount = 0;

    globalTabCount = orgConstants.filter(
      (constant) =>
        constant.type === Constants.Global &&
        constant.name.toLowerCase().includes(search.toLowerCase()) &&
        constant?.values.find((value) => value.environmentName === envName && value.value !== '')
    ).length;

    secretTabCount = orgConstants.filter(
      (constant) =>
        constant.type === Constants.Secret &&
        constant.name.toLowerCase().includes(search.toLowerCase()) &&
        constant?.values.find((value) => value.environmentName === envName && value.value !== '')
    ).length;

    setGlobalCount(globalTabCount);
    setSecretCount(secretTabCount);
    if (activeTabChanged) {
      computeTotalPages(filteredConstants.length || 1);
    }
    const paginatedConstants = filteredConstants ? filteredConstants.slice(start, end) : filteredConstants;
    setTableData(paginatedConstants);
    if (tab === Constants.Global) {
      setGlobalCount(filteredConstants.length);
    } else {
      setSecretCount(filteredConstants.length);
    }
  };

  const goToNextPage = () => {
    setCurrentPage(currentPage + 1);

    const start = currentPage * perPage;
    const end = start + perPage;

    const envName = activeTabEnvironment?.name;
    updateTableData(constants, envName, start, end, false, activeTab, searchTerm);
  };

  const goToPreviousPage = () => {
    setCurrentPage(currentPage - 1);

    const start = (currentPage - 2) * perPage;
    const end = start + perPage;

    const envName = activeTabEnvironment?.name;
    updateTableData(constants, envName, start, end, false, activeTab, searchTerm);
  };

  const canAnyGroupPerformAction = (action, permissions) => {
    if (!permissions) {
      return false;
    }

    return permissions.some((p) => p[action]);
  };

  const canCreateVariable = () => {
    return authenticationService.currentSessionValue.user_permissions.org_constant_c_r_u_d;
  };

  const canUpdateVariable = () => {
    return authenticationService.currentSessionValue.user_permissions.org_constant_c_r_u_d;
  };

  const canDeleteVariable = () => {
    return authenticationService.currentSessionValue.user_permissions.org_constant_c_r_u_d;
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
    const start = (currentPage - 1 - 1) * perPage;
    const end = start + perPage;

    const envName = activeTabEnvironment ? activeTabEnvironment?.name : currentEnvironment?.name;
    updateTableData(orgConstants, envName, start, end, activeTab, searchTerm);
  };

  const checkIfConstantNameExists = (name, type, environementId) => {
    if (!environementId) {
      return constants.some((constant) => constant.name === name && constant.type === type);
    }

    const existingConstants = constants.filter((constant) => {
      return (
        constant.type === type && constant.values.some((value) => value.id === environementId && value.value !== '')
      );
    });
    return existingConstants.some((constant) => constant.name === name);
  };

  const checkIfConstantNameExistsInDiffEnv = (name, type, environementId) => {
    if (!environementId) {
      return constants.some((constant) => constant.name === name && constant.type === type);
    }

    const envConstants = constants.filter((constant) => {
      return (
        constant.type === type && constant.values.some((value) => value.id === environementId && value.value === '')
      );
    });
    return envConstants.some((constant) => constant.name === name);
  };

  const createOrUpdate = (variable, shouldUpdate = false) => {
    const currentEnv = activeTabEnvironment;

    const constantExists = checkIfConstantNameExists(
      variable?.name,
      variable?.type,
      variable?.environments?.[0]?.value
    );
    const constantExistsInDiffEnv = checkIfConstantNameExistsInDiffEnv(
      variable?.name,
      variable?.type,
      variable?.environments?.[0]?.value
    );
    if (constantExists && !shouldUpdate) {
      toast.error(`${variable.type} constant already exists!`);
      return;
    }
    const shouldUpdateConstant = mode === 'edit' && shouldUpdate ? true : constantExistsInDiffEnv;

    if (shouldUpdateConstant) {
      const variableId = constantExistsInDiffEnv
        ? constants.find((constant) => constant.name === variable.name && constant.type === variable.type).id
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
          if (error === NoPermissionMessage) {
            redirectToWorkspace();
          }
        })
        .finally(() => fetchConstantsAndEnvironments());
    }

    return orgEnvironmentConstantService
      .create(variable.name, variable.value, variable.type, [currentEnv['id']])
      .then(() => {
        toast.success(`${variable.type} constant created successfully!`);
        onCancelBtnClicked();
      })
      .catch(({ error }) => {
        setErrors(error);
        toast.error(error || 'Constant could not be created');
        if (error === NoPermissionMessage) {
          redirectToWorkspace();
        }
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
        if (error === NoPermissionMessage) {
          redirectToWorkspace();
        }
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

      <div className="row gx-0">
        <div className="organization-page-sidebar col">
          <div className="workspace-nav-list-wrap">
            <ManageOrgConstantsComponent.EnvironmentsTabs
              allEnvironments={environments}
              currentEnvironment={activeTabEnvironment}
              setActiveTabEnvironment={setActiveTabEnvironment}
              isLoading={isLoading}
              allConstants={constants}
            />
          </div>
          <OrganizationList />
        </div>

        <div className="page-wrapper mt-4" style={{ marginLeft: '50px' }}>
          <div className="container-xl" style={{ width: '880px' }}>
            <div className="align-items-center d-flex justify-content-between">
              <div className="tj-text-sm font-weight-500" data-cy="env-name">
                {capitalize(activeTabEnvironment?.name)} ({globalCount + secretCount})
              </div>
              <div className="workspace-setting-buttons-wrap">
                {canCreateVariable() && (
                  <ButtonSolid
                    data-cy="form-add-new-constant-button"
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
          </div>

          <div className="workspace-variable-container-wrap constants-list mt-2">
            <div className="container-xl constant-page-wrapper">
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
                    <SearchBox
                      width={250}
                      callBack={handleSearchChange}
                      customClass="tj-common-search-input-group"
                      autoFocus={true}
                      placeholder={activeTab === Constants.Global ? 'Search global constants' : 'Search secrets'}
                      onClearCallback={handleSearchClear}
                    />
                  </div>
                </div>
              </div>

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
                            <strong style={{ fontWeight: 500, color: '#3E63DD' }}>
                              {'{{constants.access_token}}'}
                            </strong>
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
                        searchTerm={searchTerm}
                      />
                    )}
                  </div>
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
