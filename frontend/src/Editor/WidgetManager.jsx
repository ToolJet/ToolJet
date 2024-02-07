import React, { useState } from 'react';
import { DraggableBox } from './DraggableBox';
import Fuse from 'fuse.js';
import { isEmpty, find } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { useEditorStore } from '@/_stores/editorStore';
import { shallow } from 'zustand/shallow';
import { SearchBox } from '@/_components';
import Tabs from '@/ToolJetUI/Tabs/Tabs';
import Tab from '@/ToolJetUI/Tabs/Tab';

export const WidgetManager = function WidgetManager({ componentTypes, zoomLevel, darkMode }) {
  const [filteredComponents, setFilteredComponents] = useState(componentTypes);

  const loadedModules = useEditorStore((state) => state.loadedModules);
  const moduleComponents = loadedModules.map((module) => {
    const moduleComponent = {
      ...find(componentTypes, { name: 'Module' }),
      moduleId: module.id,
      versionId: module.editing_version.id,
      environmentId: module.editing_version.current_environment_id,
      displayName: module.name,
    };

    return moduleComponent;
  });
  const [filteredModules, setFilteredModules] = useState(moduleComponents);
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();
  const { isVersionReleased, isEditorFreezed } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state.isVersionReleased,
      isEditorFreezed: state.isEditorFreezed,
    }),
    shallow
  );

  function handleSearchQueryChange(e) {
    const { value } = e.target;

    setSearchQuery(value);
    filterComponents(value);
  }

  function filterComponents(value) {
    if (value !== '') {
      const fuse = new Fuse(componentTypes, { keys: ['component'] });
      const results = fuse.search(value);
      setFilteredComponents(results.map((result) => result.item));
    } else {
      setFilteredComponents(componentTypes);
    }
  }

  function renderComponentCard(component, index) {
    return <DraggableBox key={index} index={index} component={component} zoomLevel={zoomLevel} />;
  }

  function renderList(header, items) {
    if (isEmpty(items)) return null;
    return (
      <div className="component-card-group-container">
        <span className="widget-header">{header}</span>
        <div className="component-card-group-wrapper">
          {items.map((component, i) => renderComponentCard(component, i))}
        </div>
      </div>
    );
  }

  function segregateSections() {
    if (filteredComponents.length === 0) {
      return (
        <div className="empty">
          <p className="empty-title">{t('widgetManager.noResults', 'No results found')}</p>
          <p className={`empty-subtitle ${darkMode ? 'text-white-50' : 'text-secondary'}`}>
            {t(
              'widgetManager.tryAdjustingFilterMessage',
              "Try adjusting your search or filter to find what you're looking for."
            )}
          </p>
          <button
            className=" btn-sm tj-tertiary-btn mt-3"
            onClick={() => {
              setFilteredComponents(componentTypes);
              setSearchQuery('');
            }}
          >
            {t('widgetManager.clearQuery', 'clear query')}
          </button>
        </div>
      );
    }
    const commonSection = { title: t('widgetManager.commonlyUsed', 'commonly used'), items: [] };
    const layoutsSection = { title: t('widgetManager.layouts', 'layouts'), items: [] };
    const formSection = { title: t('widgetManager.forms', 'forms'), items: [] };
    const integrationSection = { title: t('widgetManager.integrations', 'integrations'), items: [] };
    const otherSection = { title: t('widgetManager.others', 'others'), items: [] };
    const allWidgets = [];

    const commonItems = ['Table', 'Chart', 'Button', 'Text', 'Datepicker'];
    const formItems = [
      'Form',
      'TextInput',
      'NumberInput',
      'PasswordInput',
      'Textarea',
      'ToggleSwitch',
      'Dropdown',
      'Multiselect',
      'RichTextEditor',
      'Checkbox',
      'Radio-button',
      'Datepicker',
      'DateRangePicker',
      'FilePicker',
      'StarRating',
    ];
    const integrationItems = ['Map'];
    const layoutItems = ['Container', 'Listview', 'Tabs', 'Modal'];
    const itemsToAvoid = ['Module'];

    filteredComponents.forEach((f) => {
      if (searchQuery && !itemsToAvoid.includes(f.name)) allWidgets.push(f);
      if (commonItems.includes(f.name)) commonSection.items.push(f);
      if (formItems.includes(f.name)) formSection.items.push(f);
      else if (integrationItems.includes(f.name)) integrationSection.items.push(f);
      else if (layoutItems.includes(f.name)) layoutsSection.items.push(f);
      else otherSection.items.push(f);
    });

    if (allWidgets.length > 0) {
      return <>{renderList(undefined, allWidgets)}</>;
    } else {
      return (
        <>
          {renderList(commonSection.title, commonSection.items)}
          {renderList(layoutsSection.title, layoutsSection.items)}
          {renderList(formSection.title, formSection.items)}
          {renderList(otherSection.title, otherSection.items)}
          {renderList(integrationSection.title, integrationSection.items)}
        </>
      );
    }
  }

  function modulesTabContent() {
    return <>{renderList(undefined, moduleComponents)}</>;
  }

  return (
    <div className={`components-container ${(isVersionReleased || isEditorFreezed) && 'disabled'}`}>
      <div className="widgets-list col-sm-12 col-lg-12 row">
        <Tabs defaultActiveKey={'components'} id="inspector">
          <Tab eventKey="components" title="Components">
            <div className="input-icon tj-app-input">
              <SearchBox
                dataCy={`widget-search-box`}
                initialValue={''}
                callBack={(e) => handleSearchQueryChange(e)}
                onClearCallback={() => {
                  setSearchQuery('');
                  filterComponents('');
                }}
                placeholder={t('globals.searchComponents', 'Search widgets')}
                customClass={`tj-widgets-search-input  tj-text-xsm`}
                showClearButton={false}
                width={263}
              />
            </div>
            {segregateSections()}
          </Tab>
          <Tab eventKey="modules" title="Modules">
            <div className="input-icon tj-app-input">
              <SearchBox
                dataCy={`widget-search-box`}
                initialValue={''}
                callBack={(e) => handleSearchQueryChange(e)}
                onClearCallback={() => {
                  setSearchQuery('');
                  filterComponents('');
                }}
                placeholder={t('globals.searchComponents', 'Search widgets')}
                customClass={`tj-widgets-search-input  tj-text-xsm`}
                showClearButton={false}
                width={263}
              />
            </div>
            {modulesTabContent()}
          </Tab>
        </Tabs>
      </div>
    </div>
  );
};
