import { defaultAnimateLayoutChanges } from '@dnd-kit/sortable';

export const isArray = (value) => Object.prototype.toString.call(value).slice(8, -1) === 'Array';
export const isObject = (value) => Object.prototype.toString.call(value).slice(8, -1) === 'Object';

export const getContainerData = (containerData) => containerData.map((container) => container.id);

export const getCardData = (cardData, containerDataAsObj) => {
  const containers = {};
  cardData.forEach((card) => {
    if (containers[card.containerId]) {
      containers[card.containerId].push(card.id);
    } else {
      delete containerDataAsObj[card.containerId];
      containers[card.containerId] = [];
      containers[card.containerId].push(card.id);
    }
  });

  for (const key in containerDataAsObj) {
    if (containers[key] === undefined) containers[key] = [];
  }

  return containers;
};

export const getData = (containers, cards, cardDataAsObj, containerDataAsObj) => {
  if (isObject(cards) && isArray(containers)) {
    const clonedColumns = Object.keys(containerDataAsObj).map((containerId) => {
      return { ...containerDataAsObj[containerId] };
    });
    Object.keys(cardDataAsObj).forEach((cardId) => {
      const column = clonedColumns.find((column) => column.id === cardDataAsObj[cardId].containerId);
      if (column) {
        column['cards'] = column?.cards ? [...column.cards, cardDataAsObj[cardId]] : [cardDataAsObj[cardId]];
      }
    });
    return clonedColumns;
  }
  return null;
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
