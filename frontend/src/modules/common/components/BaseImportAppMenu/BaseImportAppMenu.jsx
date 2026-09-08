import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getWorkspaceId } from '@/_helpers/utils';
import { fetchEdition } from '@/modules/common/helpers/utils';

const BaseImportAppMenu = ({
  showTemplateLibraryModal = () => null,
  readAndImport = () => null,
  showEEMenuItems = false,
  EEMenuComponent = () => null,
  showCloudMenuItems = false,
  CloudMenuComponent = () => null,
  darkMode = false,
  appType = 'front-end',
  ...props
}) => {
  const fileInput = React.createRef();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const goToHomePage = () => {
    const edition = fetchEdition();
    navigate(`/${getWorkspaceId()}${edition === 'ce' ? '/' : '/home'}`);
  };

  return (
    <Dropdown.Menu className="import-lg-position new-app-dropdown">
      <Dropdown.Item
        className="homepage-dropdown-style tj-text tj-text-xsm"
        onClick={goToHomePage}
        data-cy="generate-with-ai-button"
      >
        {t('homePage.header.generateWithAi', 'Generate with AI')}
      </Dropdown.Item>
      {appType !== 'workflow' && appType !== 'module' && (
        <Dropdown.Item
          className="homepage-dropdown-style tj-text tj-text-xsm"
          onClick={showTemplateLibraryModal}
          data-cy="choose-from-template-button"
        >
          {t('homePage.header.chooseFromTemplate', 'Choose from template')}
        </Dropdown.Item>
      )}
      <Dropdown.Item
        as="label"
        className="homepage-dropdown-style tj-text tj-text-xsm"
        data-cy="import-option-label"
        onChange={readAndImport}
      >
        {t('homePage.header.import', 'Import from device')}
        <input type="file" accept=".json" ref={fileInput} style={{ display: 'none' }} data-cy="import-option-input" />
      </Dropdown.Item>

      {showEEMenuItems && <EEMenuComponent {...props} />}
      {showCloudMenuItems && <CloudMenuComponent {...props} />}
    </Dropdown.Menu>
  );
};

export default BaseImportAppMenu;
