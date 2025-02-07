import React, { useEffect, useRef, useState, useMemo } from 'react';
import '@/_styles/widgets/chat.scss';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessage } from './components/ChatMessage';
import { RespondentLoadingMessage } from './components/RespondentLoadingMessage';
import { ChatInput } from './components/ChatInput';
import { useComputedStyles } from './hooks/useComputedStyles';
import { LoadingMessageSkeleton } from './components/LoadingMessageSkeleton';
import { v4 as uuidv4 } from 'uuid';
import { validateMessageHistory, validateSingleMessageObject } from './utils/helpers';

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

  // Add a ref to track pending message events
  const pendingMessageEventRef = useRef(false);

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

  const createMessage = (messageObject) => {
    const { message, type, name = '', avatar = '' } = messageObject;
    console.log('createMessage', { type, userName, respondentName, userAvatar, respondentAvatar });

    const newMessage = {
      message,
      messageId: uuidv4(),
      timestamp: new Date().toISOString(),
      name: name || (type === 'message' ? userName : respondentName),
      avatar: avatar || (type === 'message' ? userAvatar : respondentAvatar),
      type,
    };

    return newMessage;
  };

  const updateChatHistoryWhileSendingMessage = (newMessage, shouldFireEvent) => {
    // Set the ref if we should fire event
    if (shouldFireEvent) {
      pendingMessageEventRef.current = true;
    }

    setChatHistory((currentHistory) => {
      const updatedHistory = [...currentHistory, newMessage];
      const exposedVariables = {
        history: updatedHistory,
        lastMessage: newMessage,
      };
      if (error) setError(null);
      setExposedVariables(exposedVariables);
      return updatedHistory;
    });
  };

  const handleSendMessage = async (messageObject, shouldFireEvent = true) => {
    const newMessage = createMessage(messageObject);
    await updateChatHistoryWhileSendingMessage(newMessage, shouldFireEvent);
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
    if (error) setError(null);
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
        <div key={chat.messageId || index}>
          <ChatMessage
            chat={chat}
            userName={userName}
            respondentName={respondentName}
            userAvatar={userAvatar}
            respondentAvatar={respondentAvatar}
            computedStyles={computedStyles}
          />
        </div>
      ))
    );
  }, [chatHistory]);

  // Set initial exposed variables
  useEffect(() => {
    const exposedVariables = {
      sendMessage: async function (messageObject) {
        const { isValid, error } = validateSingleMessageObject(messageObject);
        if (!isValid) {
          toast.error(error);
          return;
        }
        // const { message, type = 'message' } = messageObject;
        //addded thrid parameter as false to not fire event internally for csa, user has to fire event manually
        handleSendMessage(messageObject, false);
      },
      clearHistory: async function () {
        if (error) setError(null);
        clearHistory(false);
      },

      setHistory: async function (history) {
        const { isValid, error } = validateMessageHistory(history);
        if (!isValid) {
          toast.error(error);
          return;
        }
        setChatHistory(history);
        if (error) setError(null);
        setExposedVariables({ history });
      },

      appendHistory: async function (messageObject) {
        const { isValid, error } = validateSingleMessageObject(messageObject);
        if (!isValid) {
          toast.error(error);
          return;
        }

        const newMessage = createMessage(messageObject);
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
          if (error) setError(null);
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

  useEffect(() => {
    if (error) setError(null);
  }, [chatHistory]);

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

  // Add useEffect to handle message sent event after render
  useEffect(() => {
    if (pendingMessageEventRef.current) {
      // Reset the ref
      pendingMessageEventRef.current = false;
      // Fire the event
      fireEvent('onMessageSent');
    }
  }, [chatHistory]); // This will run after chatHistory updates and renders

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
        {!loadingHistory && chatMessages}

        {!loadingHistory && error && (
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
          handleSendMessage({ message, type }, shouldFireEvent);
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
