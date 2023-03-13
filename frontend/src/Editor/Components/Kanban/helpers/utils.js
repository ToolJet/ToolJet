const isArray = (value) => Object.prototype.toString.call(value).slice(8, -1) === 'Array';

export const convertArrayToObj = (data = []) => {
  const containers = {};
  if (isArray(data)) {
    data.forEach((d) => {
      containers[d.id] = d;
    });
  }

  return containers;
};

export const getColumnData = (columnData) => {
  if (isArray(columnData)) {
    return columnData.map((container) => container.id);
  }
  return [];
};

export const getCardData = (cardData, columnDataAsObj) => {
  const containers = {};
  if (isArray(cardData)) {
    cardData.forEach((card) => {
      if (containers[card.columnId]) {
        containers[card.columnId].push(card.id);
      } else {
        delete columnDataAsObj[card.columnId];
        containers[card.columnId] = [];
        containers[card.columnId].push(card.id);
      }
    });

    for (const key in columnDataAsObj) {
      if (containers[key] === undefined) containers[key] = [];
    }
  }

  return containers;
};

export const getData = (cardDataAsObj) => {
  return Object.keys(cardDataAsObj).map((cardId) => cardDataAsObj[cardId]);
};

export const findContainer = (items, id) => {
  const idInString = String(id);
  if (idInString.includes('tj-kanban-container-')) {
    return idInString.replace('tj-kanban-container-', '');
  }
  return Object.keys(items).find((key) => items[key].includes(id));
};
