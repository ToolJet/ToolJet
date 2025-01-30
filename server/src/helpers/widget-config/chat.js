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
  },
  styles: {},
  exposedVariables: {
    lastMessage: {},
    history: [],
    isVisible: true,
    isDisabled: false,
    isHistoryLoading: false,
    isReplyLoading: false,
    lastResponse: {},
    setValue: '',
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
    styles: {},
  },
};
