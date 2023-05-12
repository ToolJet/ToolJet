import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Handle } from 'reactflow';
import { allSources } from '../../../../Editor/QueryManager/QueryEditors';
import Select from 'react-select';
import WorkflowEditorContext from '../../../context';
import { capitalize, isUndefined, find } from 'lodash';
import { generateQueryName } from '../../../utils';
import JSONTreeViewer from '@/_ui/JSONTreeViewer';
import EditIcon from '../../../../Editor/Icons/edit.svg';
import { EditorContext } from '@/Editor/Context/EditorContextWrapper';

import './styles.scss';

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
  runpy: {},
};

export default function QueryNode(props) {
  const { exposeToCodeHinter } = useContext(EditorContext) || {};
  const { editorSession, updateQuery } = useContext(WorkflowEditorContext);
  const { data: nodeData, id } = props;
  const queryData = find(editorSession.queries, { idOnDefinition: nodeData.idOnDefinition });

  if (isUndefined(queryData)) {
    return <>loading..</>;
  }

  const QueryBuilder = useMemo(() => allSources[capitalize(queryData.kind)], [queryData.kind]);
  const schema = useMemo(() => staticDataSourceSchemas[queryData.kind], [queryData.kind]);

  const [queryName, setQueryName] = useState(queryData.name);

  const dataSourceOptions = editorSession.dataSources.map((source) => ({
    label: capitalize(source.kind),
    value: source.kind,
  }));

  const selectedOption = find(dataSourceOptions, { value: queryData.kind });

  const onQueryTypeChange = (option) => {
    const dataSource = find(editorSession.dataSources, { kind: option.value });
    updateQuery(queryData.idOnDefinition, {
      dataSourceId: dataSource.id,
      kind: dataSource.kind,
      name: generateQueryName(dataSource.kind, editorSession.queries),
    });
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

  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (executionDetails?.executed) setShowResult(true);
  }, [executionDetails]);

  const currentState = Object.fromEntries(editorSession.queries.map((query) => [query.name, {}]));

  useEffect(() => {
    exposeToCodeHinter((prevState) => ({ ...prevState, ...currentState }));
  }, [JSON.stringify(currentState)]);

  return (
    <div className="query-node">
      <div className="left-handle">
        <Handle
          type="target"
          position="left"
          isValidConnection={(_connection) => true}
          style={{ background: '#000' }}
          className="node-handle"
        />
      </div>
      <div className="body">
        <div className="grid">
          <div className="row" style={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'row' }}>
            <div className={`input-icon ${props.darkMode ? 'dark' : ''}`}>
              <input
                type="text"
                onChange={(e) => setQueryName(e.target.value)}
                onBlur={(e) =>
                  updateQuery(queryData.idOnDefinition, {
                    ...queryData,
                    name: e.target.value,
                  })
                }
                className="form-control-plaintext form-control-plaintext-sm"
                value={queryName}
                style={{ fontSize: 'medium' }}
              />
              <span className="input-icon-addon">
                <EditIcon />
              </span>
            </div>
            <div className="results-switch mt-1" style={{ width: 100 }}>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="flexSwitchCheckDefault"
                  checked={showResult}
                  onChange={() => setShowResult((prevValue) => !prevValue)}
                />
                <label className="form-check-label" for="flexSwitchCheckDefault">
                  Results
                </label>
              </div>
            </div>
          </div>
          <div className="row">
            <Select
              value={selectedOption}
              options={dataSourceOptions}
              className="datasource-selector nodrag"
              onChange={onQueryTypeChange}
            />
          </div>
          <div className="row">
            {!showResult ? (
              <QueryBuilder
                pluginSchema={schema}
                isEditMode={true}
                queryName={'RunJS'}
                options={queryData.options}
                currentState={currentState}
                optionsChanged={(options) => updateQuery(queryData.idOnDefinition, { options })}
                optionchanged={(key, value) =>
                  updateQuery(queryData.idOnDefinition, {
                    ...queryData,
                    options: { ...queryData.options, [key]: value },
                  })
                }
                disableMenuPortal={true}
              />
            ) : (
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
            )}
          </div>
        </div>
      </div>
      <div className="right-handle">
        <Handle
          type="source"
          position="right"
          isValidConnection={(_connection) => true}
          style={{ background: '#000' }}
          className="node-handle"
        />
      </div>
    </div>
  );
}
