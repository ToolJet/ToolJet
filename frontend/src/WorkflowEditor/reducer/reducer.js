import { v4 as uuidv4 } from 'uuid';
import { defaultNode } from './defaults';
import { find } from 'lodash';

export const Modes = {
  Editing: 'Editing',
  Running: 'Running',
};

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
          position: { x: 0, y: 0 },
          type: 'input',
          sourcePosition: 'right',
        },
      ],
      edges: [],
    },
  },
  queries: [],
  mode: Modes.Editing,
  editingActivity: { type: 'IDLE' },
  appSavingStatus: {
    status: false,
    lastSavedTime: Date.now(),
  },
  dataSources: [],
  bootupComplete: false,
  execution: {
    nodes: [],
  },
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
      return { ...state, app: { ...state.app, name: payload.name } };
    }
    case 'SET_DATA_SOURCES': {
      return { ...state, dataSources: [...state.dataSources, ...payload.dataSources] };
    }

    case 'UPDATE_FLOW': {
      return {
        ...state,
        app: { ...state.app, flow: payload.flow },
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
      const { node } = payload;
      const newNode = {
        ...defaultNode,
        ...node,
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
      // console.log('yepski', { edgeToBeRemoved, edges: state.app.flow.edges });
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
          lastSavedTime: !status ? Date.now() : state.appSavingStatus.lastSavedTime,
        },
      };
    }

    case 'ADD_NEW_QUERY': {
      const { query } = payload;

      return {
        ...state,
        queries: [...state.queries, query],
      };
    }

    case 'UPDATE_QUERY': {
      const { query: newQuery, id } = payload;
      console.log('noop noop', { newQuery });
      return {
        ...state,
        queries: state.queries.map((query) => (query.idOnDefinition === id ? { ...query, ...newQuery } : query)),
      };
    }

    case 'SET_QUERIES': {
      const { queries } = payload;

      return {
        ...state,
        queries,
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

    default: {
      return state;
    }
  }
};
