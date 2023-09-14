import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import cx from 'classnames';
import { cloneDeep, isEmpty } from 'lodash';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import { allSources, source } from '../QueryEditors';
import DataSourcePicker from './DataSourcePicker';
import { Transformation } from './Transformation';
import Preview from './Preview';
import { ChangeDataSource } from './ChangeDataSource';
import { CustomToggleSwitch } from './CustomToggleSwitch';
import { EventManager } from '@/Editor/Inspector/EventManager';
import { staticDataSources, customToggles, mockDataQueryAsComponent, defaultSources } from '../constants';
import { DataSourceTypes } from '../../DataSourceManager/SourceComponents';
import { useDataSources, useGlobalDataSources } from '@/_stores/dataSourcesStore';
import { useDataQueriesActions, useDataQueriesStore } from '@/_stores/dataQueriesStore';
import { useSelectedQuery, useSelectedDataSource } from '@/_stores/queryPanelStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';
import SuccessNotificationInputs from './SuccessNotificationInputs';
import { canDeleteDataSource, canReadDataSource, canUpdateDataSource } from '@/_helpers';
import { useCurrentStateStore } from '@/_stores/currentStateStore';

export const QueryManagerBody = ({ darkMode, options, allComponents, apps, appDefinition, setOptions }) => {
  const { t } = useTranslation();
  const dataSources = useDataSources();
  const globalDataSources = useGlobalDataSources();
  const selectedQuery = useSelectedQuery();
  const selectedDataSource = useSelectedDataSource();
  const { changeDataQuery, updateDataQuery } = useDataQueriesActions();

  const currentState = useCurrentStateStore();

  const [dataSourceMeta, setDataSourceMeta] = useState(null);
  /* - Added the below line to cause re-rendering when the query is switched
       - QueryEditors are not updating when the query is switched
       - TODO: Remove the below line and make query editors update when the query is switched
       - Ref PR #6763
    */
  const [selectedQueryId, setSelectedQueryId] = useState(selectedQuery?.id);

  const queryName = selectedQuery?.name ?? '';
  const sourcecomponentName = selectedDataSource?.kind?.charAt(0).toUpperCase() + selectedDataSource?.kind?.slice(1);

  const ElementToRender = selectedDataSource?.pluginId ? source : allSources[sourcecomponentName];

  const defaultOptions = useRef({});

  const { isVersionReleased, isEditorFreezed } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state.isVersionReleased,
      isEditorFreezed: state.isEditorFreezed,
    }),
    shallow
  );

  useEffect(() => {
    setDataSourceMeta(
      selectedQuery?.pluginId
        ? selectedQuery?.manifestFile?.data?.source
        : DataSourceTypes.find((source) => source.kind === selectedQuery?.kind)
    );
    setSelectedQueryId(selectedQuery?.id);
    defaultOptions.current = selectedQuery?.options && JSON.parse(JSON.stringify(selectedQuery?.options));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQuery]);

  // Clear the focus field value from options
  const cleanFocusedFields = (newOptions) => {
    const diffFields = diff(newOptions, defaultOptions.current);
    const updatedOptions = { ...newOptions };
    Object.keys(diffFields).forEach((key) => {
      if (newOptions[key] === '' && defaultOptions.current[key] === undefined) {
        delete updatedOptions[key];
      }
    });
    return updatedOptions;
  };

  const validateNewOptions = (newOptions) => {
    const updatedOptions = cleanFocusedFields(newOptions);
    setOptions((options) => ({ ...options, ...updatedOptions }));

    updateDataQuery(cloneDeep({ ...options, ...updatedOptions }));
  };

  const optionchanged = (option, value) => {
    const newOptions = { ...options, [option]: value };
    validateNewOptions(newOptions);
  };

  const optionsChanged = (newOptions) => {
    validateNewOptions(newOptions);
  };

  const eventsChanged = (events) => {
    optionchanged('events', events);
    //added this here since the subscriber added in QueryManager component does not detect this change
    useDataQueriesStore
      .getState()
      .actions.saveData({ ...selectedQuery, options: { ...selectedQuery.options, events: events } });
  };

  const toggleOption = (option) => {
    const currentValue = selectedQuery?.options?.[option] ?? false;
    optionchanged(option, !currentValue);
  };

  const renderDataSourcesList = () => {
    return (
      <div
        className={cx(`datasource-picker p-0`, {
          'disabled ': isVersionReleased || isEditorFreezed,
        })}
      >
        <DataSourcePicker
          dataSources={dataSources}
          staticDataSources={staticDataSources}
          globalDataSources={globalDataSources}
          darkMode={darkMode}
        />
      </div>
    );
  };

  const renderTransformation = () => {
    if (
      dataSourceMeta?.disableTransformations ||
      selectedDataSource?.kind === 'runjs' ||
      selectedDataSource?.kind === 'runpy'
    )
      return;
    return (
      <Transformation
        changeOption={optionchanged}
        options={options ?? {}}
        currentState={currentState}
        darkMode={darkMode}
        queryId={selectedQuery?.id}
      />
    );
  };

  const handleBlur = () => {
    updateDataQuery(options);
  };

  const renderQueryElement = () => {
    return (
      <div style={{ padding: '0 32px' }}>
        <div>
          <div
            className={cx({
              'disabled ': isVersionReleased || isEditorFreezed,
            })}
          >
            <ElementToRender
              key={selectedQuery?.id}
              pluginSchema={selectedDataSource?.plugin?.operationsFile?.data}
              selectedDataSource={selectedDataSource}
              options={selectedQuery?.options}
              optionsChanged={optionsChanged}
              optionchanged={optionchanged}
              currentState={currentState}
              darkMode={darkMode}
              isEditMode={true} // Made TRUE always to avoid setting default options again
              queryName={queryName}
              onBlur={handleBlur} // Applies only to textarea, text box, etc. where `optionchanged` is triggered for every character change.
            />
            {renderTransformation()}
          </div>
        </div>
      </div>
    );
  };

  const renderEventManager = () => {
    const queryComponent = mockDataQueryAsComponent(options?.events || []);
    return (
      <div
        className={cx('d-flex', {
          'disabled ': isVersionReleased || isEditorFreezed,
        })}
      >
        <div className={`form-label`}>{t('editor.queryManager.eventsHandler', 'Events')}</div>
        <div className="query-manager-events pb-4 flex-grow-1">
          <EventManager
            eventsChanged={eventsChanged}
            component={queryComponent.component}
            componentMeta={queryComponent.componentMeta}
            currentState={currentState}
            components={allComponents}
            callerQueryId={selectedQueryId}
            apps={apps}
            popoverPlacement="top"
            pages={
              appDefinition?.pages
                ? Object.entries(appDefinition?.pages).map(([id, page]) => ({
                    ...page,
                    id,
                  }))
                : []
            }
          />
        </div>
      </div>
    );
  };

  const renderQueryOptions = () => {
    return (
      <div style={{ padding: '0 32px' }}>
        <div
          className={cx(`d-flex pb-1`, {
            'disabled ': isVersionReleased || isEditorFreezed,
          })}
        >
          <div className="form-label">{t('editor.queryManager.settings', 'Settings')}</div>
          <div className="flex-grow-1">
            {Object.keys(customToggles).map((toggle, index) => (
              <CustomToggleFlag
                {...customToggles[toggle]}
                toggleOption={toggleOption}
                value={selectedQuery?.options?.[customToggles[toggle]?.action]}
                index={index}
                key={toggle}
                darkMode={darkMode}
              />
            ))}
          </div>
        </div>
        <SuccessNotificationInputs
          currentState={currentState}
          options={options}
          darkMode={darkMode}
          optionchanged={optionchanged}
        />
        {renderEventManager()}
        <Preview darkMode={darkMode} />
      </div>
    );
  };

  const renderChangeDataSource = () => {
    const selectableDataSources = [...globalDataSources, ...dataSources].filter(
      (ds) => ds.kind === selectedQuery?.kind
    );
    if (isEmpty(selectableDataSources)) {
      return '';
    }
    return (
      <div className={cx('mt-2 d-flex px-4 mb-3', { 'disabled ': isVersionReleased })}>
        <div
          className={`d-flex query-manager-border-color hr-text-left py-2 form-label font-weight-500 change-data-source`}
        >
          Datasource
        </div>
        <div className="d-flex flex-grow-1">
          <ChangeDataSource
            dataSources={selectableDataSources}
            value={selectedDataSource}
            onChange={(newDataSource) => {
              changeDataQuery(newDataSource);
            }}
            isVersionReleased={isVersionReleased || isEditorFreezed}
          />
        </div>
      </div>
    );
  };

  if (selectedQueryId !== selectedQuery?.id) return;
  const hasPermissions =
    selectedDataSource?.scope === 'global'
      ? canUpdateDataSource(selectedQuery?.data_source_id) ||
        canReadDataSource(selectedQuery?.data_source_id) ||
        canDeleteDataSource()
      : true;

  return (
    <div
      className={`row row-deck px-2 mt-0 query-details ${
        selectedDataSource?.kind === 'tooljetdb' ? 'tooljetdb-query-details' : ''
      } ${!hasPermissions ? 'disabled' : ''}`}
    >
      {selectedQuery?.data_source_id && selectedDataSource !== null ? renderChangeDataSource() : null}

      {selectedDataSource === null || !selectedQuery ? renderDataSourcesList() : renderQueryElement()}
      {selectedDataSource !== null ? renderQueryOptions() : null}
    </div>
  );
};

const CustomToggleFlag = ({ dataCy, action, translatedLabel, label, value, toggleOption, darkMode, index }) => {
  const [flag, setFlag] = useState(false);

  const { t } = useTranslation();

  useEffect(() => {
    setFlag(value);
  }, [value]);

  return (
    <div className={cx({ 'pb-3 pt-3': index === 1 })}>
      <CustomToggleSwitch
        dataCy={dataCy}
        isChecked={flag}
        toggleSwitchFunction={(flag) => {
          setFlag((state) => !state);
          toggleOption(flag);
        }}
        action={action}
        darkMode={darkMode}
        label={t(translatedLabel, label)}
      />
    </div>
  );
};
