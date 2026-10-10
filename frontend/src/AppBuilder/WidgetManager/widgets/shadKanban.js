// GENERATED from WidgetManager/shadcnSource.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadKanbanConfig = {
  name: 'ShadKanban',
  displayName: 'Kanban',
  description:
    'shadcn/ui Kanban board from data: columns are values of a status field; cards show the fields you map (title, description, badge, tags, progress, meta, avatar), or, with Card content Custom, child components laid out on the card and bound to {{cardData.<field>}}. Drag to move, optional add and delete buttons, and addCard/updateCard/deleteCard/moveCard actions; save changes with queries on the card events (components.<name>.movedCard, lastAddedCard, lastRemovedCard, lastUpdatedCard, cards)',
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
        },
      },
    },
    showCount: {
      type: 'toggle',
      displayName: 'Card count on columns',
      validation: {
        schema: {
          type: 'boolean',
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
        },
        defaultValue: true,
      },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: {
          type: 'boolean',
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
        },
      },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
      showLabel: false,
    },
  },
  events: {
    onCardClicked: {
      displayName: 'On card clicked',
    },
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
        },
      },
    },
    columnBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Column background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    columnBorderColor: {
      type: 'colorSwatches',
      displayName: 'Column border color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    columnTitleColor: {
      type: 'colorSwatches',
      displayName: 'Column title color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    columnCountBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Column count background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    columnCountTextColor: {
      type: 'colorSwatches',
      displayName: 'Column count text color',
      validation: {
        schema: {
          type: 'string',
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
        },
      },
    },
    cardBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Card background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    cardBorderColor: {
      type: 'colorSwatches',
      displayName: 'Card border color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    cardTitleColor: {
      type: 'colorSwatches',
      displayName: 'Card title color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    cardTextColor: {
      type: 'colorSwatches',
      displayName: 'Card secondary text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    progressColor: {
      type: 'colorSwatches',
      displayName: 'Progress color (else the accent)',
      validation: {
        schema: {
          type: 'string',
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
        },
        defaultValue: 'sm',
      },
    },
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
    cards: [],
    selectedCard: {},
    movedCard: {},
    lastMove: {},
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
      handle: 'updateCard',
      displayName: 'Update card',
      params: [
        {
          handle: 'id',
          displayName: 'Card id',
          defaultValue: '',
        },
        {
          handle: 'values',
          displayName: 'Values',
          defaultValue: "{{{ title: 'Renamed' }}}",
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
