import _ from 'lodash';

export const getData = (columns, cards) => {
  if (isArray(cards) && isArray(columns)) {
    const clonedColumns = [...columns];
    cards.forEach((card) => {
      const column = clonedColumns.find((column) => column.id === card.columnId);
      if (column) {
        column['cards'] = column?.cards ? [...column.cards, card] : [card];
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

const diffCol = (next, current) => {
  const nextState = [...next];
  const currentState = [...current];
  const diff = [];

  nextState.forEach((col, index) => {
    const curr = col;
    const next = currentState[index];

    const isDiff = curr.id === next?.id && curr.title === next.title;
    if (!isDiff && next) {
      const newCol = {
        ...next,
        id: curr.id,
        title: curr.title,
      };
      diff.push(newCol);
    }
  });
  return diff;
};

export const updateColumnData = (currentData, column, newData) => {
  const diff = diffCol(newData, currentData);

  if (diff.length === 0) return null;

  const nextState = [...currentData];
  diff.forEach((col) => {
    const index = nextState.findIndex((c) => c.id === col.id);
    nextState[index] = col;
  });
  return nextState;
};

const cardDiffExits = (currentCards, newCards, state) => {
  const diff = [];

  if (!currentCards) return null;

  newCards.forEach((card) => {
    const index = currentCards.findIndex((c) => c.id === card.id);
    const updatedColumnId = findCard(state, card.id)?.columnId;

    if (index !== -1) {
      const newCard = {
        ...card,
        columnId: updatedColumnId,
      };
      diff.push(newCard);
    }
  });
  return diff;
};

export const updateCardData = (currentData, cards, newData) => {
  const diffing = cardDiffExits(cards, newData, currentData);
  if (!diffing || diffing.length === 0) return null;

  const newState = [...currentData];
  diffing.forEach((card) => {
    const colIndex = newState.findIndex((c) => c.id === card.columnId);
    const cardIndex = newState[colIndex].cards.findIndex((c) => c.id === card.id);
    newState[colIndex].cards[cardIndex] = card;
  });
  return newState;
};

const findCard = (state, cardId) => {
  for (let i = 0; i < state.length; i++) {
    for (let j = 0; j < state[i].cards?.length ?? 0; j++) {
      if (state[i].cards[j].id === cardId) {
        return state[i].cards[j];
      }
    }
  }
};

export const isCardColoumnIdUpdated = (currentCardData, nextCardData) => {
  const currentState = [...currentCardData];
  const nextState = [...nextCardData];

  let isColoumnIdUpdated = false;

  currentState.forEach((card, index) => {
    if (nextState[index]) {
      const prevColId = card.columnId;
      const newColId = nextState[index].columnId;
      if (prevColId !== newColId) {
        isColoumnIdUpdated = true;
      }
    }
  });
  return isColoumnIdUpdated;
};

export const isArray = (value) => Object.prototype.toString.call(value).slice(8, -1) === 'Array';

export const isValidCardData = (cardData) => {
  return _.isArray(cardData) && cardData.every((card) => _.isString(card.id));
};
