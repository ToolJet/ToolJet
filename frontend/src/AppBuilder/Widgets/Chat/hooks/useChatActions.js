import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';

export const useChatActions = (state, setExposedVariables, fireEvent) => {
  const { setChatHistory, setMessage, setError, properties, error } = state;

  const createMessage = (message, type) => ({
    message,
    messageId: uuidv4(),
    timestamp: new Date().toISOString(),
    name: type === 'message' ? properties.userName : properties.respondentName,
    avatar: type === 'message' ? properties.userAvatar : properties.respondentAvatar,
    type,
  });

  const updateChatHistoryWhileSendingMessage = (newMessage, shouldFireEvent) => {
    setChatHistory((currentHistory) => {
      const updatedHistory = [...currentHistory, newMessage];
      const exposedVariables = {
        history: updatedHistory,
        lastMessage: newMessage,
      };
      if (error) setError(null);
      setExposedVariables(exposedVariables);
      if (shouldFireEvent) fireEvent('onMessageSent');
      return updatedHistory;
    });
  };

  const handleSendMessage = (message, type = 'message', shouldFireEvent = true) => {
    // No event should fired internally for csa , hence use this shouldFireEvent flag
    if (!message) return;
    const newMessage = createMessage(message, type);
    updateChatHistoryWhileSendingMessage(newMessage, shouldFireEvent);
    setMessage('');
  };

  const clearHistory = () => {
    setChatHistory([]);
    if (error) setError(null);
    setExposedVariables({ history: [], lastMessage: {}, lastResponse: {} });
  };

  const handleDeleteMessageById = (messageId) => {
    setChatHistory((currentHistory) => {
      const updatedHistory = currentHistory.filter((msg) => msg.messageId !== messageId);
      const exposedVariables = {
        history: updatedHistory,
      };
      //TODO: Add logic to discard lastMessage or lastResponse if messageId is present in the either of them
      setExposedVariables(exposedVariables);
      fireEvent('onMessageDeleted', messageId);
      return updatedHistory;
    });
  };

  const downloadChatHistory = () => {
    try {
      if (!Array.isArray(state.chatHistory) || state.chatHistory.length === 0) {
        toast.error('No chat history to download');
        return;
      }

      const jsonString = JSON.stringify(state.chatHistory, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chat-history-${new Date().toISOString()}.json`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Chat history downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download chat history: ${error.message || 'Unknown error'}`);
    }
  };

  return {
    handleSendMessage,
    clearHistory,
    handleDeleteMessageById,
    downloadChatHistory,
    createMessage,
  };
};
