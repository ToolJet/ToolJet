import { v4 as uuidv4 } from 'uuid';

export const defaultQueryNode = {
  id: uuidv4(),
  type: 'query',
  sourcePosition: 'right',
  targetPosition: 'left',
  draggable: true,
  data: {
    nodeType: 'query',
    label: 'Query',
    idOnDefinition: undefined,
  },
};

export const defaultIfConditionNode = {
  id: uuidv4(),
  type: 'if-condition',
  sourcePosition: 'right',
  targetPosition: 'left',
  draggable: true,
  data: {
    code: '2 > 1',
  },
};

export const query = (idOnDefinition = uuidv4(), kind = 'runjs', options = {}) => ({
  idOnDefinition,
  kind,
  options,
});
