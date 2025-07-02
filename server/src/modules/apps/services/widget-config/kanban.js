export const kanbanConfig = {
  name: 'Kanban',
  displayName: 'Kanban',
  description: 'Task management board',
  component: 'Kanban',
  defaultSize: {
    width: 40,
    height: 490,
  },
  defaultChildren: [
    {
      componentName: 'Text',
      layout: {
        top: 20,
        left: 4,
        height: 30,
      },
      properties: ['text'],
      accessorKey: 'text',
      styles: ['fontWeight', 'textSize', 'textColor'],
      defaultValue: {
        text: '{{cardData.title}}',
        fontWeight: 'bold',
        textSize: 16,
        textColor: '#000',
      },
    },
    {
      componentName: 'Text',
      layout: {
        top: 50,
        left: 4,
        height: 30,
      },
      properties: ['text'],
      accessorKey: 'text',
      styles: ['textSize', 'textColor'],
      defaultValue: {
        text: '{{cardData.description}}',
        textSize: 14,
        textColor: '#000',
      },
    },
  ],
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    columnData: { type: 'code', displayName: 'Column data' },
    cardData: { type: 'code', displayName: 'Card data' },
    cardWidth: {
      type: 'code',
      displayName: 'Card width',
      validation: {
        schema: { type: 'number' },
      },
    },
    cardHeight: {
      type: 'code',
      displayName: 'Card height',
      validation: {
        schema: { type: 'number' },
      },
    },
    enableAddCard: { type: 'toggle', displayName: 'Enable add card' },
    showDeleteButton: { type: 'toggle', displayName: 'Show delete button' },
  },
  events: {
    onUpdate: { displayName: 'On update' },
    onAddCardClick: { displayName: 'On add card click' },
    onCardRemoved: { displayName: 'Card removed' },
    onCardAdded: { displayName: 'Card added' },
    onCardMoved: { displayName: 'Card moved' },
    onCardSelected: { displayName: 'Card selected' },
  },
  styles: {
    disabledState: { type: 'toggle', displayName: 'Disable' },
    visibility: { type: 'toggle', displayName: 'Visibility' },
    accentColor: { type: 'colorSwatches', displayName: 'Accent color' },
  },
  actions: [
    {
      handle: 'addCard',
      displayName: 'Add Card',
      params: [
        {
          handle: 'cardDetails',
          displayName: 'Card Details',
          defaultValue: `{{{ id: "c11", title: "Title 11", description: "Description 11", columnId: "r3" }}}`,
        },
      ],
    },
    {
      handle: 'deleteCard',
      displayName: 'Delete Card',
      params: [{ handle: 'id', displayName: 'Card Id', defaultValue: `{{components.kanban1?.lastSelectedCard?.id}}` }],
    },
    {
      handle: 'moveCard',
      displayName: 'Move Card',
      params: [
        { handle: 'cardId', displayName: 'Card Id', defaultValue: `{{components.kanban1?.lastSelectedCard?.id}}` },
        { handle: 'columnId', displayName: 'Destination Column Id', defaultValue: '' },
      ],
    },
    {
      handle: 'updateCardData',
      displayName: 'Update Card Data',
      params: [
        { handle: 'id', displayName: 'Card Id', defaultValue: `{{components.kanban1?.lastSelectedCard?.id}}` },
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: `{{{...components.kanban1?.lastSelectedCard, title: 'New Title'}}}`,
        },
      ],
    },
  ],
  exposedVariables: {
    updatedCardData: {},
    lastAddedCard: {},
    lastRemovedCard: {},
    lastCardMovement: {},
    lastSelectedCard: {},
    lastUpdatedCard: {},
    lastCardUpdate: [],
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      columnData: {
        value:
          '{{[{ "id": "r1", "title": "To Do" },{ "id": "r2", "title": "In Progress" },{ "id": "r3", "title": "Done" }]}}',
      },
      cardData: {
        value:
          '{{[{ id: "c1", title: "Title 1", description: "Description 1", columnId: "r1" },{ id: "c2", title: "Title 2", description: "Description 2", columnId: "r1" },{ id: "c3", title: "Title 3", description: "Description 3",columnId: "r2" },{ id: "c4", title: "Title 4", description: "Description 4",columnId: "r3" },{ id: "c5", title: "Title 5", description: "Description 5",columnId: "r3" }, { id: "c6", title: "Title 6", description: "Description 6", columnId: "r1" },{ id: "c7", title: "Title 7", description: "Description 7", columnId: "r1" },{ id: "c8", title: "Title 8", description: "Description 8",columnId: "r2" },{ id: "c9", title: "Title 9", description: "Description 9",columnId: "r3" },{ id: "c10", title: "Title 10", description: "Description 10",columnId: "r3" }]}}',
      },
      cardWidth: {
        value: '{{302}}',
      },
      cardHeight: {
        value: '{{100}}',
      },
      enableAddCard: {
        value: `{{true}}`,
      },
      showDeleteButton: {
        value: `{{true}}`,
      },
    },
    events: [],
    styles: {
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      accentColor: { value: 'var(--cc-primary-brand)' },
    },
  },
};
