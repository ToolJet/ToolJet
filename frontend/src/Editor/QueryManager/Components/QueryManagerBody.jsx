import React, { useEffect, useState, useRef, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import cx from 'classnames';
import { capitalize, isEqual } from 'lodash';
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
import { CodeHinter } from '@/Editor/CodeBuilder/CodeHinter';
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
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';

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
    const { changeDataQuery } = useDataQueriesActions();

    const [dataSourceMeta, setDataSourceMeta] = useState(null);
    /* - Added the below line to cause re-rendering when the query is switched
       - QueryEditors are not updating when the query is switched
       - TODO: Remove the below line and make query editors update when the query is switched
       - Ref PR #6763
    */
    const [selectedQueryId, setSelectedQueryId] = useState(selectedQuery?.id);

    const queryName = selectedQuery?.name ?? '';
    const sourcecomponentName = selectedDataSource?.kind.charAt(0).toUpperCase() + selectedDataSource?.kind.slice(1);
    const ElementToRender = selectedDataSource?.pluginId ? source : allSources[sourcecomponentName];

    const defaultOptions = useRef({});
    const { isVersionReleased } = useAppVersionStore(
      (state) => ({
        isVersionReleased: state.isVersionReleased,
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

      setSelectedDataSource(source);
      setOptions({ ...newOptions });

      createDraftQuery(
        { ...source, data_source_id: source.id, name: newQueryName, id: 'draftQuery', options: { ...newOptions } },
        source
      );
    };

    // Clear the focus field value from options
    const cleanFocusedFields = (newOptions) => {
      const diffFields = diff(newOptions, defaultOptions.current);
      const updatedOptions = { ...newOptions };
      Object.keys(diffFields || {}).forEach((key) => {
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

    const validateNewOptions = (newOptions) => {
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
      if (isFieldsChanged !== isUnsavedQueriesAvailable) setUnSavedChanges(isFieldsChanged);
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
      const currentValue = options[option] ? options[option] : false;
      optionchanged(option, !currentValue);
    };

    const renderDataSources = (labelText, dataSourcesList, staticList = [], isGlobalDataSource = false) => {
      return (
        <div
          className={cx(`datasource-picker`, {
            'disabled ': isVersionReleased,
          })}
        >
          <label className="form-label col-md-3" data-cy={'label-select-datasource'}>
            {labelText}
          </label>
          {isGlobalDataSource && dataSourcesList?.length < 1 ? (
            <EmptyGlobalDataSources darkMode={darkMode} />
          ) : (
            <DataSourceLister
              dataSources={dataSourcesList}
              staticDataSources={staticList}
              changeDataSource={changeDataSource}
              handleBackButton={handleBackButton}
              darkMode={darkMode}
              dataSourceModalHandler={dataSourceModalHandler}
              showAddDatasourceBtn={isGlobalDataSource}
              dataSourceBtnComponent={isGlobalDataSource ? <AddGlobalDataSourceButton /> : null}
            />
          )}
        </div>
      );
    };

    const renderDataSourcesList = () => (
      <>
        {renderDataSources(
          t('editor.queryManager.selectDatasource', 'Select Datasource'),
          dataSources,
          staticDataSources
        )}
        {renderDataSources(
          t('editor.queryManager.selectGlobalDatasource', 'Select Global Datasource'),
          globalDataSources,
          [],
          true
        )}
      </>
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
                pluginSchema={selectedDataSource?.plugin?.operationsFile?.data}
                selectedDataSource={selectedDataSource}
                options={options}
                optionsChanged={optionsChanged}
                optionchanged={optionchanged}
                currentState={currentState}
                darkMode={darkMode}
                isEditMode={true} // Made TRUE always to avoid setting default options again
                queryName={queryName}
                mode={mode}
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

    const renderSuccessNotification = () => (
      <div className="mx-4" style={{ paddingLeft: '100px', paddingTop: '12px' }}>
        <div className="row mt-1">
          <div className="col-auto" style={{ width: '200px' }}>
            <label className="form-label p-2 font-size-12" data-cy={'label-success-message-input'}>
              {t('editor.queryManager.successMessage', 'Success Message')}
            </label>
          </div>
          <div className="col">
            <CodeHinter
              currentState={currentState}
              initialValue={options.successMessage}
              height="36px"
              theme={darkMode ? 'monokai' : 'default'}
              onChange={(value) => optionchanged('successMessage', value)}
              placeholder={t('editor.queryManager.queryRanSuccessfully', 'Query ran successfully')}
              cyLabel={'success-message'}
            />
          </div>
        </div>
        <div className="row mt-3">
          <div className="col-auto" style={{ width: '200px' }}>
            <label className="form-label p-2 font-size-12" data-cy={'label-notification-duration-input'}>
              {t('editor.queryManager.notificationDuration', 'Notification duration (s)')}
            </label>
          </div>
          <div className="col query-manager-input-elem">
            <input
              type="number"
              disabled={!options.showSuccessNotification}
              onChange={(e) => optionchanged('notificationDuration', e.target.value)}
              placeholder={5}
              className="form-control"
              value={options.notificationDuration}
              data-cy={'notification-duration-input-field'}
            />
          </div>
        </div>
      </div>
    );

    const renderCustomToggle = ({ dataCy, action, translatedLabel, label }, index) => (
      <div className={cx('mx-4', { 'pb-3 pt-3': index === 1 })}>
        <CustomToggleSwitch
          dataCy={dataCy}
          isChecked={options && options[action]}
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
            {Object.keys(customToggles).map((toggle, index) => renderCustomToggle(customToggles[toggle], index))}
            {options?.showSuccessNotification && renderSuccessNotification()}
          </div>
          {renderEventManager()}
        </div>
      );
    };

    const renderChangeDataSource = () => {
      return (
        <div
          className={cx(`mt-2 pb-4`, {
            'disabled ': isVersionReleased,
          })}
        >
          <div
            className={`border-top query-manager-border-color px-4 hr-text-left py-2 ${
              darkMode ? 'color-white' : 'color-light-slate-12'
            }`}
          >
            Change Datasource
          </div>
          <ChangeDataSource
            dataSources={[...globalDataSources, ...dataSources]}
            value={selectedDataSource}
            selectedQuery={selectedQuery}
            onChange={(newDataSource) => {
              changeDataQuery(newDataSource);
            }}
          />
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
        {selectedDataSource === null ? renderDataSourcesList() : renderQueryElement()}
        {selectedDataSource !== null ? renderQueryOptions() : null}
        {selectedQuery?.data_source_id && mode === 'edit' && selectedDataSource !== null
          ? renderChangeDataSource()
          : null}
      </div>
    );
  }
);
