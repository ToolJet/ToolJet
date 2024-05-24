//! KanbanBoard widget is deprecated. This config allows backward compatibility with existing KanbanBoard widgets.

export const kanbanBoardConfig = {
  name: 'KanbanBoard',
  displayName: 'Kanban Board',
  description: 'Task management board',
  component: 'KanbanBoard',
  defaultSize: {
    width: 40,
    height: 490,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    columns: { type: 'code', displayName: 'Columns' },
    cardData: { type: 'code', displayName: 'Card Data' },
    enableAddCard: { type: 'toggle', displayName: 'Enable Add Card' },
  },
  events: {
    onCardAdded: { displayName: 'Card added' },
    onCardRemoved: { displayName: 'Card removed' },
    onCardMoved: { displayName: 'Card moved' },
    onCardSelected: { displayName: 'Card selected' },
    onCardUpdated: { displayName: 'Card updated' },
  },
  styles: {
    disabledState: { type: 'toggle', displayName: 'Disable' },
    visibility: { type: 'toggle', displayName: 'Visibility' },
    width: { type: 'number', displayName: 'Width' },
    minWidth: { type: 'number', displayName: 'Min Width' },
    accentColor: { type: 'color', displayName: 'Accent color' },
  },
  exposedVariables: {
    columns: {},
    lastAddedCard: {},
    lastRemovedCard: {},
    lastCardMovement: {},
    lastUpdatedCard: {},
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      columns: {
        value: '{{[{ "id": "1", "title": "to do" },{ "id": "2", "title": "in progress" }]}}',
      },
      cardData: {
        value:
          '{{[{ id: "01", title: "one", columnId: "1" },{ id: "02", title: "two", columnId: "1" },{ id: "03", title: "three", columnId: "2" }]}}',
      },
      enableAddCard: {
        value: `{{true}}`,
      },
    },
    events: [],
    styles: {
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      width: { value: '{{400}}' },
      minWidth: { value: '{{200}}' },
      textColor: { value: '' },
    },
  },
};
