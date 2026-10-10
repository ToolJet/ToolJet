// GENERATED from WidgetManager/shadcnSource.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadKanbanConfig = {
  name: 'ShadKanban',
  displayName: 'Kanban',
  description:
    'shadcn/ui Kanban board from data: columns are values of a status field, cards show title, description, badge, avatar and meta fields; drag a card to move it, then save the move with a query on onCardMoved (components.<name>.movedCard)',
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
      displayName: 'Badge field',
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
  },
  events: {
    onCardClicked: {
      displayName: 'On card clicked',
    },
    onCardMoved: {
      displayName: 'On card moved',
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
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
    selectedCard: {},
    movedCard: {},
    lastMove: {},
  },
  actions: [],
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
      titleField: {
        value: 'title',
      },
      descriptionField: {
        value: '',
      },
      badgeField: {
        value: 'priority',
      },
      avatarField: {
        value: 'owner',
      },
      metaField: {
        value: '',
      },
      allowDrag: {
        value: '{{true}}',
      },
      emptyText: {
        value: 'No cards',
      },
      dynamicHeight: {
        value: '{{true}}',
      },
      loadingState: {
        value: '{{false}}',
      },
      visibility: {
        value: '{{true}}',
      },
      disabledState: {
        value: '{{false}}',
      },
    },
    events: [],
    styles: {
      boxShadow: {
        value: '0px 0px 0px 0px #00000040',
      },
    },
  },
};
