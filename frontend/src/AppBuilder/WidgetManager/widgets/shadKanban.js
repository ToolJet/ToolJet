export const shadKanbanConfig = {
  name: 'ShadKanban',
  displayName: 'Kanban',
  description:
    'Kanban board from data: columns are values of a status field; cards show the fields you map (title, description, badge, tags, progress, meta, avatar), or, with Card content Custom, child components laid out on the card and bound to {{cardData.<field>}}. Drag to move, optional add and delete buttons, and addCard/updateCardData/deleteCard/moveCard actions; save changes with queries on the card events (components.<name>.lastCardMovement, lastAddedCard, lastRemovedCard, lastUpdatedCard, updatedCardData). lastCardMovement is {cardId, card, from, to, toIndex}: a move saves with lastCardMovement.cardId and .to (the native names cardDetails, originColumnId, destinationColumnId, originCardIndex and destinationIndex also work)',
  component: 'ShadKanban',
  defaultSize: {
    width: 43,
    height: 420,
  },
  others: {
    showOnDesktop: {
      type: 'toggle',
      displayName: 'Show on desktop',
    },
    showOnMobile: {
      type: 'toggle',
      displayName: 'Show on mobile',
    },
  },
  properties: {
    data: {
      type: 'code',
      displayName: 'Cards',
      validation: {
        schema: {
          type: 'array',
          optional: true,
        },
        defaultValue: [],
      },
      placeholder: "[{ id: 1, title: 'Fix login', status: 'todo', priority: 'High' }]",
    },
    columns: {
      type: 'code',
      displayName: 'Columns (in order)',
      validation: {
        schema: {
          type: 'array',
          optional: true,
        },
        defaultValue: [],
      },
      placeholder: "['todo', 'doing', 'done'] or [{ id: 'todo', title: 'To do' }]",
    },
    statusField: {
      type: 'code',
      displayName: 'Status field',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'status',
      },
    },
    idField: {
      type: 'code',
      displayName: 'Id field',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'id',
      },
    },
    cardLayout: {
      type: 'switch',
      displayName: 'Card content',
      options: [
        {
          displayName: 'Fields',
          value: 'fields',
        },
        {
          displayName: 'Custom',
          value: 'custom',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'fields',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    cardHeight: {
      type: 'code',
      displayName: 'Card height (custom content)',
      validation: {
        schema: {
          type: 'number',
          optional: true,
        },
        defaultValue: 96,
      },
    },
    titleField: {
      type: 'code',
      displayName: 'Title field',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'title',
      },
    },
    descriptionField: {
      type: 'code',
      displayName: 'Description field',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    badgeField: {
      type: 'code',
      displayName: 'Badge field (priority, severity)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    tagsField: {
      type: 'code',
      displayName: 'Tags field (a list)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    progressField: {
      type: 'code',
      displayName: 'Progress field (0 to 100)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    metaField: {
      type: 'code',
      displayName: 'Meta field (a date, a count)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    avatarField: {
      type: 'code',
      displayName: 'Avatar field (a name)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    detailsField: {
      type: 'code',
      displayName: 'Details field (shown on the clicked card)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    density: {
      type: 'switch',
      displayName: 'Card density',
      options: [
        {
          displayName: 'Comfortable',
          value: 'comfortable',
        },
        {
          displayName: 'Compact',
          value: 'compact',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'comfortable',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    collapsedHeight: {
      type: 'code',
      displayName: 'Collapsed card height (px, empty: show all)',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'number',
            },
            {
              type: 'string',
            },
          ],
          optional: true,
        },
      },
    },
    columnWidth: {
      type: 'code',
      displayName: 'Column width (px, empty: fill the board)',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'number',
            },
            {
              type: 'string',
            },
          ],
          optional: true,
        },
      },
    },
    showCount: {
      type: 'toggle',
      displayName: 'Card count on columns',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
    },
    collapsibleColumns: {
      type: 'toggle',
      displayName: 'Collapsible columns',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
    },
    collapsedColumns: {
      type: 'code',
      displayName: 'Columns collapsed at start (ids)',
      validation: {
        schema: {
          type: 'array',
          optional: true,
        },
        defaultValue: [],
      },
      placeholder: "['done']",
    },
    allowDrag: {
      type: 'toggle',
      displayName: 'Drag to move',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
    },
    allowAdd: {
      type: 'toggle',
      displayName: 'Add card button on columns',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
    },
    allowDelete: {
      type: 'toggle',
      displayName: 'Delete button on cards',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
    },
    emptyText: {
      type: 'code',
      displayName: 'Empty column message',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'No cards',
      },
    },
    badgeColors: {
      type: 'code',
      displayName: 'Badge colours by value',
      validation: {
        schema: {
          type: 'object',
          optional: true,
        },
        defaultValue: {},
      },
      placeholder: "{ High: '#dc2626', Low: '#16a34a' }",
    },
    dynamicHeight: {
      type: 'toggle',
      displayName: 'Dynamic height',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
      section: 'additionalActions',
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    loadingIndicator: {
      type: 'switch',
      displayName: 'Loading look',
      options: [
        {
          displayName: 'Spinner',
          value: 'spinner',
        },
        {
          displayName: 'Skeleton',
          value: 'skeleton',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'spinner',
      },
      isFxNotRequired: true,
      fullWidth: true,
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
      section: 'additionalActions',
    },
    collapseWhenHidden: {
      type: 'toggle',
      displayName: 'Collapse when hidden',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    tooltipFormat: {
      type: 'switch',
      displayName: 'Tooltip',
      options: [
        {
          displayName: 'Plain text',
          value: 'plainText',
        },
        {
          displayName: 'Markdown',
          value: 'markdown',
        },
        {
          displayName: 'HTML',
          value: 'html',
        },
      ],
      isFxNotRequired: true,
      defaultValue: {
        value: 'plainText',
      },
      fullWidth: true,
      newLine: true,
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
      showLabel: false,
    },
  },
  events: {
    onCardMoved: {
      displayName: 'On card moved',
    },
    onAddCardClick: {
      displayName: 'On add card click',
    },
    onCardAdded: {
      displayName: 'On card added',
    },
    onCardUpdated: {
      displayName: 'On card updated',
    },
    onCardRemoved: {
      displayName: 'On card removed',
    },
    onCardSelected: {
      displayName: 'On card selected',
    },
    onUpdate: {
      displayName: 'On update (any card change)',
    },
  },
  styles: {
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
          optional: true,
        },
        defaultValue: '0px 0px 0px 0px #00000040',
      },
      accordian: 'Container',
    },
    accentColor: {
      type: 'colorSwatches',
      displayName: 'Accent (selection, progress, drop line)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    columnBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Column background',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    columnBorderColor: {
      type: 'colorSwatches',
      displayName: 'Column border color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    columnTitleColor: {
      type: 'colorSwatches',
      displayName: 'Column title color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    columnCountBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Column count background',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    columnCountTextColor: {
      type: 'colorSwatches',
      displayName: 'Column count text color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    columnGap: {
      type: 'numberInput',
      displayName: 'Gap between columns',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
          optional: true,
        },
      },
    },
    columnBorderRadius: {
      type: 'numberInput',
      displayName: 'Column radius',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
          optional: true,
        },
      },
    },
    cardBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Card background',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    cardBorderColor: {
      type: 'colorSwatches',
      displayName: 'Card border color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    cardTitleColor: {
      type: 'colorSwatches',
      displayName: 'Card title color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    cardTextColor: {
      type: 'colorSwatches',
      displayName: 'Card secondary text color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    progressColor: {
      type: 'colorSwatches',
      displayName: 'Progress color (else the accent)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    cardBorderRadius: {
      type: 'numberInput',
      displayName: 'Card radius',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
          optional: true,
        },
      },
    },
    cardShadow: {
      type: 'select',
      displayName: 'Card shadow',
      options: [
        {
          name: 'None',
          value: 'none',
        },
        {
          name: 'Small',
          value: 'sm',
        },
        {
          name: 'Medium',
          value: 'md',
        },
        {
          name: 'Large',
          value: 'lg',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'sm',
      },
    },
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
    updatedCardData: [],
    lastSelectedCard: {},
    lastCardMovement: {},
    addCardColumn: '',
    collapsedColumns: [],
    lastAddedCard: {},
    lastUpdatedCard: {},
    lastRemovedCard: {},
  },
  actions: [
    {
      handle: 'addCard',
      displayName: 'Add card',
      params: [
        {
          handle: 'card',
          displayName: 'Card',
          defaultValue: "{{{ title: 'New card' }}}",
        },
        {
          handle: 'columnId',
          displayName: 'Column id (optional)',
          defaultValue: '',
        },
      ],
    },
    {
      handle: 'moveCard',
      displayName: 'Move card',
      params: [
        {
          handle: 'id',
          displayName: 'Card id',
          defaultValue: '',
        },
        {
          handle: 'columnId',
          displayName: 'Column id',
          defaultValue: '',
        },
      ],
    },
    {
      handle: 'deleteCard',
      displayName: 'Delete card',
      params: [
        {
          handle: 'id',
          displayName: 'Card id',
          defaultValue: '',
        },
      ],
    },
    {
      handle: 'updateCardData',
      displayName: 'Update card data',
      params: [
        {
          handle: 'id',
          displayName: 'Card id',
          defaultValue: '',
        },
        {
          handle: 'value',
          displayName: 'Values',
          defaultValue: "{{{ title: 'Renamed' }}}",
        },
      ],
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
  ],
  definition: {
    others: {
      showOnDesktop: {
        value: '{{true}}',
      },
      showOnMobile: {
        value: '{{false}}',
      },
    },
    properties: {
      data: {
        value:
          "{{[{ id: 1, title: 'Draft the brief', status: 'todo', priority: 'High', owner: 'Ada Lovelace' }, { id: 2, title: 'Review designs', status: 'doing', priority: 'Medium', owner: 'Alan Turing' }, { id: 3, title: 'Ship v1', status: 'done', priority: 'Low', owner: 'Grace Hopper' }]}}",
      },
      columns: {
        value:
          "{{[{ id: 'todo', title: 'To do' }, { id: 'doing', title: 'In progress' }, { id: 'done', title: 'Done' }]}}",
      },
      statusField: {
        value: 'status',
      },
      idField: {
        value: 'id',
      },
      cardLayout: {
        value: 'fields',
      },
      cardHeight: {
        value: '{{96}}',
      },
      titleField: {
        value: 'title',
      },
      descriptionField: {
        value: '',
      },
      badgeField: {
        value: 'priority',
      },
      tagsField: {
        value: '',
      },
      progressField: {
        value: '',
      },
      metaField: {
        value: '',
      },
      avatarField: {
        value: 'owner',
      },
      detailsField: {
        value: '',
      },
      density: {
        value: 'comfortable',
      },
      collapsedHeight: {
        value: '',
      },
      columnWidth: {
        value: '',
      },
      showCount: {
        value: '{{true}}',
      },
      collapsibleColumns: {
        value: '{{true}}',
      },
      collapsedColumns: {
        value: '{{[]}}',
      },
      allowDrag: {
        value: '{{true}}',
      },
      allowAdd: {
        value: '{{false}}',
      },
      allowDelete: {
        value: '{{false}}',
      },
      emptyText: {
        value: 'No cards',
      },
      badgeColors: {
        value: '{{{}}}',
      },
      dynamicHeight: {
        value: '{{true}}',
      },
      loadingState: {
        value: '{{false}}',
      },
      loadingIndicator: {
        value: 'spinner',
      },
      visibility: {
        value: '{{true}}',
      },
      collapseWhenHidden: {
        value: '{{false}}',
      },
      disabledState: {
        value: '{{false}}',
      },
      tooltipFormat: {
        value: 'plainText',
      },
      tooltip: {
        value: '',
      },
    },
    events: [],
    styles: {
      boxShadow: {
        value: '0px 0px 0px 0px #00000040',
      },
      cardShadow: {
        value: 'sm',
      },
    },
  },
};
