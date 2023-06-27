import React, { useEffect, useState } from 'react';
import { authenticationService, orgEnvironmentConstantService, appEnvironmentService } from '@/_services';
import { ConfirmDialog } from '@/_components';
import { toast } from 'react-hot-toast';
import { capitalize } from 'lodash';
import cx from 'classnames';

import Pagination from '@/_ui/Pagination';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { Alert } from '../_ui/Alert/Alert';
import { Button } from '@/_ui/LeftSidebar';
import ConstantTable from './ConstantTable';

import Drawer from '@/_ui/Drawer';
import ConstantForm from './ConstantForm';

const ManageOrgConstantsComponent = ({ darkMode }) => {
  const [isManageVarDrawerOpen, setIsManageVarDrawerOpen] = useState(false);
  const [constants, setConstants] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [activeTabEnvironment, setActiveTabEnvironment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const perPage = 8;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTabContants, setActiveTabContants] = useState([]);

  const [errors, setErrors] = useState([]);
  const [showConstantDeleteConfirmation, setShowConstantDeleteConfirmation] = useState(false);
  const [selectedConstant, setSelectedConstant] = useState(null);

  const onCancelBtnClicked = () => {
    setIsManageVarDrawerOpen(false);
  };

  const onEditBtnClicked = (constant) => {
    setSelectedConstant(constant);
    setIsManageVarDrawerOpen(true);
  };

  const onDeleteBtnClicked = (constant) => {
    setSelectedConstant(constant);
    setShowConstantDeleteConfirmation(true);
  };

  const computeTotalPages = (totalItems) => {
    const totalPages = Math.ceil(totalItems / perPage);
    setTotalPages(totalPages);
  };

  const updateActiveEnvironmentTab = (environment, allConstants = []) => {
    setActiveTabEnvironment(environment);
    setCurrentPage(1);

    const constantsForEnvironment = allConstants.slice(0, perPage).map((constant) => {
      return {
        id: constant.id,
        name: constant.name,
        value: findValueForEnvironment(constant.values, environment.name),
      };
    });

    setActiveTabContants(
      constantsForEnvironment.filter((constant) => constant.value !== null && constant.value !== '')
    );

    computeTotalPages(constantsForEnvironment.length + 1);
  };

  const goToNextPage = () => {
    setCurrentPage(currentPage + 1);

    const start = (currentPage + 1 - 1) * perPage;
    const end = start + perPage;

    const constantsForEnvironment = constants.slice(start, end).map((constant) => {
      return {
        id: constant.id,
        name: constant.name,
        value: findValueForEnvironment(constant.values, activeTabEnvironment?.name),
      };
    });

    setActiveTabContants(constantsForEnvironment);
  };

  const goToPreviousPage = () => {
    setCurrentPage(currentPage - 1);

    const start = (currentPage - 1 - 1) * perPage;
    const end = start + perPage;

    const constantsForEnvironment = constants.slice(start, end).map((constant) => {
      return {
        id: constant.id,
        name: constant.name,
        value: findValueForEnvironment(constant.values, activeTabEnvironment?.name),
      };
    });

    setActiveTabContants(constantsForEnvironment);
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

  const createOrUpdate = (variable, isUpdate = false) => {
    if (isUpdate) {
      return orgEnvironmentConstantService
        .update(variable.id, variable.value, variable.environments)
        .then(() => {
          toast.success('Constant updated successfully');
          setIsManageVarDrawerOpen(false);
        })
        .catch(({ error }) => {
          setErrors(error);
        })
        .finally(() => fetchConstantsAndEnvironments());
    }

    return orgEnvironmentConstantService
      .create(
        variable.name,
        variable.value,
        variable.environments.map((env) => env.value)
      )
      .then(() => {
        toast.success('Constant created successfully');
        setIsManageVarDrawerOpen(false);
      })
      .catch(({ error }) => {
        setErrors(error);
      })
      .finally(() => fetchConstantsAndEnvironments());
  };

  const handleOnCancelDelete = () => {
    setShowConstantDeleteConfirmation(false);
    setSelectedConstant(null);
  };

  const handleExecuteDelete = () => {
    setShowConstantDeleteConfirmation(false);

    return orgEnvironmentConstantService
      .remove(selectedConstant.id)
      .then(() => {
        toast.success('Constant deleted successfully');
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

  return (
    <div className="wrapper org-constant-page org-variables-page animation-fade">
      <ConfirmDialog
        show={showConstantDeleteConfirmation}
        message={'Variable will be deleted, do you want to continue?'}
        onConfirm={handleExecuteDelete}
        onCancel={handleOnCancelDelete}
        darkMode={false}
      />

      <Drawer
        disableFocus={true}
        isOpen={isManageVarDrawerOpen}
        onClose={() => {
          setIsManageVarDrawerOpen(false);
          setSelectedConstant(null);
        }}
        position="right"
      >
        <ConstantForm
          errors={errors}
          selectedConstant={selectedConstant}
          createOrUpdate={createOrUpdate}
          onCancelBtnClicked={onCancelBtnClicked}
          isLoading={isLoading}
          environments={environments}
          currentEnvironment={selectedConstant ? activeTabEnvironment : environments[0]}
        />
      </Drawer>

      <div className="page-wrapper">
        <div className="container-xl">
          <div>
            <div className="page-header workspace-page-header">
              <div className="align-items-center d-flex">
                <div className="tj-text-sm font-weight-500">{constants.length} constants</div>
                <div className=" workspace-setting-buttons-wrap">
                  {!isManageVarDrawerOpen && canCreateVariable() && (
                    <ButtonSolid
                      data-cy="add-new-constant-button"
                      vaiant="primary"
                      onClick={() => setIsManageVarDrawerOpen(true)}
                      className="add-new-constant-button"
                      customStyles={{ minWidth: '200px', height: '32px' }}
                    >
                      Create new constant
                    </ButtonSolid>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="workspace-variable-container-wrap mt-2">
          <div className="container-xl">
            <div className="card workspace-variable-table-card">
              <RenderEnvironmentsTab
                isMultiEnvironment={environments?.length > 1}
                allEnvironments={environments}
                currentEnvironment={activeTabEnvironment}
                setActiveTabEnvironment={setActiveTabEnvironment}
              />

              <div className="p-4 pb-1">
                <Alert svg="tj-info" cls="" data-cy={``}>
                  <div
                    className="d-flex align-items-center"
                    style={{
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      width: '100%',
                    }}
                  >
                    <div class="text-muted">
                      To resolve a workspace constant use{' '}
                      <strong style={{ fontWeight: 500, color: '#3E63DD' }}>{'{{constants.access_token}}'}</strong>
                    </div>
                    <div>
                      <Button
                        // onClick={() => window.open('https://tooljet.com/copilot', '_blank')}
                        darkMode={darkMode}
                        size="sm"
                        styles={{
                          width: '100%',
                          fontSize: '12px',
                          fontWeight: 500,
                          borderColor: true && 'transparent',
                        }}
                      >
                        <Button.Content title={'Read Documentation'} iconSrc="assets/images/icons/student.svg" />
                      </Button>
                    </div>
                  </div>
                </Alert>
              </div>

              {constants.length === 0 ? (
                <span className="no-vars-text" data-cy="no-variable-text">
                  You haven&apos;t configured any environment variables, press the &apos;Create new constanr&apos;
                  button to create one
                </span>
              ) : (
                <ConstantTable
                  constants={activeTabContants}
                  onEditBtnClicked={onEditBtnClicked}
                  onDeleteBtnClicked={onDeleteBtnClicked}
                  isLoading={isLoading}
                  canUpdateDeleteConstant={canUpdateVariable() || canDeleteVariable()}
                />
              )}

              <Footer
                darkMode={darkMode}
                totalPage={totalPages}
                pageCount={currentPage}
                dataLoading={false}
                gotoNextPage={goToNextPage}
                gotoPreviousPage={goToPreviousPage}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RenderEnvironmentsTab = ({
  isMultiEnvironment = false,
  allEnvironments = [],
  currentEnvironment = {},
  setActiveTabEnvironment,
  updateTableData,
}) => {
  if (!isMultiEnvironment) return null;

  const updateCurrentEnvironment = (env) => {
    setActiveTabEnvironment(env);
  };

  return (
    <nav className="nav nav-tabs">
      {allEnvironments.map((env) => (
        <a
          key={env?.id}
          onClick={() => updateCurrentEnvironment(env)}
          className={cx('nav-item nav-link', { active: currentEnvironment?.name === env.name })}
        >
          {capitalize(env.name)}
        </a>
      ))}
    </nav>
  );
};

const Footer = ({ darkMode, totalPage, pageCount, dataLoading, gotoNextPage, gotoPreviousPage }) => {
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

export default ManageOrgConstantsComponent;
