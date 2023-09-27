import React, { useEffect, useState } from 'react';
import Select from '@/_ui/Select';
import { components } from 'react-select';
import { authenticationService, organizationService } from '@/_services';
import { EditOrganization } from './EditOrganization';
import { CreateOrganization } from './CreateOrganization';
import { useTranslation } from 'react-i18next';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import cx from 'classnames';
import { LicenseBanner } from '@/LicenseBanner';
import { ToolTip } from '@/_components';
import { LicenseTooltip } from '@/LicenseTooltip';

const Menu = (props) => {
  const { t } = useTranslation();
  const isAllowPersonalWorkspace = window.public_config?.ALLOW_PERSONAL_WORKSPACE === 'true';
  const { admin } = authenticationService.currentSessionValue;
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const { workspacesLimit } = props.selectProps;

  return (
    <components.Menu {...props}>
      <div className={darkMode && 'dark-theme'} style={{ padding: '4px' }}>
        {admin && (
          <>
            <div
              className="org-custom-select-header-wrap"
              style={{ padding: '8px 12px' }}
              onClick={() => props.selectProps.setShowEditOrg(true)}
            >
              <div className="row cursor-pointer d-flex align-items-center">
                <div className="col-10">{props?.selectProps?.value?.label}</div>
                <div className="col-1 tj-secondary-btn org-edit-icon">
                  <SolidIcon name="editrectangle" width="14" fill="#3E63DD" />
                </div>
              </div>
            </div>
          </>
        )}
        <div className={`${darkMode && 'dark-theme'}`}>{props.children}</div>
        {(admin || isAllowPersonalWorkspace) && (
          <LicenseTooltip limits={workspacesLimit} feature={'workspaces'} isAvailable={true}>
            <div
              disabled={!workspacesLimit.canAddUnlimited && workspacesLimit?.percentage >= 100}
              className={cx('cursor-pointer d-flex align-items-center add-workspace-button', {
                disabled: !workspacesLimit.canAddUnlimited && workspacesLimit?.percentage >= 100,
              })}
              style={{ padding: '4px 12px', color: '#3E63DD' }}
              onClick={
                !workspacesLimit.canAddUnlimited && workspacesLimit?.percentage >= 100
                  ? null
                  : props.selectProps.setShowCreateOrg
              }
            >
              <div className="add-new-workspace-icon-old-wrap">
                <SolidIcon name="plus" fill="#FDFDFE" className="add-new-workspace-icon-old" />
              </div>

              <div className="add-new-workspace-icon-wrap">
                <SolidIcon
                  name="plus"
                  fill="#3E63DD"
                  className="add-new-workspace-icon"
                  dataCy="add-new-workspace-link"
                />
              </div>
              <span className="p-1 tj-text-xsm">{t('header.organization.addNewWorkSpace', 'Add new workspace')}</span>
            </div>
          </LicenseTooltip>
        )}
        <LicenseBanner classes="mb-3 mx-1 small" limits={workspacesLimit} type="workspaces" size="small" />
      </div>
    </components.Menu>
  );
};

const SingleValue = ({ selectProps }) => {
  return (
    <ToolTip message={selectProps?.value?.name}>
      <div className="d-inline-flex align-items-center">
        <div data-cy="workspace-name" className="tj-text-xsm">
          {selectProps.value.name}
        </div>
      </div>
    </ToolTip>
  );
};

export const CustomSelect = ({ workspacesLimit, ...props }) => {
  const [showEditOrg, setShowEditOrg] = useState(false);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const currentValue = props?.options.find((option) => option?.value === props?.value);

  return (
    <>
      <CreateOrganization showCreateOrg={showCreateOrg} setShowCreateOrg={setShowCreateOrg} />
      <EditOrganization showEditOrg={showEditOrg} setShowEditOrg={setShowEditOrg} currentValue={currentValue} />

      <Select
        className={`react-select-container ${darkMode && 'dark-theme'}`}
        width={'262px'}
        hasSearch={false}
        components={{ Menu, SingleValue }}
        setShowEditOrg={setShowEditOrg}
        setShowCreateOrg={setShowCreateOrg}
        workspacesLimit={workspacesLimit}
        styles={{ border: 0, cursor: 'pointer' }}
        {...props}
      />
    </>
  );
};
