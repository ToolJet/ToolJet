import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { v4 as uuidv4 } from 'uuid';
import '@/_styles/widgets/chat.scss';
import SolidIcon from '@/_ui/Icon/SolidIcons';
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
  const darkTheme = localStorage.getItem('darkMode') === 'true';
  const [chatTitle, setChatTitle] = useState(properties.chatTitle);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState(properties.initialChat || []);
  const [visibility, setVisibility] = useState(properties.visibility);
  const [newMessageDisabled, setNewMessageDisabled] = useState(false);
  const createMessage = (message, type) => ({
    message,
    messageId: uuidv4(),
    timestamp: new Date().toISOString(),
    name: properties.userName,
    avatar: properties.userAvatar,
    type,
  });

  const updateChatHistoryWhileSendingMessage = (newMessage) => {
    setChatHistory((currentHistory) => {
      const updatedHistory = [...currentHistory, newMessage];
      const exposedVariables = {
        history: updatedHistory,
        lastMessage: newMessage,
      };
      setExposedVariables(exposedVariables);
      fireEvent('onMessageSent', newMessage);
      return updatedHistory;
    });
  };

  const handleSendMessage = (message, type = 'message') => {
    if (!message?.trim()) return;
    const newMessage = createMessage(message, type);
    updateChatHistoryWhileSendingMessage(newMessage);
    setMessage(''); // Clear input only for UI messages
  };

  const clearHistory = () => {
    setChatHistory([]);
    setExposedVariables({ history: [], lastMessage: {}, lastResponse: {} });
  };

  useEffect(() => {
    setChatTitle(properties.chatTitle);
  }, [properties.chatTitle]);

  useEffect(() => {
    const exposedVariables = {
      sendMessage: async function (messageObject) {
        const { message, type = 'message' } = messageObject;
        const newMessage = createMessage(message, type);
        updateChatHistoryWhileSendingMessage(newMessage);
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
      setHistory: async function (history) {
        setChatHistory(history);
        setExposedVariables({ history });
      },
      appendHistory: async function (messageObject) {
        const { message, type } = messageObject;
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
      setNewMessageDisabled: async function (disabled) {
        setNewMessageDisabled(disabled);
        setExposedVariables({ isDisabled: !!disabled });
      },
    };
    setExposedVariables(exposedVariables);
  }, []);

  if (!visibility) return null;

  return (
    <div className={`chat-widget ${darkTheme ? 'dark-theme' : ''}`}>
      <div
        className="chat-header p-2 d-flex justify-content-between align-items-center"
        style={{ borderBottom: '1px solid var(--borders-disabled-on-white)' }}
      >
        <span className="chat-title tj-text-xx-large">{chatTitle}</span>
        <div className="button-group">
          <Button variant="ghost" iconOnly={true} className="mx-1">
            <SolidIcon name="pagedownload" width="16" fill="var(--icons-strong)" />
          </Button>
          <Button variant="ghost" onClick={clearHistory} iconOnly={true} className="mx-1">
            <SolidIcon name="clearhistory" width="16" fill="var(--icons-strong)" />
          </Button>
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
                chat.type === 'response' ? 'justify-content-end' : 'justify-content-start'
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
          <Button
            variant="primary"
            onClick={() => handleSendMessage(message, 'message')}
            disabled={!message.trim() || properties.disableInput || properties.loadingResponse || newMessageDisabled}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};
