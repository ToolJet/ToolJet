export const shadCardGridConfig = {
  name: 'ShadCardGrid',
  displayName: 'Card grid',
  description:
    "Grid of cards from data, for things with a face (recipes, products, listings, people, rooms, projects): each card shows an image when imageField is mapped (a row without a picture gets a tinted panel with the title's initials; no imageField, no picture area), an eyebrow (eyebrowField: a small caps line above the title, such as a category or a code), an avatar beside the title (avatarField: an image URL, else the initials of that field's text; for people and owners), title, subtitle, badges (badgeField, plus badgeFields for more: 'cuisine, diet', at most 4; each toned by its words: Available green, Low stock amber, Sold out red), a description (two lines), a progress bar (progressField: a percentage 0 to 100, as 42 or '42%') and a meta line (metaFields, a comma list; 'prep:{} min' puts the value in a label, 'serves:Serves' puts the label first). layout 'stacked' (image on top) or 'row' (image left, text right: listings, people, a compact catalogue). columns (a number, or 'auto' to fit cards of minCardWidth), imageAspect ('16/9', '4/3', '1/1'; stacked only), cardStyle 'elevated', 'outline' or 'flat'. A click selects the card (selectedItem, selectedItemId; onCardClick). Height: grows with its rows (about 300px per row stacked with an image, 150px without or in rows)",
  component: 'ShadCardGrid',
  defaultSize: {
    width: 43,
    height: 620,
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
      displayName: 'Data',
      validation: {
        schema: {
          type: 'array',
          optional: true,
        },
        defaultValue: [],
      },
      placeholder: "[{ id: 1, name: 'Lemon roast chicken', cuisine: 'Dinner' }]",
    },
    titleField: {
      type: 'code',
      displayName: 'Title field',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'name',
      },
    },
    subtitleField: {
      type: 'code',
      displayName: 'Subtitle field',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    imageField: {
      type: 'code',
      displayName: 'Image field (URL)',
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
      displayName: 'Badge field',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    badgeFields: {
      type: 'code',
      displayName: "More badge fields (comma list, e.g. 'diet, spice')",
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'array',
            },
            {
              type: 'string',
            },
          ],
          optional: true,
        },
        defaultValue: '',
      },
    },
    eyebrowField: {
      type: 'code',
      displayName: 'Eyebrow field (a small line above the title)',
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
      displayName: 'Avatar field (image URL or a name)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
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
    progressField: {
      type: 'code',
      displayName: 'Progress field (a percentage, 0 to 100)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    metaFields: {
      type: 'code',
      displayName: "Meta fields (comma list; 'prep:{} min')",
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'array',
            },
            {
              type: 'string',
            },
          ],
          optional: true,
        },
        defaultValue: '',
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
    layout: {
      type: 'switch',
      displayName: 'Layout',
      options: [
        {
          displayName: 'Image on top',
          value: 'stacked',
        },
        {
          displayName: 'Image left',
          value: 'row',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'stacked',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    columns: {
      type: 'code',
      displayName: "Columns (a number or 'auto')",
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
        defaultValue: 3,
      },
    },
    minCardWidth: {
      type: 'code',
      displayName: 'Minimum card width (px)',
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
        defaultValue: 240,
      },
    },
    imageAspect: {
      type: 'switch',
      displayName: 'Image shape',
      options: [
        {
          displayName: '16/9',
          value: '16/9',
        },
        {
          displayName: '4/3',
          value: '4/3',
        },
        {
          displayName: '1/1',
          value: '1/1',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '4/3',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    showImage: {
      type: 'toggle',
      displayName: 'Show image',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
    },
    cardStyle: {
      type: 'switch',
      displayName: 'Card style',
      options: [
        {
          displayName: 'Elevated',
          value: 'elevated',
        },
        {
          displayName: 'Outline',
          value: 'outline',
        },
        {
          displayName: 'Flat',
          value: 'flat',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'elevated',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    highlightSelected: {
      type: 'toggle',
      displayName: 'Highlight the selected card',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
    },
    emptyText: {
      type: 'code',
      displayName: 'Empty text',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'Nothing here yet',
      },
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
    onCardClick: {
      displayName: 'On card click',
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
    cardBackground: {
      type: 'colorSwatches',
      displayName: 'Card background',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Card border color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    titleColor: {
      type: 'colorSwatches',
      displayName: 'Title color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    textColor: {
      type: 'colorSwatches',
      displayName: 'Subtitle and meta color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    accentColor: {
      type: 'colorSwatches',
      displayName: 'Selected card accent',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    borderRadius: {
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
    titleFontFamily: {
      type: 'select',
      displayName: 'Title typeface',
      options: [
        {
          name: 'Theme font',
          value: 'theme',
        },
        {
          name: 'Sans serif',
          value: 'sans',
        },
        {
          name: 'Serif',
          value: 'serif',
        },
        {
          name: 'Display serif',
          value: 'display',
        },
        {
          name: 'Monospace',
          value: 'mono',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'theme',
      },
    },
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
    selectedItem: {},
    selectedItemId: null,
  },
  actions: [
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
          "{{[{ id: 1, name: 'Lemon herb roast chicken', cuisine: 'Dinner', prep: 20, serves: 4, note: 'Crisp skin, bright pan sauce' }, { id: 2, name: 'Miso glazed salmon', cuisine: 'Dinner', prep: 15, serves: 2, note: 'Sweet, salty, ten minutes under the grill' }, { id: 3, name: 'Blueberry oat pancakes', cuisine: 'Breakfast', prep: 10, serves: 3, note: 'Fluffy, no buttermilk needed' }]}}",
      },
      titleField: {
        value: 'name',
      },
      subtitleField: {
        value: '',
      },
      imageField: {
        value: '',
      },
      badgeField: {
        value: 'cuisine',
      },
      badgeFields: {
        value: '',
      },
      eyebrowField: {
        value: '',
      },
      avatarField: {
        value: '',
      },
      descriptionField: {
        value: 'note',
      },
      progressField: {
        value: '',
      },
      metaFields: {
        value: 'prep:{} min, serves:Serves',
      },
      idField: {
        value: 'id',
      },
      layout: {
        value: 'stacked',
      },
      columns: {
        value: '{{3}}',
      },
      minCardWidth: {
        value: '{{240}}',
      },
      imageAspect: {
        value: '4/3',
      },
      showImage: {
        value: '{{true}}',
      },
      cardStyle: {
        value: 'elevated',
      },
      highlightSelected: {
        value: '{{true}}',
      },
      emptyText: {
        value: 'Nothing here yet',
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
      titleFontFamily: {
        value: 'theme',
      },
    },
  },
};
