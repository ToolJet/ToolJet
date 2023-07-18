import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import cx from 'classnames';
import { capitalize, cloneDeep, isEmpty } from 'lodash';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import { allSources, source } from '../QueryEditors';
import DataSourceLister from './DataSourceLister';
import { Transformation } from './Transformation';
import Preview from './Preview';
import { ChangeDataSource } from './ChangeDataSource';
import { CustomToggleSwitch } from './CustomToggleSwitch';
import { EventManager } from '@/Editor/Inspector/EventManager';
import { allOperations } from '@tooljet/plugins/client';
import { staticDataSources, customToggles, mockDataQueryAsComponent, schemaUnavailableOptions } from '../constants';
import { DataSourceTypes } from '../../DataSourceManager/SourceComponents';
import { useDataSources, useGlobalDataSources } from '@/_stores/dataSourcesStore';
import { useDataQueries, useDataQueriesActions } from '@/_stores/dataQueriesStore';
import {
  useSelectedQuery,
  useSelectedDataSource,
  useQueryPanelActions,
  useShowCreateQuery,
} from '@/_stores/queryPanelStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';

export const QueryManagerBody = ({
  darkMode,
  options,
  currentState,
  allComponents,
  apps,
  appDefinition,
  setOptions,
  appId,
  newQueryName,
}) => {
  const { t } = useTranslation();
  const dataQueries = useDataQueries();
  const dataSources = useDataSources();
  const globalDataSources = useGlobalDataSources();
  const selectedQuery = useSelectedQuery();
  const selectedDataSource = useSelectedDataSource();
  const { setPreviewData } = useQueryPanelActions();
  const { changeDataQuery, updateDataQuery, createDataQuery } = useDataQueriesActions();
  const [showCreateQuery, setShowCreateQuery] = useShowCreateQuery();

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

  const { isVersionReleased, editingVersionId } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state.isVersionReleased,
      editingVersionId: state.editingVersion?.id,
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

  const changeDataSource = (source) => {
    const isSchemaUnavailable = Object.keys(schemaUnavailableOptions).includes(source.kind);
    let newOptions = {};

    if (isSchemaUnavailable) {
      newOptions = {
        ...{ ...schemaUnavailableOptions[source.kind] },
        ...(source?.kind != 'runjs' && {
          transformationLanguage: 'javascript',
          enableTransformation: false,
        }),
      };
    } else {
      const selectedSourceDefault =
        source?.plugin?.operationsFile?.data?.defaults ?? allOperations[capitalize(source.kind)]?.defaults;
      if (selectedSourceDefault) {
        newOptions = {
          ...{ ...selectedSourceDefault },
          ...(source?.kind != 'runjs' && {
            transformationLanguage: 'javascript',
            enableTransformation: false,
          }),
        };
      } else {
        newOptions = {
          ...(source?.kind != 'runjs' && {
            transformationLanguage: 'javascript',
            enableTransformation: false,
          }),
        };
      }
    }

    defaultOptions.current = { ...newOptions };

    setOptions({ ...newOptions });

    createDataQuery(appId, editingVersionId, options, source.kind, newQueryName, source, false);
    setShowCreateQuery(false);
  };

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
    //Cloning and passing the updated `options` to prevent premature updates of the Zustand store before invoking actions.
    updateDataQuery(cloneDeep({ ...options, ...updatedOptions }));
  };

  const optionchanged = (option, value) => {
    const newOptions = { ...options, [option]: value };
    validateNewOptions(newOptions);
  };

  const optionsChanged = (newOptions) => {
    validateNewOptions(newOptions);
  };

  const handleBackButton = () => {
    setPreviewData(null);
  };

  const eventsChanged = (events) => {
    optionchanged('events', events);
  };

  const toggleOption = (option) => {
    const currentValue = selectedQuery?.options?.[option] ?? false;
    optionchanged(option, !currentValue);
  };

  const renderDataSourcesList = () => {
    if (!showCreateQuery) {
      return '';
    }

    return (
      <div
        className={cx(`datasource-picker`, {
          'disabled ': isVersionReleased,
        })}
      >
        <label className="form-label col-md-3 pb-1" data-cy={'label-select-datasource'} style={{ fontWeight: 500 }}>
          Datasource
        </label>

        <DataSourceLister
          dataSources={dataSources}
          staticDataSources={staticDataSources}
          globalDataSources={globalDataSources}
          changeDataSource={changeDataSource}
          handleBackButton={handleBackButton}
          darkMode={darkMode}
          isDisabled={!newQueryName}
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
              'disabled ': isVersionReleased,
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
      <div className="d-flex">
        <div className={`form-label`}>{t('editor.queryManager.eventsHandler', 'Events')}</div>
        <div className="query-manager-events pb-4 flex-grow-1">
          <EventManager
            eventsChanged={eventsChanged}
            component={queryComponent.component}
            componentMeta={queryComponent.componentMeta}
            currentState={currentState}
            dataQueries={dataQueries}
            components={allComponents}
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
      <div style={{ paddingLeft: '32px' }}>
        <div
          className={cx(`d-flex mb-3 pb-1`, {
            'disabled ': isVersionReleased,
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
      <div className={cx('mt-2 d-flex px-4', { 'disabled ': isVersionReleased })}>
        <div className={`d-flex query-manager-border-color hr-text-left py-2 form-label font-weight-500`}>
          Datasource
        </div>
        <div className="d-flex flex-grow-1">
          <ChangeDataSource
            dataSources={selectableDataSources}
            value={selectedDataSource}
            onChange={(newDataSource) => {
              changeDataQuery(newDataSource);
            }}
          />
        </div>
      </div>
    );
  };

  if (selectedQueryId !== selectedQuery?.id) return;

  return (
    <div
      className={`row row-deck px-2 mt-0 query-details ${
        selectedDataSource?.kind === 'tooljetdb' ? 'tooljetdb-query-details' : ''
      }`}
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
