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
        onMessageSent: { displayName: 'On message sent' },
        onClearHistory: { displayName: 'On history cleared' },
    },
    styles: {
        name: {
            type: 'colorSwatches',
            displayName: 'Name',
            validation: {
                schema: { type: 'string' },
                defaultValue: 'var(--cc-primary-text)',
            },
            accordian: 'Message',
        },
        message: {
            type: 'colorSwatches',
            displayName: 'Message',
            validation: {
                schema: { type: 'string' },
                defaultValue: 'var(--cc-primary-text)',
            },
            accordian: 'Message',
        },
        timestamp: {
            type: 'colorSwatches',
            displayName: 'Timestamp',
            validation: {
                schema: { type: 'string' },
                defaultValue: 'var(--cc-placeholder-text)',
            },
            accordian: 'Message',
        },
        backgroundColorField: {
            type: 'colorSwatches',
            displayName: 'Background',
            validation: {
                schema: { type: 'string' },
                defaultValue: 'var(--cc-surface1-surface)',
            },
            accordian: 'Field',
        },
        borderColorField: {
            type: 'colorSwatches',
            displayName: 'Border',
            validation: {
                schema: { type: 'string' },
                defaultValue: 'var(--cc-default-border)',
            },
            accordian: 'Field',
        },
        accentColorField: {
            type: 'colorSwatches',
            displayName: 'Accent',
            validation: {
                schema: { type: 'string' },
                defaultValue: 'var(--cc-primary-brand)',
            },
            accordian: 'Field',
        },
        textColorField: {
            type: 'colorSwatches',
            displayName: 'Text',
            validation: {
                schema: { type: 'string' },
                defaultValue: 'var(--cc-primary-text)',
            },
            accordian: 'Field',
        },
        sendIconColorField: {
            type: 'colorSwatches',
            displayName: 'Send icon',
            validation: {
                schema: { type: 'string' },
                defaultValue: 'var(--cc-primary-brand)',
            },
            accordian: 'Field',
        },
        containerBackgroundColor: {
            type: 'colorSwatches',
            displayName: 'Background',
            validation: {
                schema: { type: 'string' },
                defaultValue: 'var(--cc-surface1-surface)',
            },
            accordian: 'Container',
        },
        borderColorContainer: {
            type: 'colorSwatches',
            displayName: 'Border',
            validation: {
                schema: { type: 'string' },
                defaultValue: 'var(--cc-default-border)',
            },
            accordian: 'Container',
        },
        boxShadowContainer: {
            type: 'colorSwatches',
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
            name: { value: 'var(--cc-primary-text)' },
            message: { value: 'var(--cc-primary-text)' },
            timestamp: { value: 'var(--cc-placeholder-text)' },
            backgroundColorField: { value: 'var(--cc-surface1-surface)' },
            borderColorField: { value: 'var(--cc-default-border)' },
            accentColorField: { value: 'var(--cc-primary-brand)' },
            textColorField: { value: 'var(--cc-primary-text)' },
            sendIconColorField: { value: 'var(--cc-primary-brand)' },
            containerBackgroundColor: { value: 'var(--cc-surface1-surface)' },
            borderColorContainer: { value: 'var(--cc-weak-border)' },
            boxShadowContainer: { value: '#121212' },
        },
    },
};
