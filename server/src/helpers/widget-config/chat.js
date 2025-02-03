export const chatConfig = {
  name: 'Chat',
  displayName: 'Chat',
  description: 'Chat interface with message history',
  component: 'Chat',
  defaultSize: {
    width: 15,
    height: 400,
  },
  properties: {
    chatTitle: {
      type: 'code',
      displayName: 'Chat Title',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Chat',
      },
    },
    initialChat: {
      type: 'code',
      displayName: 'Initial Chat',
      validation: {
        schema: {
          type: 'array',
          element: { type: 'object' },
          defaultValue: '{{[]}}',
        },
      },
    },
    userName: {
      type: 'code',
      displayName: 'User Name',
      validation: {
        schema: { type: 'string' },
        defaultValue: '{{globals.currentUser.firstName}}',
      },
      section: 'settings',
    },
    userAvatar: {
      type: 'code',
      displayName: 'User Avatar',
      validation: {
        schema: { type: 'string' },
        defaultValue: '',
      },
      section: 'settings',
    },
    respondentName: {
      type: 'code',
      displayName: 'Respondent Name',
      validation: {
        schema: { type: 'string' },
        defaultValue: '',
      },
      section: 'settings',
    },
    respondentAvatar: {
      type: 'code',
      displayName: 'Respondent Avatar',
      validation: {
        schema: { type: 'string' },
        defaultValue: '',
      },
      section: 'settings',
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
    disableInput: {
      type: 'toggle',
      displayName: 'Disable Input',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    loadingHistory: {
      type: 'toggle',
      displayName: 'Loading History',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    loadingResponse: {
      type: 'toggle',
      displayName: 'Loading Response',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
  },

  events: {
    onMessageSent: { displayName: 'On Message Sent' },
    onMessageDeleted: { displayName: 'On Message Deleted' },
  },
  styles: {
    name: {
      type: 'color',
      displayName: 'Name',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#1B1F24',
      },
      accordian: 'Message',
    },
    message: {
      type: 'color',
      displayName: 'Message',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#1B1F24',
      },
      accordian: 'Message',
    },
    timestamp: {
      type: 'color',
      displayName: 'Timestamp',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#6A727C',
      },
      accordian: 'Message',
    },
    backgroundColorField: {
      type: 'color',
      displayName: 'Background',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#FFFFFF',
      },
      accordian: 'Field',
    },
    borderColorField: {
      type: 'color',
      displayName: 'Border',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#CCD1D5',
      },
      accordian: 'Field',
    },
    accentColorField: {
      type: 'color',
      displayName: 'Accent',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#4368E3',
      },
      accordian: 'Field',
    },
    textColorField: {
      type: 'color',
      displayName: 'Text',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#11181C',
      },
      accordian: 'Field',
    },
    sendIconColorField: {
      type: 'color',
      displayName: 'Send Icon',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#4368E3',
      },
      accordian: 'Field',
    },
    containerBackgroundColor: {
      type: 'color',
      displayName: 'Background',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#FFFFFF',
      },
      accordian: 'Container',
    },
    borderColorContainer: {
      type: 'color',
      displayName: 'Border',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#CCD1D5',
      },
      accordian: 'Container',
    },
    boxShadowContainer: {
      type: 'color',
      displayName: 'Box Shadow',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#121212',
      },
      accordian: 'Container',
    },
  },
  exposedVariables: {
    lastMessage: {},
    history: [],
    isVisible: true,
    isDisabled: false,
    isHistoryLoading: false,
    isReplyLoading: false,
    lastResponse: {},
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  actions: [
    {
      handle: 'sendMessage',
      displayName: 'Send Message',
      params: [{ handle: 'message', displayName: 'Message', defaultValue: '{{{}}}', type: 'code' }],
    },
    {
      handle: 'clearHistory',
      displayName: 'Clear History',
      params: [],
    },
    {
      handle: 'deleteMessage',
      displayName: 'Delete Message',
      params: [{ handle: 'messageId', displayName: 'Message Id', defaultValue: '', type: 'code' }],
    },
    {
      handle: 'setResponseLoading',
      displayName: 'Set Response Loading',
      params: [{ handle: 'loading', displayName: 'Loading', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setHistoryLoading',
      displayName: 'Set History Loading',
      params: [{ handle: 'loading', displayName: 'Loading', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setHistory',
      displayName: 'Set History',
      params: [{ handle: 'history', displayName: 'History', defaultValue: '{{[]}}', type: 'code' }],
    },
    {
      handle: 'appendHistory',
      displayName: 'Append History',
      params: [{ handle: 'message', displayName: 'Message', defaultValue: '{{{}}}', type: 'code' }],
    },
    {
      handle: 'setVisibility',
      displayName: 'Set Visibility',
      params: [{ handle: 'visible', displayName: 'Visible', defaultValue: '{{true}}', type: 'toggle' }],
    },
    {
      handle: 'setNewMessageDisabled',
      displayName: 'Set New Message Disabled',
      params: [{ handle: 'disabled', displayName: 'Disabled', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setResponderAvatar',
      displayName: 'Set Responder Avatar',
      params: [{ handle: 'avatar', displayName: 'Avatar', defaultValue: '', type: 'code' }],
    },
    {
      handle: 'setUserAvatar',
      displayName: 'Set User Avatar',
      params: [{ handle: 'avatar', displayName: 'Avatar', defaultValue: '', type: 'code' }],
    },
    {
      handle: 'setError',
      displayName: 'Set Error',
      params: [{ handle: 'error', displayName: 'Error', defaultValue: '', type: 'code' }],
    },
    {
      handle: 'downloadChat',
      displayName: 'Download Chat',
      params: [],
    },
  ],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      chatTitle: { value: 'Chat' },
      initialChat: { value: '{{[]}}' },
      userName: { value: '{{globals.currentUser.firstName}}' },
      userAvatar: { value: '' },
      respondentName: { value: 'Assistant' },
      respondentAvatar: { value: '' },
      visibility: { value: '{{true}}' },
      disableInput: { value: '{{false}}' },
      loadingHistory: { value: '{{false}}' },
      loadingResponse: { value: '{{false}}' },
    },
    events: [],
    styles: {
      name: { value: '#1B1F24' },
      message: { value: '#1B1F24' },
      timestamp: { value: '#6A727C' },
      backgroundColorField: { value: '#FFFFFF' },
      borderColorField: { value: '#CCD1D5' },
      accentColorField: { value: '#4368E3' },
      textColorField: { value: '#11181C' },
      sendIconColorField: { value: '#4368E3' },
      containerBackgroundColor: { value: '#FFFFFF' },
      borderColorContainer: { value: '#CCD1D5' },
      boxShadowContainer: { value: '#121212' },
    },
  },
};
