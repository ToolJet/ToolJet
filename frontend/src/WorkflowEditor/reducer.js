import { v4 as uuidv4 } from 'uuid';

export const initialState = ({ appId, appVersionId }) => ({
  app: {
    id: appId,
    versionId: appVersionId,
    name: 'Untitled workflow',
    flow: {
      nodes: [
        {
          id: uuidv4(),
          data: { label: 'Start trigger' },
          position: { x: 0, y: 0 },
          type: 'input',
          sourcePosition: 'right',
        },
      ],
      edges: [],
    },
  },
  editingActivity: { type: 'IDLE' },
  dataSources: [],
});

export const reducer = (state = initialState(), { payload, type }) => {
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
      return { ...state, dataSources: payload.dataSources };
    }

    case 'UPDATE_FLOW': {
      const { flow } = payload;
      return {
        ...state,
        app: { ...state.app, flow },
      };
    }

    case 'ADD_NEW_NODE': {
      const { node } = payload;
      return {
        ...state,
        app: {
          ...state.app,
          flow: {
            ...state.app.flow,
            nodes: [...state.app.flow.nodes, node],
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

    case 'SET_FLOW_BUILDER_EDITING_ACTIVITY': {
      const { editingActivity } = payload;

      return {
        ...state,
        editingActivity,
      };
    }

    default: {
      return state;
    }
  }
};
