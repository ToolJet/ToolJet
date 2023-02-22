import { defaultAnimateLayoutChanges } from '@dnd-kit/sortable';

export const isArray = (value) => Object.prototype.toString.call(value).slice(8, -1) === 'Array';
export const isObject = (value) => Object.prototype.toString.call(value).slice(8, -1) === 'Object';

export const getColumnData = (columnData) => columnData.map((container) => container.id);

export const getCardData = (cardData, columnDataAsObj) => {
  const containers = {};
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

  return containers;
};

export const getData = (cardDataAsObj) => {
  return Object.keys(cardDataAsObj).map((cardId) => cardDataAsObj[cardId]);
};

export const findContainer = (id, items) => {
  if (id in items) {
    return id;
  }
  return Object.keys(items).find((key) => items[key].includes(id));
};

export const getIndex = (id, items) => {
  const container = findContainer(id);
  if (!container) {
    return -1;
  }
  return items[container].indexOf(id);
};

export const animateLayoutChanges = (args) => defaultAnimateLayoutChanges({ ...args, wasDragging: true });
