import _ from 'lodash';

export const getData = (_columns, _cards) => {
  const columns = _.cloneDeep(_columns);
  const cards = _.cloneDeep(_cards);

  if (_.isArray(cards) && _.isArray(columns)) {
    columns.forEach((column) => {
      if (!column.hasOwnProperty('cards')) {
        defObjectProperty(column, 'cards', []);
      }
    });

    cards.forEach((card) => {
      const column = columns.find((column) => column.id === card.columnId);
      if (column) {
        column['cards'] = column?.cards ? _.uniq([...column.cards, card]) : [card];

        if (column?.cards) {
          if (card.hasOwnProperty('index')) {
            //add the card to the correct position
            const _copy = [...column?.cards];
            const cardIndex = _copy.findIndex((c) => c.id === card.id);
            const [removed] = _copy.splice(cardIndex, 1);
            _copy.splice(card.index, 0, removed);
            column.cards = _copy;
          }
        }
      }
    });

    return columns;
  }
  return null;
};

export const reorderCards = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

export const moveCards = (source, destination, droppableSource, droppableDestination) => {
  const sourceClone = Array.from(source);
  const destinationClone = destination ? Array.from(destination) : [];
  const [removed] = sourceClone.splice(droppableSource.index, 1);

  destinationClone.splice(droppableDestination.index, 0, removed);

  const result = {};
  result[droppableSource.droppableId] = sourceClone;
  result[droppableDestination.droppableId] = destinationClone;

  return result;
};

export const cardDiff = (prevState, nextState) => {
  const copyPrevState = _.cloneDeep(prevState);
  const copyNextState = _.cloneDeep(nextState);
  let prevCards = [];
  let newCards = [];

  if (_.isArray(copyPrevState)) {
    prevCards = copyPrevState.reduce((acc, column) => {
      if (_.isArray(column?.cards)) {
        acc = [...acc, ...column?.cards];
      }
      return acc;
    }, []);
  }
  if (_.isArray(copyNextState)) {
    newCards = copyNextState.reduce((acc, column) => {
      if (_.isArray(column?.cards)) {
        acc = [...acc, ...column?.cards];
      }
      return acc;
    }, []);
  }

  const diff = _.differenceWith(newCards, prevCards, _.isEqual);
  const diffSize = diff.length;

  if (diffSize === 1) {
    return [diffSize, diff[0], { type: diffType.ADD }];
  }

  if (diffSize === 0) {
    return [diffSize, [], { type: diffType.UPDATE }];
  }

  return [diffSize, undefined, { type: diffType.UPDATE }];
};

const diffType = Object.freeze({
  ADD: 'ADD',
  REMOVE: 'REMOVE',
  UPDATE: 'UPDATE',
});

const defObjectProperty = (obj, key, value) =>
  Object.defineProperties(obj, {
    [key]: {
      value: value,
      writable: true,
      enumerable: true,
    },
  });
