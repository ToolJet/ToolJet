import _ from 'lodash';

export const getData = (_columns, _cards) => {
  const columns = _.cloneDeep(_columns);
  const cards = _.cloneDeep(_cards);

  if (_.isArray(cards) && _.isArray(columns)) {
    const clonedColumns = [...columns];
    cards.forEach((card) => {
      const column = clonedColumns.find((column) => column.id === card.columnId);
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

    return clonedColumns;
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
