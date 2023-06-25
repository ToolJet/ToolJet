import React, { useEffect, useState } from 'react';
import { authenticationService, orgEnvironmentConstantService, appEnvironmentService } from '@/_services';
import { ConfirmDialog } from '@/_components';
import { toast } from 'react-hot-toast';
import Pagination from '@/_ui/Pagination';
import { capitalize } from 'lodash';
import cx from 'classnames';

import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { Alert } from '../_ui/Alert/Alert';
import { Button } from '@/_ui/LeftSidebar';
import ConstantTable from './ConstantTable';

const ManageOrgConstantsComponent = ({ darkMode }) => {
  const [isManageVarDrawerOpen, setIsManageVarDrawerOpen] = useState(false);
  const [constants, setConstants] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [activeTabEnvironment, setActiveTabEnvironment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const canCreateVariable = () => true;

  const fetchOnMount = async () => {
    const orgConstants = await orgEnvironmentConstantService.getAll();
    const orgEnvironments = await appEnvironmentService.getAllEnvironments();

    setConstants(orgConstants?.constants);
    setEnvironments(orgEnvironments?.environments);
    setActiveTabEnvironment(orgEnvironments?.environments?.find((env) => env?.is_default === true));
    setIsLoading(false);
  };

  const findValueForEnvironment = (constantValues, environmentName) => {
    if (!Array.isArray(constantValues)) return;

    const value = constantValues?.find((value) => value.environmentName === environmentName);
    return value?.value;
  };

  useEffect(() => {
    fetchOnMount();
  }, []);

  return (
    <div className="wrapper org-constant-page org-variables-page animation-fade">
      <ConfirmDialog
        //   show={this.state.showVariableDeleteConfirmation}
        message={'Variable will be deleted, do you want to continue?'}
        onConfirm={() => console.log('onConfirm')}
        onCancel={() => console.log('onConfirm')}
        darkMode={false}
      />

      <div className="page-wrapper">
        <div className="container-xl">
          <div>
            <div className="page-header workspace-page-header">
              <div className="align-items-center d-flex">
                <div className="tj-text-sm font-weight-500">10 users</div>
                <div className=" workspace-setting-buttons-wrap">
                  {!isManageVarDrawerOpen && canCreateVariable() && (
                    <ButtonSolid
                      data-cy="add-new-constant-button"
                      vaiant="primary"
                      // onClick={() => this.setState({ isManageVarDrawerOpen: true, errors: {} })}
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
                isMultiEnvironment={environments.length > 1}
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
                  You haven&apos;t configured any environment variables, press the &apos;Add new variable&apos; button
                  to create one
                </span>
              ) : (
                <ConstantTable
                  constants={constants}
                  findValueForEnvironment={findValueForEnvironment}
                  activeTabEnvironment={activeTabEnvironment}
                  isLoading={isLoading}
                />
              )}

              <Footer
                darkMode={false}
                totalPage={3}
                pageCount={1}
                dataLoading={false}
                gotoNextPage={console.log('next')}
                gotoPreviousPage={console.log('prev')}
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
          disableInput={false}
        />
      </div>
    </div>
  );
};

export default ManageOrgConstantsComponent;
