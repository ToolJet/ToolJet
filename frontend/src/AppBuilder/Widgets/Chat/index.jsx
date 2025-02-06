import React, { useEffect, useRef, useState } from 'react';
import '@/_styles/widgets/chat.scss';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessage } from './components/ChatMessage';
import { RespondentLoadingMessage } from './components/RespondentLoadingMessage';
import { ChatInput } from './components/ChatInput';
import { useChatState } from './hooks/useChatState';
import { useChatActions } from './hooks/useChatActions';
import { useExposedActions } from './hooks/useExposedActions';
import { useComputedStyles } from './hooks/useComputedStyles';
import { LoadingMessageSkeleton } from './components/LoadingMessageSkeleton';

export const Chat = ({ id, component, properties, styles, setExposedVariables, fireEvent }) => {
  const darkTheme = localStorage.getItem('darkMode') === 'true';
  const chatMessagesRef = useRef(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const state = useChatState(properties, setExposedVariables);
  const actions = useChatActions(state, setExposedVariables, fireEvent);
  const exposedActions = useExposedActions(actions, state, setExposedVariables);
  const computedStyles = useComputedStyles(styles);
  // Set initial exposed variables
  useEffect(() => {
    setExposedVariables(exposedActions);
  }, []);

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
  }, [state.chatHistory, state.error, state.loadingResponse, state.loadingHistory]);

  // Modify the delete handler to prevent scrolling
  const handleDeleteMessage = (messageId) => {
    setShouldScrollToBottom(false); // Prevent scrolling on delete
    exposedActions.deleteMessage(messageId);
  };

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

  if (!state.visibility) return null;

  return (
    <div id={id} className={`chat-widget ${darkTheme ? 'dark-theme' : ''}`} style={computedStyles.container}>
      <ChatHeader
        title={state.chatTitle}
        onDownload={exposedActions.downloadChat}
        onClear={exposedActions.clearHistory}
      />

      <div ref={chatMessagesRef} className="chat-messages" tabIndex={0} style={{ flexGrow: 1, overflowY: 'auto' }}>
        {Array.isArray(state.chatHistory) &&
          state.chatHistory.map((chat, index) => (
            <ChatMessage
              key={index}
              chat={chat}
              userName={state.userName}
              respondentName={state.respondentName}
              userAvatar={state.userAvatar}
              respondentAvatar={state.respondentAvatar}
              onDelete={handleDeleteMessage}
              computedStyles={computedStyles}
            />
          ))}

        {state.error && (
          <ChatMessage
            chat={{ type: 'error', message: state.error, timestamp: new Date().toISOString() }}
            userName={state.userName}
            respondentName={state.respondentName}
            userAvatar={state.userAvatar}
            respondentAvatar={state.respondentAvatar}
            onDelete={handleDeleteMessage}
            computedStyles={computedStyles}
          />
        )}

        {state.loadingResponse && (
          <RespondentLoadingMessage userAvatar={state.userAvatar} respondentAvatar={state.respondentAvatar} />
        )}

        {state.loadingHistory && <LoadingMessageSkeleton />}
      </div>

      <ChatInput
        message={state.message}
        onChange={(e) => {
          state.setMessage(e.target.value);
          adjustTextareaHeight(e.target, e.target.value);
        }}
        onSend={() => {
          const message = state.message;
          const type = 'message';
          const shouldFireEvent = true;
          actions.handleSendMessage(message, type, shouldFireEvent);
          setShouldScrollToBottom(true); // Ensure scrolling on new message
        }}
        disabled={properties.disableInput}
        loading={state.loadingResponse}
        newMessageDisabled={state.newMessageDisabled}
        computedStyles={computedStyles}
      />
    </div>
  );
};
