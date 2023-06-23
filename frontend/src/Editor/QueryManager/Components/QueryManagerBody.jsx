import React, { useEffect, useState, useRef, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import cx from 'classnames';
import { capitalize, isEqual, debounce } from 'lodash';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import { allSources, source } from '../QueryEditors';
import DataSourceLister from './DataSourceLister';
import { Transformation } from './Transformation';
import Preview from './Preview';
import { ChangeDataSource } from './ChangeDataSource';
import { CustomToggleSwitch } from './CustomToggleSwitch';
import AddGlobalDataSourceButton from './AddGlobalDataSourceButton';
import EmptyGlobalDataSources from './EmptyGlobalDataSources';
import { EventManager } from '@/Editor/Inspector/EventManager';
import { allOperations } from '@tooljet/plugins/client';
import { staticDataSources, customToggles, mockDataQueryAsComponent, schemaUnavailableOptions } from '../constants';
import { DataSourceTypes } from '../../DataSourceManager/SourceComponents';

import { useDataSources, useGlobalDataSources } from '@/_stores/dataSourcesStore';
import { useDataQueries, useDataQueriesActions } from '@/_stores/dataQueriesStore';
import {
  useUnsavedChanges,
  useSelectedQuery,
  useSelectedDataSource,
  useQueryPanelActions,
} from '@/_stores/queryPanelStore';

export const QueryManagerBody = forwardRef(
  (
    {
      darkMode,
      mode,
      dataSourceModalHandler,
      options,
      currentState,
      previewLoading,
      queryPreviewData,
      allComponents,
      apps,
      appDefinition,
      createDraftQuery,
      setOptions,
      isVersionReleased,
      appId,
      editingVersionId,
    },
    ref
  ) => {
    const { t } = useTranslation();
    const dataQueries = useDataQueries();
    const dataSources = useDataSources();
    const globalDataSources = useGlobalDataSources();
    const selectedQuery = useSelectedQuery();
    const isUnsavedQueriesAvailable = useUnsavedChanges();
    const selectedDataSource = useSelectedDataSource();
    const { setSelectedDataSource, setUnSavedChanges, setPreviewData } = useQueryPanelActions();
    const { changeDataQuery, updateDataQuery, createDataQuery } = useDataQueriesActions();

    const [dataSourceMeta, setDataSourceMeta] = useState(null);

    const autoUpdateDataQuery = debounce(updateDataQuery, 500);

    const queryName = selectedQuery?.name ?? '';
    const sourcecomponentName = selectedDataSource?.kind?.charAt(0).toUpperCase() + selectedDataSource?.kind?.slice(1);

    const ElementToRender = selectedDataSource?.pluginId ? source : allSources[sourcecomponentName];

    const defaultOptions = useRef({});

    useEffect(() => {
      setDataSourceMeta(
        selectedQuery?.pluginId
          ? selectedQuery?.manifestFile?.data?.source
          : DataSourceTypes.find((source) => source.kind === selectedQuery?.kind)
      );
      defaultOptions.current = selectedQuery?.options;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedQuery]);

    const computeQueryName = (kind) => {
      const currentQueriesForKind = dataQueries.filter((query) => query.kind === kind);
      let currentNumber = currentQueriesForKind.length + 1;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const newName = `${kind}${currentNumber}`;
        if (dataQueries.find((query) => query.name === newName) === undefined) {
          return newName;
        }
        currentNumber += 1;
      }
    };

    const changeDataSource = (source) => {
      const isSchemaUnavailable = Object.keys(schemaUnavailableOptions).includes(source.kind);
      let newOptions = {};

      if (isSchemaUnavailable) {
        newOptions = {
          ...{ ...schemaUnavailableOptions[source.kind] },
          ...(source?.kind != 'runjs' && { transformationLanguage: 'javascript', enableTransformation: false }),
        };
      } else {
        const selectedSourceDefault =
          source?.plugin?.operationsFile?.data?.defaults ?? allOperations[capitalize(source.kind)]?.defaults;
        if (selectedSourceDefault) {
          newOptions = {
            ...{ ...selectedSourceDefault },
            ...(source?.kind != 'runjs' && { transformationLanguage: 'javascript', enableTransformation: false }),
          };
        } else {
          newOptions = {
            ...(source?.kind != 'runjs' && { transformationLanguage: 'javascript', enableTransformation: false }),
          };
        }
      }

      const newQueryName = computeQueryName(source.kind);
      defaultOptions.current = { ...newOptions };

      setOptions({ ...newOptions });

      createDataQuery(appId, editingVersionId, options, source.kind, newQueryName, source, false);
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

    const removeRestKey = (options) => {
      delete options.arrayValuesChanged;
      return options;
    };

    const validateNewOptions = (newOptions, shouldNotAutoSave) => {
      const headersChanged = newOptions.arrayValuesChanged ?? false;
      const updatedOptions = cleanFocusedFields(newOptions);
      let isFieldsChanged = false;
      if (selectedQuery) {
        const isQueryChanged = !isEqual(removeRestKey(updatedOptions), removeRestKey(defaultOptions.current));
        if (isQueryChanged) {
          isFieldsChanged = true;
        } else if (selectedQuery?.kind === 'restapi') {
          if (headersChanged) {
            isFieldsChanged = true;
          }
        }
      }
      setOptions((options) => ({ ...options, ...updatedOptions }));
      updateDataQuery({ ...options, ...updatedOptions });
    };

    const optionchanged = (option, value, shouldNotAutoSave) => {
      const newOptions = { ...options, [option]: value };
      validateNewOptions(newOptions, shouldNotAutoSave);
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

    const renderDataSourcesList = () => (
      <div
        className={cx(`datasource-picker`, {
          'disabled ': isVersionReleased,
        })}
      >
        <label className="form-label col-md-3" data-cy={'label-select-datasource'} style={{ fontWeight: 500 }}>
          Datasource
        </label>

        <DataSourceLister
          dataSources={dataSources}
          staticDataSources={staticDataSources}
          globalDataSources={globalDataSources}
          changeDataSource={changeDataSource}
          handleBackButton={handleBackButton}
          darkMode={darkMode}
          dataSourceModalHandler={dataSourceModalHandler}
        />
      </div>
    );

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
            <Preview
              previewPanelRef={ref}
              previewLoading={previewLoading}
              queryPreviewData={queryPreviewData}
              darkMode={darkMode}
            />
          </div>
        </div>
      );
    };

    const renderEventManager = () => {
      const queryComponent = mockDataQueryAsComponent(options?.events || []);
      return (
        <>
          <div
            className={`border-top query-manager-border-color hr-text-left px-4 ${
              darkMode ? 'color-white' : 'color-light-slate-12'
            }`}
            style={{ paddingTop: '28px' }}
          >
            {t('editor.queryManager.eventsHandler', 'Events Handler')}
          </div>
          <div className="query-manager-events px-4 mt-2 pb-4">
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
                appDefinition?.pages ? Object.entries(appDefinition?.pages).map(([id, page]) => ({ ...page, id })) : []
              }
            />
          </div>
        </>
      );
    };

    const renderCustomToggle = ({ dataCy, action, translatedLabel, label }, index) => (
      <div className={cx('mx-4', { 'pb-3 pt-3': index === 1 })}>
        <CustomToggleSwitch
          dataCy={dataCy}
          isChecked={selectedQuery?.options?.[action]}
          toggleSwitchFunction={toggleOption}
          action={action}
          darkMode={darkMode}
          label={t(translatedLabel, label)}
        />
      </div>
    );

    const renderQueryOptions = () => {
      return (
        <div
          className={cx(`advanced-options-container font-weight-400 border-top query-manager-border-color`, {
            'disabled ': isVersionReleased,
          })}
        >
          <div className="advance-options-input-form-container">
            {Object.keys(customToggles).map((toggle, index) => (
              <CustomToggleFlag
                {...customToggles[toggle]}
                toggleOption={toggleOption}
                value={selectedQuery?.options?.[customToggles[toggle]?.action]}
                index={index}
                key={toggle}
              />
            ))}
            {/* <CustomToggleFlags options={selectedQuery?.options} darkMode={darkMode} toggleOption={toggleOption} /> */}
          </div>
          {renderEventManager()}
        </div>
      );
    };

    const renderChangeDataSource = () => {
      return (
        <div className="mt-2 pb-4 row">
          <div
            className={`border-top query-manager-border-color px-4 hr-text-left py-2 ${
              darkMode ? 'color-white' : 'color-light-slate-12'
            }`}
          >
            Change Datasource
          </div>
          <div className="col-md-9">
            <ChangeDataSource
              dataSources={[...globalDataSources, ...dataSources]}
              value={selectedDataSource}
              selectedQuery={selectedQuery}
              onChange={(newDataSource) => {
                changeDataQuery(newDataSource);
              }}
            />
          </div>
        </div>
      );
    };

    return (
      <div
        className={`row row-deck px-2 mt-0 query-details ${
          selectedDataSource?.kind === 'tooljetdb' ? 'tooljetdb-query-details' : ''
        }`}
      >
        {selectedQuery?.data_source_id && mode === 'edit' && selectedDataSource !== null
          ? renderChangeDataSource()
          : null}

        {selectedDataSource === null ? renderDataSourcesList() : renderQueryElement()}
        {selectedDataSource !== null ? renderQueryOptions() : null}
      </div>
    );
  }
);

const CustomToggleFlag = ({ dataCy, action, translatedLabel, label, value, toggleOption, darkMode, index }) => {
  const [flag, setFlag] = useState(false);

  const { t } = useTranslation();

  useEffect(() => {
    setFlag(value);
  }, [value]);

  return (
    <div className={cx('mx-4', { 'pb-3 pt-3': index === 1 })}>
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
