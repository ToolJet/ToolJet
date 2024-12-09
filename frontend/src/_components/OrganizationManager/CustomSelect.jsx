import React, { useState } from 'react';
import Select from '@/_ui/Select';
import { components } from 'react-select';
import { CreateOrganization } from './CreateOrganization';
import { useTranslation } from 'react-i18next';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ToolTip } from '@/_components';
import { decodeEntities } from '@/_helpers/utils';
const Menu = (props) => {
  const { t } = useTranslation();
  const darkMode = localStorage.getItem('darkMode') === 'true';
  return (
    <components.Menu {...props}>
      <div
        className={`org-dropdown-shadow ${darkMode && 'dark-theme'}`}
        style={{ paddingTop: '4px', paddingBottom: '4px' }}
      >
        <>
          <div className="org-custom-select-header-wrap" style={{ padding: '8px 12px' }}>
            <div className="row cursor-pointer d-flex align-items-center">
              <div className="col-10 select-header-font">Workspaces ({props.options.length})</div>
              <ToolTip message={'Add new workspace'} position="top">
                <div className="col-1" style={{ paddingRight: '24px' }} onClick={props.selectProps.setShowCreateOrg}>
                  <SolidIcon
                    name="plus"
                    fill="var(--icon-strong)"
                    className=""
                    dataCy="add-new-workspace-link"
                    width="15"
                  />
                </div>
              </ToolTip>
            </div>
          </div>
        </>

        <div className={`${darkMode && 'dark-theme'}`}>{props.children}</div>
      </div>
    </components.Menu>
  );
};

const SingleValue = ({ selectProps }) => {
  return (
    <ToolTip message={selectProps?.value?.name}>
      <div className="d-inline-flex align-items-center">
        <div data-cy="workspace-name" className="tj-text-xsm">
          {decodeEntities(selectProps.value.name)}
        </div>
      </div>
    </ToolTip>
  );
};

export const CustomSelect = ({ ...props }) => {
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const darkMode = localStorage.getItem('darkMode') === 'true';

  return (
    <>
      <CreateOrganization showCreateOrg={showCreateOrg} setShowCreateOrg={setShowCreateOrg} />

      <Select
        className={`react-select-container ${darkMode && 'dark-theme'}`}
        width={'262px'}
        hasSearch={false}
        components={{ Menu, SingleValue }}
        setShowCreateOrg={setShowCreateOrg}
        styles={{ border: 0, cursor: 'pointer' }}
        {...props}
      />
    </>
  );
};
