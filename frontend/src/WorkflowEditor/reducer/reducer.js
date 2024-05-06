import { v4 as uuidv4 } from 'uuid';
import { defaultQueryNode, defaultIfConditionNode, query } from './defaults';
import { find } from 'lodash';

export const Modes = {
  Editing: 'Editing',
  Running: 'Running',
};

export const ServerDataStates = {
  NotFetched: 'NotFetched',
  Fetching: 'Fetching',
  Fetched: 'Fetched',
  Failed: 'Failed',
};

const staticDataSources = [
  { kind: 'restapi', id: 'null', name: 'restapi', type: 'static' },
  { kind: 'runjs', id: 'null', name: 'runjs', type: 'static' },
  { kind: 'tooljetdb', id: 'null', name: 'tooljetdb', type: 'static' },
];

export const initialState = ({ appId, appVersionId }) => ({
  app: {
    id: appId,
    versionId: appVersionId,
    name: 'Untitled workflow',
    flow: {
      nodes: [
        {
          id: uuidv4(),
          data: { nodeType: 'start', label: 'Start trigger' },
          position: { x: 100, y: 250 },
          type: 'input',
          sourcePosition: 'right',
          deletable: false,
        },
        {
          id: uuidv4(),
          data: { nodeType: 'result', label: 'Result', code: 'return ({})' },
          position: { x: 650, y: 250 },
          type: 'output',
          targetPosition: 'left',
          deletable: false,
        },
      ],
      edges: [],
    },
  },
  queries: [],
  stateHistory: [],
  stateFuture: [],
  historyIndex: null,
  mode: Modes.Editing,
  editingActivity: { type: 'IDLE' },
  appSavingStatus: {
    status: false,
    lastSavedTime: Date.now(),
  },
  dataSources: [...Object.values(staticDataSources)],
  bootupComplete: false,
  execution: {
    nodes: [],
    logs: [],
  },
  executionHistoryLoadingStatus: ServerDataStates.NotFetched,
  executionHistory: [],
  leftDrawer: {
    display: '',
  },
  logsConsole: {
    logs: [],
    display: false,
    showingHistoricalLogs: false,
  },
  webhookEnable: {
    value: false,
  },
  parameters: [],
  bodyParameters: [],
  testParameters: '',
  workflowToken: '',
  currentWebhookEnvironment: 'development',
});

export const reducer = (state = initialState(), { payload, type }) => {
  console.log('reducer', { type, payload, state });
  switch (type) {
    case 'SET_APP_ID': {
      return { ...state, app: { ...state.app, id: payload.id } };
    }
    case 'SET_APP_VERSION_ID': {
      return { ...state, app: { ...state.app, versionId: payload.versionId } };
    }
    case 'SET_APP_NAME': {
      const { name } = payload;
      return { ...state, app: { ...state.app, name: name } };
    }
    case 'SET_MAINTENANCE_STATUS': {
      return { ...state, maintenance: payload.status };
    }
    case 'SET_DATA_SOURCES': {
      return { ...state, dataSources: [...state.dataSources, ...payload.dataSources] };
    }
    case 'SET_ENVIRONMENTS': {
      return { ...state, environments: [...payload.environments] };
    }
    case 'GET_WORKFLOW_API_TOKEN': {
      return { ...state, workflowToken: payload.token };
    }

    case 'UPDATE_FLOW': {
      return {
        ...state,
        app: { ...state.app, flow: payload.flow },
      };
    }

    case 'SET_UNDO': {
      const { previousState } = payload;
      return {
        ...previousState,
        stateFuture: [state, ...state.stateFuture],
      };
    }

    case 'SET_REDO': {
      const { nextState } = payload;
      return {
        ...nextState,
        stateHistory: [...state.stateHistory, state],
      };
    }

    case 'UPDATE_NODES': {
      const { nodes } = payload;

      return {
        ...state,
        app: {
          ...state.app,
          flow: {
            ...state.app.flow,
            nodes,
          },
        },
      };
    }

    case 'UPDATE_EDGES': {
      const { edges } = payload;

      return {
        ...state,
        app: {
          ...state.app,
          flow: {
            ...state.app.flow,
            edges,
          },
        },
      };
    }

    case 'ADD_NEW_NODE': {
      const { node, type } = payload;
      const newNode = {
        ...(type === 'query' ? defaultQueryNode : defaultIfConditionNode),
        ...node,
        // disable to delete by keyboard
        deletable: false,
      };

      return {
        ...state,
        app: {
          ...state.app,
          flow: {
            ...state.app.flow,
            nodes: [...state.app.flow.nodes, newNode],
          },
        },
      };
    }

    case 'UPDATE_NODE': {
      const { id, data, rest } = payload;
      const existingNode = find(state.app.flow.nodes, { id });

      const newNode = {
        ...existingNode,
        data: {
          ...existingNode.data,
          ...data,
        },
        ...rest,
      };

      const nodes = state.app.flow.nodes.map((iteratingNode) => (iteratingNode.id === id ? newNode : iteratingNode));

      return {
        ...state,
        app: {
          ...state.app,
          flow: {
            ...state.app.flow,
            nodes,
          },
        },
      };
    }

    case 'ADD_NEW_EDGE': {
      const { edge } = payload;

      return {
        ...state,
        app: {
          ...state.app,
          flow: {
            ...state.app.flow,
            edges: [...state.app.flow.edges, edge],
          },
        },
      };
    }

    case 'REMOVE_EDGE': {
      const { edge: edgeToBeRemoved } = payload;
      return {
        ...state,
        app: {
          ...state.app,
          flow: {
            ...state.app.flow,
            edges: state.app.flow.edges.filter(
              (edge) => edge.source === edgeToBeRemoved.source && edge.target === edgeToBeRemoved.target
            ),
          },
        },
      };
    }

    case 'SET_FLOW_BUILDER_EDITING_ACTIVITY': {
      const { editingActivity } = payload;

      return {
        ...state,
        editingActivity,
      };
    }

    case 'SET_APP_SAVING_STATUS': {
      const { status } = payload;
      return {
        ...state,
        appSavingStatus: {
          ...state.appSavingStatus,
          status,
          lastSavedTime: !status ? Date.now() : state.appSavingStatus?.lastSavedTime,
        },
      };
    }

    case 'ADD_NEW_QUERY': {
      const { query, edit } = payload;

      return {
        ...state,
        queries: [...state.queries, query],
        stateHistory: [...state.stateHistory, edit],
        stateFuture: [],
      };
    }

    case 'GET_WEBHOOK_ENV': {
      const { value } = payload;

      return {
        ...state,
        currentWebhookEnvironment: value,
      };
    }

    case 'UPDATE_QUERY': {
      const { query: newQuery, id } = payload;

      // FIXME: If we revise backend to send both static and global
      // datasources we can avoid initializing static datasources
      // in the init state of this reducer. This will simplify mapping
      // query -> datasource with just datasource id
      const isStaticDataSource = !!state.queries.find((q) => q.kind === newQuery.kind && q.type === 'static');
      const addIdForStaticDataSourcesIfNull = (query, dataSources) => {
        return dataSources.map((ds) => {
          if (ds.id === 'null' && ds.kind === query.kind) {
            return { ...ds, id: query.data_source_id };
          } else {
            return ds;
          }
        });
      };
      if (isStaticDataSource) {
        state.dataSources = addIdForStaticDataSourcesIfNull(newQuery, state.dataSources);
      }

      return {
        ...state,
        queries: state.queries.map((query) => (query.idOnDefinition === id ? { ...query, ...newQuery } : query)),
      };
    }

    case 'SET_QUERIES': {
      const { queries, edit } = payload;
      const filteredObject = {};

      for (const key in edit) {
        if (edit[key] !== undefined) {
          filteredObject[key] = edit[key];
        }
      }
      const newStateHistory = [...state.stateHistory];
      if (Object.keys(filteredObject).length > 0) {
        newStateHistory.push(filteredObject);
      }

      return {
        ...state,
        queries,
        stateHistory: newStateHistory,
      };
    }

    case 'SET_BOOTUP_COMPLETE': {
      const { status } = payload;

      return {
        ...state,
        bootupComplete: status,
      };
    }

    case 'SET_MODE': {
      const { mode } = payload;

      return {
        ...state,
        mode,
      };
    }

    case 'SET_EXECUTION_ID': {
      const { id } = payload;

      return {
        ...state,
        execution: {
          ...state.execution,
          id,
        },
      };
    }

    case 'UPDATE_EXECUTION_STATUS': {
      const { nodes } = payload;

      return {
        ...state,
        execution: {
          ...state.execution,
          nodes: nodes,
        },
      };
    }

    case 'SET_EXECUTION_HISTORY_LOADING_STATUS': {
      const { status } = payload;

      return {
        ...state,
        executionHistoryLoadingStatus: status,
      };
    }

    case 'SET_EXECUTION_HISTORY': {
      const { history } = payload;

      return {
        ...state,
        executionHistory: history,
      };
    }

    case 'SET_EXECUTION_LOGS': {
      const { logs } = payload;

      return {
        ...state,
        execution: {
          ...state.execution,
          logs,
        },
        logsConsole: {
          ...state.logsConsole,
          logs,
        },
      };
    }

    case 'TOGGLE_LEFT_DRAWER': {
      const { displayType } = payload;
      return {
        ...state,
        leftDrawer: {
          ...state.leftDrawer,
          display: displayType ?? '',
        },
      };
    }

    case 'HIDE_LEFT_DRAWER': {
      return {
        ...state,
        leftDrawer: {
          ...state.leftDrawer,
          display: '',
        },
      };
    }

    case 'TOGGLE_LOGS_CONSOLE': {
      return {
        ...state,
        logsConsole: {
          ...state.logsConsole,
          display: !state.logsConsole.display,
        },
      };
    }

    case 'DISPLAY_LOGS_CONSOLE': {
      const { display } = payload;

      return {
        ...state,
        logsConsole: {
          ...state.logsConsole,
          display,
        },
      };
    }

    case 'SHOW_HISTORICAL_LOGS': {
      const { executionId } = payload;

      const logs = find(state.executionHistory, { id: executionId }).logs;

      return {
        ...state,
        logsConsole: {
          ...state.logsConsole,
          showingHistoricalLogs: true,
          executionId,
          display: true,
          logs,
        },
      };
    }

    case 'CLEAR_LOGS_CONSOLE': {
      return {
        ...state,
        logsConsole: {
          ...state.logsConsole,
          logs: [],
        },
      };
    }

    case 'TOGGLE_WEBHOOK_ENABLE': {
      const { value } = payload;
      return {
        ...state,
        webhookEnable: {
          ...state.webhookEnable,
          value,
        },
      };
    }

    case 'GET_PAREMETER_VALUE': {
      const { value } = payload;
      const validObjects = value?.filter((item) => item.key.trim() !== '');
      return {
        ...state,
        bodyParameters: value,
        parameters: validObjects,
      };
    }

    case 'GET_TEST_PAREMETER_VALUE': {
      const { value } = payload;
      return {
        ...state,
        testParameters: value,
      };
    }

    default: {
      return state;
    }
  }
};
