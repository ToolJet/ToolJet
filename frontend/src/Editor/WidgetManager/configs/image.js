export const imageConfig = {
  name: 'Image',
  displayName: 'Image',
  description: 'Show image files',
  defaultSize: {
    width: 10,
    height: 240,
  },
  component: 'Image',
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    imageFormat: {
      type: 'switch',
      displayName: 'Image Format',
      options: [
        { displayName: 'Image URL', value: 'imageUrl' },
        { displayName: 'JS Object', value: 'jsObject' },
      ],
      isFxNotRequired: true,
      defaultValue: { value: 'imageUrl' },
      fullWidth: true,
      showLabel: false,
    },
    source: {
      type: 'code',
      displayName: 'Source URL',
      conditionallyRender: {
        key: 'imageFormat',
        value: 'imageUrl',
      },
      validation: {
        schema: { type: 'string' },
        defaultValue: 'https://www.svgrepo.com/image.svg',
      },
      showLabel: false,
    },
    jsSchema: {
      type: 'code',
      displayName: 'JS Object',
      conditionallyRender: {
        key: 'imageFormat',
        value: 'jsObject',
      },
      validation: {
        schema: { type: 'object' },
        defaultValue: "{ name: string, type: 'image/*', sizeBytes: number, base64Data: string }",
      },
      showLabel: false,
    },
    alternativeText: {
      type: 'code',
      displayName: 'Alternative',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'this is an image',
      },
    },
    zoomButtons: {
      type: 'toggle',
      displayName: 'Zoom button',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    rotateButton: {
      type: 'toggle',
      displayName: 'Rotate button',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Show loading state',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: { schema: { type: 'string' }, defaultValue: 'Tooltip text' },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
    },
  },
  events: {
    onClick: { displayName: 'On click' },
  },
  styles: {
    imageFit: {
      type: 'select',
      displayName: 'Image fit',
      options: [
        { name: 'Contain', value: 'contain' },
        { name: 'Fill', value: 'fill' },
        { name: 'Cover', value: 'cover' },
        { name: 'Scale down', value: 'scale-down' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'contain',
      },
      accordian: 'Image',
    },
    imageShape: {
      type: 'select',
      displayName: 'Shape',
      options: [
        { name: 'None', value: 'none' },
        { name: 'Circle', value: 'circle' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'none',
      },
      accordian: 'Image',
    },
    backgroundColor: {
      type: 'color',
      displayName: 'Background',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#ffffff',
      },
      accordian: 'Container',
    },
    borderColor: {
      type: 'color',
      displayName: 'Border',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#000000',
      },
      accordian: 'Container',
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Border radius',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] }, defaultValue: 6 },
      accordian: 'Container',
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: '0px 0px 0px 0px #00000090',
      },
      accordian: 'Container',
    },
    padding: {
      type: 'switch',
      displayName: 'Padding',
      options: [
        { displayName: 'Default', value: 'default' },
        { displayName: 'Custom', value: 'custom' },
      ],
      validation: { schema: { type: 'string' }, defaultValue: 'default' },
      accordian: 'Container',
      isFxNotRequired: true,
    },
    customPadding: {
      type: 'numberInput',
      displayName: 'Padding',
      conditionallyRender: {
        key: 'padding',
        value: 'custom',
      },
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] }, defaultValue: 0 },
      accordian: 'Container',
      showLabel: false,
    },
  },
  exposedVariables: {},
  actions: [
    {
      handle: 'setImageURL',
      displayName: 'Set image URL',
      params: [{ handle: 'url', displayName: 'URL', defaultValue: 'New URL' }],
    },
    {
      handle: 'clearImage',
      displayName: 'Clear image',
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'setVisibility', displayName: 'Value', defaultValue: `{{true}}`, type: 'toggle' }],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [{ handle: 'setLoading', displayName: 'Value', defaultValue: `{{false}}`, type: 'toggle' }],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [{ handle: 'setDisable', displayName: 'Value', defaultValue: `{{false}}`, type: 'toggle' }],
    },
  ],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      imageFormat: { value: 'imageUrl' },
      source: { value: 'https://www.svgrepo.com/show/34217/image.svg' },
      jsSchema: {
        value:
          "{{{ name: 'DemoImage', type: 'image/svg+xml', sizeBytes: 3050, base64Data: 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBVcGxvYWRlZCB0bzogU1ZHIFJlcG8sIHd3dy5zdmdyZXBvLmNvbSwgR2VuZXJhdG9yOiBTVkcgUmVwbyBNaXhlciBUb29scyAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkNhcGFfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgDQoJIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQo8Zz4NCgk8Zz4NCgkJPGc+DQoJCQk8cmVjdCB4PSIxIiB5PSI0LjUiIHN0eWxlPSJmaWxsOiNFQ0YwRjE7IiB3aWR0aD0iNTUiIGhlaWdodD0iNDIiLz4NCgkJCTxwYXRoIHN0eWxlPSJmaWxsOiM1NDVFNzM7IiBkPSJNNTcsNDcuNUgwdi00NGg1N1Y0Ny41eiBNMiw0NS41aDUzdi00MEgyVjQ1LjV6Ii8+DQoJCTwvZz4NCgkJPGc+DQoJCQk8cmVjdCB4PSI1IiB5PSI4LjUiIHN0eWxlPSJmaWxsOiM1NDVFNzM7IiB3aWR0aD0iNDciIGhlaWdodD0iMzQiLz4NCgkJCTxwYXRoIHN0eWxlPSJmaWxsOiNFQ0YwRjE7IiBkPSJNNTMsNDMuNUg0di0zNmg0OVY0My41eiBNNiw0MS41aDQ1di0zMkg2VjQxLjV6Ii8+DQoJCTwvZz4NCgkJPGNpcmNsZSBzdHlsZT0iZmlsbDojRjNENTVBOyIgY3g9IjE1IiBjeT0iMTcuMDY5IiByPSI0LjU2OSIvPg0KCQk8cG9seWdvbiBzdHlsZT0iZmlsbDojMTFBMDg1OyIgcG9pbnRzPSI1MSwzMi42MTEgNTAsMzEuNSAzOCwyMC41IDI3LjUsMzIgMzIuOTgzLDM3LjQ4MyAzNyw0MS41IDUxLDQxLjUgCQkiLz4NCgkJPHBvbHlnb24gc3R5bGU9ImZpbGw6IzI2Qjk5OTsiIHBvaW50cz0iNiw0MS41IDM3LDQxLjUgMzIuOTgzLDM3LjQ4MyAyMi4wMTcsMjYuNTE3IDYsNDAuNSAJCSIvPg0KCTwvZz4NCgk8Zz4NCgkJPGc+DQoJCQk8cGF0aCBzdHlsZT0iZmlsbDojNDhBMERDOyIgZD0iTTU1LjA0NSw0NS42MTFjLTAuMDUtMy45MzUtMy4xNjItNy4xMTEtNi45OTktNy4xMTFjLTIuNTY4LDAtNC44MDYsMS40MjYtNi4wMjUsMy41NDYNCgkJCQljLTAuNDIxLTAuMTQxLTAuODctMC4yMi0xLjMzNy0wLjIyYy0yLjA2MywwLTMuNzg1LDEuNDkyLTQuMjA4LDMuNDg0Yy0xLjc1NCwwLjg2NS0yLjk3NSwyLjcwNi0yLjk3NSw0LjgzMQ0KCQkJCWMwLDIuOTQ3LDIuMzQzLDUuMzU5LDUuMjA4LDUuMzU5aDEwLjc3NWMwLjA2MSwwLDAuMTE5LTAuMDA3LDAuMTgtMC4wMDljMC4wNiwwLjAwMiwwLjExOSwwLjAwOSwwLjE4LDAuMDA5aDQuMzENCgkJCQljMi42NjcsMCw0Ljg0OS0yLjI0NSw0Ljg0OS00Ljk4OUM1OSw0OC4wODEsNTcuMjg4LDQ2LjA0Niw1NS4wNDUsNDUuNjExeiIvPg0KCQkJPHBhdGggc3R5bGU9ImZpbGw6I0IxRDNFRjsiIGQ9Ik01NC4xNTEsNTYuNWgtNC4zMWMtMC4wNjMsMC0wLjEyNi0wLjAwNC0wLjE4OC0wLjAwOGMtMC4wNDgsMC4wMDQtMC4xMDksMC4wMDgtMC4xNzIsMC4wMDgNCgkJCQlIMzguNzA4Yy0zLjQyMywwLTYuMjA4LTIuODUzLTYuMjA4LTYuMzU4YzAtMi4yNjIsMS4yMDktNC4zNzIsMy4xMTYtNS41MDNjMC42ODYtMi4yMzUsMi43NDYtMy44MTMsNS4wNjYtMy44MTMNCgkJCQljMC4yOTYsMCwwLjU5MiwwLjAyNSwwLjg4NCwwLjA3NmMxLjQ5NS0yLjExNiwzLjkxNC0zLjQwMiw2LjQ3OS0zLjQwMmM0LjEwMiwwLDcuNTI0LDMuMjI1LDcuOTU0LDcuMzMyDQoJCQkJYzIuMzU4LDAuODA2LDQsMy4wNzksNCw1LjY3OUM2MCw1My44MTMsNTcuMzc2LDU2LjUsNTQuMTUxLDU2LjV6IE00OS42MTQsNTQuNDkxbDAuMTg2LDAuMDA2bDQuMzUyLDAuMDAzDQoJCQkJYzIuMTIyLDAsMy44NDktMS43OSwzLjg0OS0zLjk4OWMwLTEuOTE3LTEuMzIzLTMuNTY0LTMuMTQ2LTMuOTE5bC0wLjc5OS0wLjE1NWwtMC4wMTEtMC44MTMNCgkJCQljLTAuMDQ0LTMuMzc2LTIuNzM0LTYuMTIzLTUuOTk5LTYuMTIzYy0yLjEzNSwwLTQuMDYzLDEuMTM5LTUuMTU4LDMuMDQ1bC0wLjQwOSwwLjcxMWwtMC43NzctMC4yNjENCgkJCQljLTAuMzMyLTAuMTEyLTAuNjc1LTAuMTY5LTEuMDE5LTAuMTY5Yy0xLjU0LDAtMi44OTgsMS4xMzMtMy4yMjksMi42OTJsLTAuMTAyLDAuNDc1bC0wLjQzNSwwLjIxNA0KCQkJCWMtMS40NjksMC43MjUtMi40MTcsMi4yNjktMi40MTcsMy45MzVjMCwyLjQwMywxLjg4OCw0LjM1OCw0LjIwOCw0LjM1OEw0OS42MTQsNTQuNDkxeiIvPg0KCQk8L2c+DQoJPC9nPg0KPC9nPg0KPC9zdmc+' }}}",
      },
      alternativeText: { value: '' },
      zoomButtons: { value: '{{false}}' },
      rotateButton: { value: '{{false}}' },
      loadingState: { value: '{{false}}' },
      disabledState: { value: '{{false}}' },
      visibility: { value: '{{true}}' },
    },
    events: [],
    styles: {
      imageFit: { value: 'contain' },
      imageShape: { value: 'none' },
      backgroundColor: { value: '#FFFFFF' },
      borderColor: { value: '' },
      borderRadius: { value: '{{6}}' },
      boxShadow: { value: '0px 0px 0px 0px #00000090' },
      padding: { value: 'default' },
      customPadding: { value: '{{0}}' },
    },
  },
};
