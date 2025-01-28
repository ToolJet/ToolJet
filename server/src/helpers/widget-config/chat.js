export const chatConfig = {
    name: 'Chat',
    displayName: 'Chat',
    description: 'Chat interface with message history',
    component: 'Chat',
    defaultSize: {
      width: 15,
      height: 400,
    },
    others: {
      showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
      showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
      title: {
        type: 'code',
        displayName: 'Chat Title',
        validation: {
          schema: { type: 'string' },
        },
        defaultValue: 'Chat',
      },
      initialChat: {
        type: 'code',
        displayName: 'Initial Chat',
        validation: {
          schema: { type: 'object' },
        },
        defaultValue: '{{[]}}',
      },
    },
    // settings: {
    //   userName: {
    //     type: 'code',
    //     displayName: 'User Name',
    //     validation: {
    //       schema: { type: 'string' },
    //     },
    //     defaultValue: '{{globals.currentUser.firstName}}',
    //   },
    //   userAvatar: {
    //     type: 'code',
    //     displayName: 'User Avatar',
    //     validation: {
    //       schema: { type: 'string' },
    //     },
    //     defaultValue: '',
    //   },
    //   respondentName: {
    //     type: 'code',
    //     displayName: 'Respondent Name',
    //     validation: {
    //       schema: { type: 'string' },
    //     },
    //     defaultValue: 'Assistant',
    //   },
    //   respondentAvatar: {
    //     type: 'code',
    //     displayName: 'Respondent Avatar',
    //     validation: {
    //       schema: { type: 'string' },
    //     },
    //     defaultValue: '',
    //   },
    // },
    events: {
      onMessageSent: { displayName: 'On Message Sent' },
    },
    styles: {
      visibility: {
        type: 'toggle',
        displayName: 'Visibility',
        validation: {
          schema: { type: 'boolean' },
        },
        defaultValue: true,
      },
      boxShadow: {
        type: 'code',
        displayName: 'Box Shadow',
        validation: {
          schema: { type: 'string' },
        },
        defaultValue: 'none',
      },
      disableInput: {
        type: 'toggle',
        displayName: 'Disable Input',
        validation: {
          schema: { type: 'boolean' },
        },
        defaultValue: false,
      },
      loadingHistory: {
        type: 'toggle',
        displayName: 'Loading History',
        validation: {
          schema: { type: 'boolean' },
        },
        defaultValue: false,
      },
      loadingResponse: {
        type: 'toggle',
        displayName: 'Loading Response',
        validation: {
          schema: { type: 'boolean' },
        },
        defaultValue: false,
      },
    },
    exposedVariables: {
      history: '[]',
      lastMessage: '',
      messageCount: 0,
      isVisible: true,
      isDisabled: false,
      isHistoryLoading: false,
      isReplyLoading: false,
      lastResponse: {},
    },
    definition: {
      others: {
        showOnDesktop: { value: '{{true}}' },
        showOnMobile: { value: '{{false}}' },
      },
      properties: {
        title: { value: 'Chat' },
        initialChat: { value: '{{[]}}' },
      },
      // settings: {
      //   userName: { value: '{{globals.currentUser.firstName}}' },
      //   userAvatar: { value: '' },
      //   respondentName: { value: 'Assistant' },
      //   respondentAvatar: { value: '' },
      // },
      events: [],
      styles: {
        visibility: { value: '{{true}}' },
        boxShadow: { value: 'none' },
        disableInput: { value: '{{false}}' },
        loadingHistory: { value: '{{false}}' },
        loadingResponse: { value: '{{false}}' },
      },
    },
  };
  