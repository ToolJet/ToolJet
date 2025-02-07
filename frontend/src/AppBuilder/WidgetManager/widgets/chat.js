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
      displayName: 'Chat title',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Chat',
      },
    },
    initialChat: {
      type: 'code',
      displayName: 'Initial chat',
      validation: {
        schema: {
          type: 'array',
          element: { type: 'object' },
          defaultValue: `{{[{
              message: 'Ask me anything!',
              messageId: 'e3dd6f60-d5e8-46c5-b73b-006f2f4a34f2',
              timestamp: 'new Date().toISOString()',
              name: 'Assistant',
              avatar: '',
              type: 'response',
            },
            {
              message: 'Explain software development cycle',
              messageId: 'aad219d2-0349-4f61-a959-424bf62795f6',
              timestamp: 'new Date().toISOString()',
              name: 'User',
              avatar: '',
              type: 'message',
            }]}}`,
        },
      },
    },
    userName: {
      type: 'code',
      displayName: 'User name',
      validation: {
        schema: { type: 'string' },
        defaultValue: '{{globals.currentUser.firstName}}',
      },
    },
    userAvatar: {
      type: 'code',
      displayName: 'User avatar',
      validation: {
        schema: { type: 'string' },
        defaultValue: '',
      },
    },
    respondentName: {
      type: 'code',
      displayName: 'Respondent name',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Assistant',
      },
    },
    respondentAvatar: {
      type: 'code',
      displayName: 'Respondent avatar',
      validation: {
        schema: { type: 'string' },
        defaultValue: '',
      },
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    disableInput: {
      type: 'toggle',
      displayName: 'Disable input state',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    loadingHistory: {
      type: 'toggle',
      displayName: 'History loading state',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    loadingResponse: {
      type: 'toggle',
      displayName: 'Response loading state',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    enableClearHistoryButton: {
      type: 'toggle',
      displayName: 'Enable clear history icon',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    enableDownloadHistoryButton: {
      type: 'toggle',
      displayName: 'Enable download history icon',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    placeholder: {
      type: 'code',
      displayName: 'Placeholder for input field',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Ask me anything!',
      },
    },
  },

  events: {
    onClearHistory: { displayName: 'On history cleared' },
    onMessageSent: { displayName: 'On message sent' },
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
      displayName: 'Send icon',
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
      displayName: 'Box shadow',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#121212',
      },
      accordian: 'Container',
    },
  },
  exposedVariables: {
    history: [],
    isHistoryLoading: false,
    isInputDisabled: false,
    isResponseLoading: false,
    isVisible: true,
    lastMessage: {},
    lastResponse: {},
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  actions: [
    {
      handle: 'appendHistory',
      displayName: 'Append history',
      params: [{ handle: 'message', displayName: 'Message', defaultValue: '{{{}}}', type: 'code' }],
    },
    {
      handle: 'clearHistory',
      displayName: 'Clear history',
      params: [],
    },
    {
      handle: 'downloadChat',
      displayName: 'Download chat',
      params: [],
    },
    {
      handle: 'sendMessage',
      displayName: 'Send message',
      params: [{ handle: 'message', displayName: 'Message', defaultValue: '{{{}}}', type: 'code' }],
    },
    {
      handle: 'setError',
      displayName: 'Set error',
      params: [{ handle: 'error', displayName: 'Error', defaultValue: '', type: 'code' }],
    },
    {
      handle: 'setHistory',
      displayName: 'Set history',
      params: [{ handle: 'history', displayName: 'History', defaultValue: '{{[]}}', type: 'code' }],
    },
    {
      handle: 'setHistoryLoading',
      displayName: 'Set history loading',
      params: [{ handle: 'loading', displayName: 'Loading', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setInputDisable',
      displayName: 'Set input disable',
      params: [{ handle: 'disabled', displayName: 'Disabled', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setResponderAvatar',
      displayName: 'Set respondent avatar',
      params: [{ handle: 'avatar', displayName: 'Avatar', defaultValue: '', type: 'code' }],
    },
    {
      handle: 'setResponseLoading',
      displayName: 'Set response loading',
      params: [{ handle: 'loading', displayName: 'Loading', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setUserAvatar',
      displayName: 'Set user avatar',
      params: [{ handle: 'avatar', displayName: 'Avatar', defaultValue: '', type: 'code' }],
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'visible', displayName: 'Visible', defaultValue: '{{true}}', type: 'toggle' }],
    },
  ],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      chatTitle: { value: 'Chat' },
      initialChat: {
        value: `{{[{
              message: 'Ask me anything!',
              messageId: 'e3dd6f60-d5e8-46c5-b73b-006f2f4a34f2',
              timestamp: 'new Date().toISOString()',
              name: 'Assistant',
              avatar: '',
              type: 'response',
            },
            {
              message: 'Explain software development cycle',
              messageId: 'aad219d2-0349-4f61-a959-424bf62795f6',
              timestamp: 'new Date().toISOString()',
              name: 'User',
              avatar: '',
              type: 'message',
            }]}}`,
      },
      userName: { value: '{{globals.currentUser.firstName}}' },
      userAvatar: { value: '' },
      respondentName: { value: 'Assistant' },
      respondentAvatar: { value: '' },
      visibility: { value: '{{true}}' },
      disableInput: { value: '{{false}}' },
      loadingHistory: { value: '{{false}}' },
      loadingResponse: { value: '{{false}}' },
      enableClearHistoryButton: { value: '{{true}}' },
      enableDownloadHistoryButton: { value: '{{true}}' },
      placeholder: { value: 'Ask me anything!' },
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
      borderColorContainer: { value: '#E4E7EB' },
      boxShadowContainer: { value: '#121212' },
    },
  },
};
