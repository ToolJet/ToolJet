import React, { useState } from 'react';
import { authenticationService, orgEnvironmentVariableService } from '@/_services';
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
  const [variables, setVariables] = useState([]);

  const canCreateVariable = () => true;

  const allEnvironment = [
    {
      id: 1,
      name: 'development',
    },
    {
      id: 2,
      name: 'staging',
    },
    {
      id: 3,
      name: 'production',
    },
  ];

  const orgConstants = [
    {
      id: '45d140b5-c0a3-4a5b-bee4-e60a544d3279',
      name: 'psql_database_name',
      values: [
        {
          environmentName: 'production',
          value: 'tj_development_test',
        },
      ],
    },
    {
      id: '45d140b5-c0a3-4a5b-bee4-e60a544d3299',
      name: 'psql_database_host',
      values: [
        {
          environmentName: 'production',
          value: 'prod_host',
        },
      ],
    },

    {
      id: '45d140b5-c0a3-4a5b-bee4-e60a544d3259',
      name: 'psql_database_port',
      values: [
        {
          environmentName: 'production',
          value: '5432',
        },
      ],
    },
  ];

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
                isMultiEnvironment={allEnvironment.length > 1}
                allEnvironments={allEnvironment}
                currentEnvironment={allEnvironment[0]}
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

              {orgConstants.length === 0 ? (
                <span className="no-vars-text" data-cy="no-variable-text">
                  You haven&apos;t configured any environment variables, press the &apos;Add new variable&apos; button
                  to create one
                </span>
              ) : (
                <ConstantTable constants={orgConstants} />
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

const RenderEnvironmentsTab = ({ isMultiEnvironment = false, allEnvironments = [], currentEnvironment = {} }) => {
  if (!isMultiEnvironment) return null;

  const updateCurrentEnvironment = (env) => {
    console.log('currentEnvironment', env);
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
