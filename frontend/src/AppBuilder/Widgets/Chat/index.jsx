import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import '@/_styles/widgets/chat.scss';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessage } from './components/ChatMessage';
import { RespondentLoadingMessage } from './components/RespondentLoadingMessage';
import { ChatInput } from './components/ChatInput';
// import { useChatState } from './hooks/useChatState';
// import { useChatActions } from './hooks/useChatActions';
// import { useExposedActions } from './hooks/useExposedActions';
import { useComputedStyles } from './hooks/useComputedStyles';
import { LoadingMessageSkeleton } from './components/LoadingMessageSkeleton';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

export const Chat = ({ id, component, properties, styles, setExposedVariables, fireEvent }) => {
  const darkTheme = localStorage.getItem('darkMode') === 'true';
  const chatMessagesRef = useRef(null);

  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [chatTitle, setChatTitle] = useState(properties.chatTitle);
  const [userName, setUserName] = useState(properties.userName);
  const [userAvatar, setUserAvatar] = useState(properties.userAvatar);
  const [respondentName, setRespondentName] = useState(properties.respondentName);
  const [respondentAvatar, setRespondentAvatar] = useState(properties.respondentAvatar);
  const [visibility, setVisibility] = useState(properties.visibility);
  const [loadingResponse, setLoadingResponse] = useState(properties.loadingResponse);
  const [loadingHistory, setLoadingHistory] = useState(properties.loadingHistory);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState(properties.initialChat || []);
  const [newMessageDisabled, setNewMessageDisabled] = useState(false);
  const [error, setError] = useState(null);
  const [enableClearHistoryButton, setEnableClearHistoryButton] = useState(properties.enableClearHistoryButton);
  const [enableDownloadHistoryButton, setEnableDownloadHistoryButton] = useState(
    properties.enableDownloadHistoryButton
  );
  const [placeholder, setPlaceholder] = useState(properties.placeholder);

  const computedStyles = useComputedStyles(styles);

  const adjustTextareaHeight = (element, value) => {
    if (element.scrollHeight <= 36 || value.trim() === '') {
      element.style.height = '36px';
      element.classList.remove('scrollable');
      return;
    }

    // Only adjust height if content exceeds 36px
    const newHeight = Math.min(element.scrollHeight, 36 * 3.22); // 36px * 5 lines max
    element.style.height = `${newHeight}px`;

    // Add scrollable class if content height reaches max height
    if (element.scrollHeight >= 36 * 3.22) {
      element.classList.add('scrollable');
    } else {
      element.classList.remove('scrollable');
    }
  };

  const createMessage = (message, type) => {
    console.log('createMessage', { type, userName, respondentName, userAvatar, respondentAvatar });

    const newMessage = {
      message,
      messageId: uuidv4(),
      timestamp: new Date().toISOString(),
      name: type === 'message' ? userName : respondentName,
      avatar: type === 'message' ? userAvatar : respondentAvatar,
      type,
    };
    console.log('createMessage newMessage', { newMessage });

    return newMessage;
  };

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

  const clearHistory = (shouldFireEvent = true) => {
    setChatHistory(properties.initialChat);
    if (error) setError(null);
    setExposedVariables({ history: properties.initialChat, lastMessage: {}, lastResponse: {} });
    if (shouldFireEvent) fireEvent('onClearHistory');
  };

  const downloadChatHistory = () => {
    try {
      if (!Array.isArray(chatHistory) || chatHistory.length === 0) {
        toast.error('No chat history to download');
        return;
      }

      const jsonString = JSON.stringify(chatHistory, null, 2);
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

  useEffect(() => {
    setChatHistory(properties.initialChat);
    setExposedVariables({ history: properties.initialChat });
  }, [properties.initialChat]);

  useEffect(() => setUserName(properties.userName), [properties.userName]);
  useEffect(() => setUserAvatar(properties.userAvatar), [properties.userAvatar]);
  useEffect(() => setRespondentName(properties.respondentName), [properties.respondentName]);
  useEffect(() => setRespondentAvatar(properties.respondentAvatar), [properties.respondentAvatar]);
  useEffect(() => setChatTitle(properties.chatTitle), [properties.chatTitle]);

  useEffect(() => {
    setLoadingResponse(properties.loadingResponse);
    setExposedVariables({ isResponseLoading: properties.loadingResponse });
  }, [properties.loadingResponse]);

  useEffect(() => {
    setLoadingHistory(properties.loadingHistory);
    setExposedVariables({ isHistoryLoading: properties.loadingHistory });
  }, [properties.loadingHistory]);

  useEffect(() => {
    setVisibility(properties.visibility);
    setExposedVariables({ isVisible: properties.visibility });
  }, [properties.visibility]);

  useEffect(() => {
    setNewMessageDisabled(properties.disableInput);
    setExposedVariables({ isInputDisabled: properties.disableInput });
  }, [properties.disableInput]);

  useEffect(() => {
    setEnableClearHistoryButton(properties.enableClearHistoryButton);
  }, [properties.enableClearHistoryButton]);

  useEffect(() => {
    setEnableDownloadHistoryButton(properties.enableDownloadHistoryButton);
  }, [properties.enableDownloadHistoryButton]);

  useEffect(() => {
    setPlaceholder(properties.placeholder);
  }, [properties.placeholder]);

  // Memoize the chat messages to prevent unnecessary re-renders
  const chatMessages = useMemo(() => {
    return (
      Array.isArray(chatHistory) &&
      chatHistory.map((chat, index) => (
        <ChatMessage
          key={chat.messageId || index} // Use messageId if available, fallback to index
          chat={chat}
          userName={userName}
          respondentName={respondentName}
          userAvatar={userAvatar}
          respondentAvatar={respondentAvatar}
          computedStyles={computedStyles}
        />
      ))
    );
  }, [chatHistory]);

  // Set initial exposed variables
  useEffect(() => {
    const exposedVariables = {
      sendMessage: async function (messageObject) {
        const { message, type = 'message' } = messageObject;
        //addded thrid parameter as false to not fire event internally for csa, user has to fire event manually
        handleSendMessage(message, type, false);
      },
      clearHistory: async function () {
        clearHistory(false);
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
        console.log('createMessage inside appendHistory exposes', {
          userName,
          respondentName,
          userAvatar,
          respondentAvatar,
        });
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
      setInputDisable: async function (disabled) {
        setNewMessageDisabled(disabled);
        setExposedVariables({ isInputDisabled: !!disabled });
      },
      setError: async function (errorMessage = 'Some error occurred. Please retry.') {
        setError(errorMessage || 'Some error occurred. Please retry.');
      },
      downloadChat: downloadChatHistory,
      setResponseLoading: async function (loading) {
        setLoadingResponse(loading);
        setExposedVariables({ isResponseLoading: loading });
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

    setExposedVariables(exposedVariables);
  }, [userName, respondentName, userAvatar, respondentAvatar]);

  // Watch for chat history changes and scroll if needed
  useEffect(() => {
    if (!shouldScrollToBottom) {
      setShouldScrollToBottom(true); // Reset for next update
      return;
    }

    if (chatMessagesRef.current) {
      const lastMessage = chatMessagesRef.current.lastElementChild;
      if (lastMessage) {
        const containerRect = chatMessagesRef.current.getBoundingClientRect();
        const messageRect = lastMessage.getBoundingClientRect();
        const relativeTop = messageRect.top - containerRect.top;

        chatMessagesRef.current.scrollTo({
          top: chatMessagesRef.current.scrollTop + relativeTop,
          behavior: 'smooth',
        });
      }
    }
  }, [chatHistory, error, loadingResponse, loadingHistory]);

  if (!visibility) return null;

  return (
    <div id={id} className={`chat-widget ${darkTheme ? 'dark-theme' : ''}`} style={computedStyles.container}>
      <ChatHeader
        title={chatTitle}
        onDownload={downloadChatHistory}
        onClear={clearHistory}
        enableClearHistoryButton={enableClearHistoryButton}
        enableDownloadHistoryButton={enableDownloadHistoryButton}
      />

      <div ref={chatMessagesRef} className="chat-messages" tabIndex={0} style={{ flexGrow: 1, overflowY: 'auto' }}>
        {chatMessages}

        {error && (
          <ChatMessage
            chat={{ type: 'error', message: error, timestamp: new Date().toISOString() }}
            userName={userName}
            respondentName={respondentName}
            userAvatar={userAvatar}
            respondentAvatar={respondentAvatar}
            computedStyles={computedStyles}
          />
        )}

        {loadingResponse && <RespondentLoadingMessage userAvatar={userAvatar} respondentAvatar={respondentAvatar} />}

        {loadingHistory && <LoadingMessageSkeleton />}
      </div>

      <ChatInput
        message={message}
        onChange={(e) => {
          setMessage(e.target.value);
          adjustTextareaHeight(e.target, e.target.value);
        }}
        onSend={() => {
          const type = 'message';
          const shouldFireEvent = true;
          handleSendMessage(message, type, shouldFireEvent);
          setShouldScrollToBottom(true); // Ensure scrolling on new message
        }}
        disabled={properties.disableInput}
        loading={loadingResponse}
        newMessageDisabled={newMessageDisabled}
        computedStyles={computedStyles}
        placeholder={placeholder}
      />
    </div>
  );
};
