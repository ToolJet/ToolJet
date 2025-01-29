import React, { useState, useEffect, useRef } from 'react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { v4 as uuidv4 } from 'uuid';

export const Chat = function Chat({
  id,
  width,
  height,
  component,
  darkMode,
  properties,
  styles,
  setExposedVariables,
  fireEvent,
}) {
  const [chatTitle, setChatTitle] = useState(properties.chatTitle);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState(properties.initialChat || []);

  useEffect(() => {
    setChatTitle(properties.chatTitle);
  }, [properties.chatTitle]);

  const createMessage = (message, type = 'message') => ({
    message,
    messageId: uuidv4(),
    timestamp: new Date().toISOString(),
    name: properties.userName,
    avatar: properties.userAvatar,
    type,
  });

  const updateChatHistory = (newMessage) => {
    setChatHistory((currentHistory) => {
      const updatedHistory = [...currentHistory, newMessage];
      setExposedVariables({ history: updatedHistory, lastMessage: newMessage });
      fireEvent('onMessageSent', newMessage);
      return updatedHistory;
    });
  };

  const handleSendMessage = (message, type = 'message') => {
    if (!message?.trim()) return;
    const newMessage = createMessage(message, type);
    updateChatHistory(newMessage);
    setMessage(''); // Clear input only for UI messages
  };

  const clearHistory = () => {
    setChatHistory([]);
    setExposedVariables({ history: [], lastMessage: {}, lastResponse: {} });
  };

  useEffect(() => {
    const exposedVariables = {
      sendMessage: async function (messageObject) {
        const { message, type = 'message' } = messageObject;
        const newMessage = createMessage(message, type);
        updateChatHistory(newMessage);
      },
      clearHistory: async function () {
        clearHistory();
      },
      deleteMessage: async function (messageId) {
        setChatHistory((currentHistory) => {
          const messageHistoryToPersist = currentHistory.filter((message) => message.messageId !== messageId);
          setExposedVariables({
            history: messageHistoryToPersist,
          });
          return messageHistoryToPersist;
        });
      },
    };
    setExposedVariables(exposedVariables);
  }, []);

  if (!properties.visibility) return null;

  return (
    <div
      className="chat-widget"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: darkMode ? 'var(--slate3)' : 'white',
        border: '1px solid var(--slate7)',
        borderRadius: '4px',
      }}
    >
      <div
        className="chat-header p-2 d-flex justify-content-between align-items-center"
        style={{ borderBottom: '1px solid var(--slate7)' }}
      >
        <span className="chat-title">{chatTitle}</span>
        <div>
          <ButtonSolid variant="secondary" size="sm" onClick={clearHistory} className="mx-1">
            Clear History
          </ButtonSolid>
        </div>
      </div>

      {/* Chat Messages */}
      <div
        className="chat-messages p-2"
        style={{
          flexGrow: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {Array.isArray(chatHistory) &&
          chatHistory?.length > 0 &&
          chatHistory?.map((chat, index) => (
            <div
              key={index}
              className={`message-bubble d-flex ${
                chat.type === 'sender' ? 'justify-content-end' : 'justify-content-start'
              }`}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  backgroundColor: chat.type === 'sender' ? 'var(--indigo9)' : 'var(--slate5)',
                  color: chat.type === 'sender' ? 'white' : 'inherit',
                }}
              >
                {chat.message}
              </div>
            </div>
          ))}
        {properties.loadingResponse && (
          <div className="message-bubble d-flex justify-content-start">
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '12px',
                backgroundColor: 'var(--slate5)',
              }}
            >
              ...
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="chat-input p-2" style={{ borderTop: '1px solid var(--slate7)' }}>
        <div className="d-flex gap-2">
          <textarea
            className="form-control"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            // onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            style={{ resize: 'none', height: '38px' }}
            disabled={properties.disableInput || properties.loadingResponse}
          />
          <ButtonSolid
            variant="primary"
            onClick={() => handleSendMessage(message, 'message')}
            disabled={!message.trim() || properties.disableInput || properties.loadingResponse}
          >
            Send
          </ButtonSolid>
        </div>
      </div>
    </div>
  );
};
