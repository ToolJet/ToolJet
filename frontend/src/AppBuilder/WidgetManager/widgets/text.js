export const textConfig = {
  name: 'Text',
  displayName: 'Text',
  description: 'Display text or HTML',
  component: 'Text',
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    textFormat: {
      type: 'switch',
      displayName: 'Text Format',
      options: [
        { displayName: 'Plain text', value: 'plainText' },
        { displayName: 'Markdown', value: 'markdown' },
        { displayName: 'HTML', value: 'html' },
      ],
      isFxNotRequired: true,
      defaultValue: { value: 'plainText' },
      fullWidth: true,
    },
    text: {
      type: 'code',
      displayName: 'TextComponentTextInput', // Keeping this name unique so that we can filter it in Codehinter
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Hello, there!',
      },
      showLabel: false,
    },
    dynamicHeight: {
      type: 'toggle',
      displayName: 'Dynamic height',
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
  defaultSize: {
    width: 6,
    height: 40,
  },
  events: {
    onClick: { displayName: 'On click' },
    onHover: { displayName: 'On hover' },
  },
  styles: {
    textSize: {
      type: 'numberInput',
      displayName: 'Size',
      validation: {
        schema: [{ type: 'string' }, { type: 'number' }],
        defaultValue: 14,
      },
      accordian: 'Text',
    },
    fontWeight: {
      type: 'select',
      displayName: 'Weight',
      options: [
        { name: 'normal', value: 'normal' },
        { name: 'bold', value: 'bold' },
        { name: 'lighter', value: 'lighter' },
        { name: 'bolder', value: 'bolder' },
      ],
      accordian: 'Text',
    },
    fontStyle: {
      type: 'switch',
      displayName: 'Style',
      options: [
        { displayName: 'Normal', value: 'normal', iconName: 'minus' },
        { displayName: 'Oblique', value: 'oblique', iconName: 'oblique' },
        { displayName: 'Italic', value: 'italic', iconName: 'italic' },
      ],
      isIcon: true,
      accordian: 'Text',
    },
    textColor: {
      type: 'colorSwatches',
      displayName: 'Color',
      validation: {
        schema: { type: 'string' },
      },
      accordian: 'Text',
    },
    isScrollRequired: {
      type: 'switch',
      displayName: 'Scroll',
      options: [
        { displayName: 'Enable', value: 'enabled' },
        { displayName: 'Disable', value: 'disabled' },
      ],
      accordian: 'Text',
    },
    lineHeight: { type: 'numberInput', displayName: 'Line height', accordian: 'Text' },
    textIndent: { type: 'numberInput', displayName: 'Text indent', accordian: 'Text' },
    textAlign: {
      type: 'alignButtons',
      displayName: 'Alignment',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'left',
      },
      accordian: 'Text',
    },
    verticalAlignment: {
      type: 'switch',
      displayName: '',
      validation: { schema: { type: 'string' }, defaultValue: 'center' },
      showLabel: false,
      isIcon: true,
      options: [
        { displayName: 'alignverticallytop', value: 'top', iconName: 'alignverticallytop' },
        { displayName: 'alignverticallycenter', value: 'center', iconName: 'alignverticallycenter' },
        { displayName: 'alignverticallybottom', value: 'bottom', iconName: 'alignverticallybottom' },
      ],
      accordian: 'Text',
      isFxNotRequired: true,
    },
    decoration: {
      type: 'switch',
      displayName: 'Decoration',
      isIcon: true,
      options: [
        { displayName: 'none', value: 'none', iconName: 'minus' },
        { displayName: 'underline', value: 'underline', iconName: 'underline' },
        { displayName: 'overline', value: 'overline', iconName: 'overline' },
        { displayName: 'line-through', value: 'line-through', iconName: 'linethrough' },
      ],
      accordian: 'Text',
    },
    transformation: {
      type: 'switch',
      displayName: 'Transformation',
      isIcon: true,
      options: [
        { displayName: 'none', value: 'none', iconName: 'minus' },
        { displayName: 'uppercase', value: 'uppercase', iconName: 'uppercase' },
        { displayName: 'lowercase', value: 'lowercase', iconName: 'lowercase' },
        { displayName: 'capitalize', value: 'capitalize', iconName: 'capitalize' },
      ],
      accordian: 'Text',
    },
    letterSpacing: { type: 'numberInput', displayName: 'Letter spacing', accordian: 'Text' },
    wordSpacing: { type: 'numberInput', displayName: 'Word spacing', accordian: 'Text' },
    fontVariant: {
      type: 'select',
      displayName: 'Font variant',
      options: [
        { name: 'normal', value: 'normal' },
        { name: 'small-caps', value: 'small-caps' },
        { name: 'initial', value: 'initial' },
        { name: 'inherit', value: 'inherit' },
      ],
      accordian: 'Text',
    },

    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Background',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#fff00000',
      },
      accordian: 'Container',
      colorPickerPosition: 'top',
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#000000',
      },
      accordian: 'Container',
      colorPickerPosition: 'top',
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
      validation: { schema: { type: 'string' }, defaultValue: 'default' },
      options: [
        { displayName: 'Default', value: 'default' },
        { displayName: 'None', value: 'none' },
      ],
      accordian: 'Container',
      isFxNotRequired: true,
    },
  },
  exposedVariables: {
    text: 'Hello, there!',
  },
  actions: [
    {
      handle: 'setText',
      displayName: 'Set text',
      params: [{ handle: 'text', displayName: 'Text', defaultValue: 'New text' }],
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'setVisibility', displayName: 'Value', defaultValue: `{{true}}`, type: 'toggle' }],
    },
    {
      handle: 'clear',
      displayName: 'Clear',
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
      textFormat: { value: 'html' },
      dynamicHeight: { value: '{{false}}' },
      text: { value: `Hello {{globals.currentUser.firstName}}👋` },
      loadingState: { value: `{{false}}` },
      disabledState: { value: '{{false}}' },
      visibility: { value: '{{true}}' },
    },
    events: [],
    styles: {
      backgroundColor: { value: '#fff00000' },
      textColor: { value: '#000000' },
      textSize: { value: '{{14}}' },
      textAlign: { value: 'left' },
      fontWeight: { value: 'normal' },
      decoration: { value: 'none' },
      transformation: { value: 'none' },
      fontStyle: { value: 'normal' },
      lineHeight: { value: '{{1.5}}' },
      textIndent: { value: '{{0}}' },
      letterSpacing: { value: '{{0}}' },
      wordSpacing: { value: '{{0}}' },
      fontVariant: { value: 'normal' },
      verticalAlignment: { value: 'center' },
      padding: { value: 'default' },
      boxShadow: { value: '0px 0px 0px 0px #00000090' },
      borderColor: { value: '' },
      borderRadius: { value: '{{6}}' },
      isScrollRequired: { value: 'enabled' },
    },
  },
};
