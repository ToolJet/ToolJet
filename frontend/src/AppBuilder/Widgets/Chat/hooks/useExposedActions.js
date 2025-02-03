import toast from 'react-hot-toast';

export const useExposedActions = (actions, state, setExposedVariables) => {
  const { handleSendMessage, clearHistory, handleDeleteMessageById, downloadChatHistory, createMessage } = actions;

  const {
    setChatHistory,
    setVisibility,
    setNewMessageDisabled,
    setError,
    setLoadingResponse,
    setLoadingHistory,
    error,
    setRespondentAvatar,
    setUserAvatar,
  } = state;

  return {
    sendMessage: async function (messageObject) {
      const { message, type = 'message' } = messageObject;
      handleSendMessage(message, type);
    },
    clearHistory,
    deleteMessage: async function (messageId) {
      handleDeleteMessageById(messageId);
    },
    setHistory: async function (history) {
      if (!Array.isArray(history)) {
        toast.error('History is not an array');
        return;
      }
      setChatHistory(history);
      if (error) setError(null);
      setExposedVariables({ history });
    },
    appendHistory: async function (messageObject) {
      if (!messageObject || typeof messageObject !== 'object' || Array.isArray(messageObject)) {
        toast.error('Invalid message object');
        return;
      }

      const { message, type } = messageObject;
      if (!message || !type) {
        toast.error('Message and type are required');
        return;
      }

      const newMessage = createMessage(message, type);
      setChatHistory((currentHistory) => {
        const updatedHistory = [...currentHistory, newMessage];
        const exposedVariables = {
          history: updatedHistory,
        };
        if (newMessage.type === 'message') {
          exposedVariables.lastMessage = newMessage;
        } else {
          exposedVariables.lastResponse = newMessage;
        }
        setExposedVariables(exposedVariables);
        return updatedHistory;
      });
    },
    setVisibility: async function (visibility) {
      setVisibility(visibility);
      setExposedVariables({ isVisible: !!visibility });
    },
    disableInput: async function (disabled) {
      setNewMessageDisabled(disabled);
      setExposedVariables({ isDisabled: !!disabled });
    },
    setError: async function (errorMessage = 'Some error occurred. Please retry.') {
      setError(errorMessage || 'Some error occurred. Please retry.');
    },
    downloadChat: downloadChatHistory,
    setResponseLoading: async function (loading) {
      setLoadingResponse(loading);
      setExposedVariables({ isReplyLoading: loading });
    },
    setHistoryLoading: async function (loading) {
      setLoadingHistory(loading);
      setExposedVariables({ isHistoryLoading: loading });
    },
    setResponderAvatar: async function (avatar) {
      setRespondentAvatar(avatar);
    },
    setUserAvatar: async function (avatar) {
      setUserAvatar(avatar);
    },
  };
};
