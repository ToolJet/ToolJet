// GENERATED from WidgetManager/shadcnSource.conversation.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadChatConfig = {
  name: 'ShadChat',
  displayName: 'Chat',
  description:
    "ToolJet UI 2.0 chat: the native Chat widget's properties, events, exposed values and actions in the pack's look. Message rows with an avatar (an image URL, else initials) and the sender's name; the user's turns sit on the right in an accent bubble, replies on the left with markdown (lists, tables, code). A new user turn moves near the top of the view and the reply grows below it; scrolled up, the view stays where the reader is and a Jump to latest button appears. loadingResponse shows a typing indicator, loadingHistory skeleton rows. A message is { message, type: 'message' (user) | 'response' | 'error', name, avatar, timestamp, messageId }. Wire onMessageSent to a query that reads components.<chat>.lastMessage.message and appends its answer with the appendHistory action ({ message, type: 'response' }), with setResponseLoading around it. Height: fixed (the messages scroll); give it 400 to 700px",
  component: 'ShadChat',
  defaultSize: {
    width: 15,
    height: 480,
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
    chatTitle: {
      type: 'code',
      displayName: 'Chat title',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'Chat',
      },
    },
    initialChat: {
      type: 'code',
      displayName: 'Initial chat',
      validation: {
        schema: {
          type: 'array',
          element: {
            type: 'object',
          },
          optional: true,
        },
        defaultValue: [],
      },
      placeholder: "[{ message: 'Hi!', type: 'response', name: 'Assistant' }]",
    },
    userName: {
      type: 'code',
      displayName: 'User name',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '{{globals.currentUser.firstName}}',
      },
    },
    userAvatar: {
      type: 'code',
      displayName: 'User avatar',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    respondentName: {
      type: 'code',
      displayName: 'Respondent name',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'Assistant',
      },
    },
    respondentAvatar: {
      type: 'code',
      displayName: 'Respondent avatar',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    placeholder: {
      type: 'code',
      displayName: 'Placeholder for input field',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'Ask me anything!',
      },
    },
    emptyText: {
      type: 'code',
      displayName: 'Empty chat text',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'Start the conversation',
      },
    },
    disableInput: {
      type: 'toggle',
      displayName: 'Disable input state',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
    },
    loadingHistory: {
      type: 'toggle',
      displayName: 'History loading state',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
    },
    loadingResponse: {
      type: 'toggle',
      displayName: 'Response loading state',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
    },
    enableClearHistoryButton: {
      type: 'toggle',
      displayName: 'Enable clear history icon',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
    },
    enableDownloadHistoryButton: {
      type: 'toggle',
      displayName: 'Enable download history icon',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
    },
    showAvatars: {
      type: 'toggle',
      displayName: 'Show avatars',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
    },
    showTimestamps: {
      type: 'toggle',
      displayName: 'Show timestamps',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
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
    onMessageSent: {
      displayName: 'On message sent',
    },
    onClearHistory: {
      displayName: 'On history cleared',
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
    containerBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Background',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    borderColorContainer: {
      type: 'colorSwatches',
      displayName: 'Border',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Border radius',
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
    accentColorField: {
      type: 'colorSwatches',
      displayName: 'Accent (your messages, send button, focus)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    responseBubbleColor: {
      type: 'colorSwatches',
      displayName: 'Reply bubble background',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    name: {
      type: 'colorSwatches',
      displayName: 'Name color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    message: {
      type: 'colorSwatches',
      displayName: 'Message text color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    timestamp: {
      type: 'colorSwatches',
      displayName: 'Timestamp color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    backgroundColorField: {
      type: 'colorSwatches',
      displayName: 'Input background',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    borderColorField: {
      type: 'colorSwatches',
      displayName: 'Input border',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    textColorField: {
      type: 'colorSwatches',
      displayName: 'Input text color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    sendIconColorField: {
      type: 'colorSwatches',
      displayName: 'Send icon color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
    history: [],
    isHistoryLoading: false,
    isInputDisabled: false,
    isResponseLoading: false,
    lastMessage: {},
    lastResponse: {},
  },
  actions: [
    {
      handle: 'appendHistory',
      displayName: 'Append history',
      params: [
        {
          handle: 'message',
          displayName: 'Message',
          defaultValue: '{{{}}}',
          type: 'code',
        },
      ],
    },
    {
      handle: 'clearHistory',
      displayName: 'Clear history',
    },
    {
      handle: 'downloadChat',
      displayName: 'Download chat',
    },
    {
      handle: 'sendMessage',
      displayName: 'Send message',
      params: [
        {
          handle: 'message',
          displayName: 'Message',
          defaultValue: '{{{}}}',
          type: 'code',
        },
      ],
    },
    {
      handle: 'setError',
      displayName: 'Set error',
      params: [
        {
          handle: 'error',
          displayName: 'Error',
          defaultValue: '',
          type: 'code',
        },
      ],
    },
    {
      handle: 'setHistory',
      displayName: 'Set history',
      params: [
        {
          handle: 'history',
          displayName: 'History',
          defaultValue: '{{[]}}',
          type: 'code',
        },
      ],
    },
    {
      handle: 'setHistoryLoading',
      displayName: 'Set history loading',
      params: [
        {
          handle: 'loading',
          displayName: 'Loading',
          defaultValue: '{{false}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setInputDisable',
      displayName: 'Set input disable',
      params: [
        {
          handle: 'disabled',
          displayName: 'Disabled',
          defaultValue: '{{false}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setResponderAvatar',
      displayName: 'Set respondent avatar',
      params: [
        {
          handle: 'avatar',
          displayName: 'Avatar',
          defaultValue: '',
          type: 'code',
        },
      ],
    },
    {
      handle: 'setResponseLoading',
      displayName: 'Set response loading',
      params: [
        {
          handle: 'loading',
          displayName: 'Loading',
          defaultValue: '{{false}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setUserAvatar',
      displayName: 'Set user avatar',
      params: [
        {
          handle: 'avatar',
          displayName: 'Avatar',
          defaultValue: '',
          type: 'code',
        },
      ],
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [
        {
          handle: 'visible',
          displayName: 'Visible',
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
      chatTitle: {
        value: 'Chat',
      },
      initialChat: {
        value:
          "{{[{ message: 'Hi! Ask me anything about your orders, invoices or deliveries.', messageId: 'welcome-1', timestamp: 'new Date().toISOString()', name: 'Assistant', avatar: '', type: 'response' }]}}",
      },
      userName: {
        value: '{{globals.currentUser.firstName}}',
      },
      userAvatar: {
        value: '',
      },
      respondentName: {
        value: 'Assistant',
      },
      respondentAvatar: {
        value: '',
      },
      placeholder: {
        value: 'Ask me anything!',
      },
      emptyText: {
        value: 'Start the conversation',
      },
      disableInput: {
        value: '{{false}}',
      },
      loadingHistory: {
        value: '{{false}}',
      },
      loadingResponse: {
        value: '{{false}}',
      },
      enableClearHistoryButton: {
        value: '{{true}}',
      },
      enableDownloadHistoryButton: {
        value: '{{true}}',
      },
      showAvatars: {
        value: '{{true}}',
      },
      showTimestamps: {
        value: '{{true}}',
      },
      loadingState: {
        value: '{{false}}',
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
    },
  },
};
