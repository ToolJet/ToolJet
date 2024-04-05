import React, { useContext, useMemo, useState } from 'react';
import { allSources, source } from '../../../../Editor/QueryManager/QueryEditors';
import Select from 'react-select';
import WorkflowEditorContext from '../../../context';
import { capitalize, isUndefined, find } from 'lodash';
import { generateQueryName } from '../../../utils';
import JSONTreeViewer from '@/_ui/JSONTreeViewer';
import EditIcon from '../../../../Editor/Icons/edit.svg';
// import { EditorContext } from '@/Editor/Context/EditorContextWrapper';

import './styles.scss';
import DataSourceIcon from '../../DataSourceIcon';
import toast from 'react-hot-toast';

const staticDataSourceSchemas = {
  restapi: {
    method: 'get',
    url: '',
    url_params: [['', '']],
    headers: [['', '']],
    body: [['', '']],
    json_body: null,
    body_toggle: false,
  },
  stripe: {},
  tooljetdb: {
    operation: '',
  },
  runjs: {
    code: '',
  },
};

export default function QueryNode(props) {
  // const { exposeToCodeHinter } = useContext(EditorContext) || {};
  const { editorSession, updateQuery } = useContext(WorkflowEditorContext);
  const { data: nodeData, id, selectedNode } = props;
  const queryData = find(editorSession.queries, { idOnDefinition: nodeData.idOnDefinition });
  const sourceData = find(editorSession.dataSources, { id: queryData.data_source_id });

  const QueryBuilder = useMemo(() => {
    return (selectedNode.plugin !== undefined || selectedNode.plugin !== null) && selectedNode.pluginId !== undefined
      ? source
      : allSources[capitalize(queryData.kind)];
  }, [queryData.kind]);

  const schema = useMemo(() => {
    return (selectedNode.plugin !== undefined || selectedNode.plugin !== null) && selectedNode.pluginId !== undefined
      ? selectedNode?.plugin?.operationsFile?.data
      : staticDataSourceSchemas[queryData.kind];
  }, [queryData.kind]);

  const [queryName, setQueryName] = useState(queryData.name);

  const validateQueryName = (name) => {
    const existingNodes = editorSession.queries.filter((node) => node.idOnDefinition !== queryData.idOnDefinition);
    return !existingNodes.some((node) => node.name === name);
  };

  const handleQueryNameChange = (e) => {
    const name = e.target.value;

    if (!validateQueryName(name)) {
      toast.error('Query name already exists');
    }
    setQueryName(name);
  };

  const handleOnBlurQueryName = (e) => {
    const name = e.target.value;

    if (!validateQueryName(name)) {
      toast('⚠️ Unable to update query name.');

      return;
    }

    updateQuery(queryData.idOnDefinition, {
      ...queryData,
      name: name,
    });
  };

  const dataSourceOptions = editorSession.dataSources.map((source) => ({
    label: source.name,
    value: source.type === 'static' ? source.name : source.id,
    kind: source.kind,
    type: source.type,
  }));

  const selectedOption =
    find(dataSourceOptions, { value: queryData.data_source_id }) ||
    find(dataSourceOptions, { type: 'static', kind: queryData.kind });

  const onQueryTypeChange = (option) => {
    const dataSource =
      option.type === 'static'
        ? find(editorSession.dataSources, { type: 'static', kind: option.kind })
        : find(editorSession.dataSources, { id: option.value, kind: option.kind });

    const queryName = generateQueryName(dataSource.kind, editorSession.queries);
    updateQuery(queryData.idOnDefinition, {
      id: queryData.id,
      kind: dataSource.kind,
      type: dataSource.type,
      data_source_id: dataSource.id,
      name: queryName,
    });

    setQueryName(queryName);
  };

  const executionDetails = useMemo(() => {
    const details = find(editorSession.execution.nodes, { id_on_definition: id }) ?? {};
    const result = details?.result ?? '{}';
    try {
      const parsedResult = JSON.parse(result);
      return { ...details, result: parsedResult };
    } catch (e) {
      return { ...details, result: {} };
    }
  }, [editorSession.execution.nodes, id]);

  if (isUndefined(queryData)) {
    return <>loading..</>;
  }

  return (
    <div className="query-node">
      <div className="body">
        <div className="grid workflows-query-node">
          <div className="row" style={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'row' }}>
            <div className={`input-icon ${props.darkMode ? 'dark' : ''}`}>
              <DataSourceIcon source={sourceData} />
              <input
                type="text"
                onChange={handleQueryNameChange}
                onBlur={handleOnBlurQueryName}
                className="form-control-plaintext form-control-plaintext-sm"
                value={queryName}
                style={{ fontSize: 'medium' }}
              />
              <span className="input-icon-addon">
                <EditIcon />
              </span>
            </div>
          </div>
          <div className="row">
            <Select
              value={selectedOption}
              options={dataSourceOptions.filter((ds) => ds.kind == selectedOption.kind)}
              className="datasource-selector nodrag"
              onChange={onQueryTypeChange}
            />
          </div>
          <div className="row content-section">
            <QueryBuilder
              pluginSchema={schema}
              isEditMode={true}
              queryName={'workflowNode'}
              options={queryData.options}
              currentState={{}}
              selectedDataSource={sourceData}
              optionsChanged={(options) => updateQuery(queryData.idOnDefinition, { options })}
              optionchanged={(key, value) =>
                updateQuery(queryData.idOnDefinition, {
                  ...queryData,
                  options: { ...queryData.options, [key]: value },
                })
              }
              disableMenuPortal={true}
            />
            <div className="result-section">
              <label className="result-label">Results</label>
              <div style={{ width: '100%', height: '300px' }}>
                <JSONTreeViewer
                  data={executionDetails.result}
                  useIcons={false}
                  useIndentedBlock={true}
                  enableCopyToClipboard={false}
                  useActions={false}
                  actionIdentifier="id"
                  expandWithLabels={true}
                  fontSize={'10px'}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
