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
import DataSourceIcon from '../../DataSourceIcon';

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
  const sourceData = find(editorSession.dataSources, { kind: queryData.kind });

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

  return (
    <div className="query-node">
      <div className="body">
        <div className="grid">
          <div className="row" style={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'row' }}>
            <div className={`input-icon ${props.darkMode ? 'dark' : ''}`}>
              <DataSourceIcon source={sourceData} />
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
            <QueryBuilder
              pluginSchema={schema}
              isEditMode={true}
              queryName={'RunJS'}
              options={queryData.options}
              currentState={{}}
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
              <div style={{ width: '100%', height: '400px', overflow: 'scroll' }}>
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
