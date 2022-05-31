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
  if (diffing.length === 0) return null;

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
    for (let j = 0; j < state[i].cards.length; j++) {
      if (state[i].cards[j].id === cardId) {
        return state[i].cards[j];
      }
    }
  }
};
