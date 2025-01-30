import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { v4 as uuidv4 } from 'uuid';
import '@/_styles/widgets/chat.scss';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { toast } from 'react-hot-toast';
import { MarkdownMessage } from './MarkdownMessage';
import cx from 'classnames';
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const today = new Date();

  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Shows: "3:45 PM"
  }

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Message copied to clipboard');
  } catch (err) {
    toast.error('Failed to copy message');
  }
};

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
  const [error, setError] = useState(null);
  const createMessage = (message, type) => ({
    message,
    messageId: uuidv4(),
    timestamp: new Date().toISOString(),
    name: type === 'message' ? properties.userName : properties.respondentName,
    avatar: type === 'message' ? properties.userAvatar : properties.respondentAvatar,
    type,
  });

  const updateChatHistoryWhileSendingMessage = (newMessage) => {
    setChatHistory((currentHistory) => {
      const updatedHistory = [...currentHistory, newMessage];
      const exposedVariables = {
        history: updatedHistory,
        lastMessage: newMessage,
      };
      if (error) setError(null);
      setExposedVariables(exposedVariables);
      fireEvent('onMessageSent', newMessage);
      return updatedHistory;
    });
  };

  const handleSendMessage = (message, type = 'message') => {
    if (!message?.trim()) return;
    const newMessage = createMessage(message, type);
    updateChatHistoryWhileSendingMessage(newMessage);
    setMessage('');
  };

  const clearHistory = () => {
    setChatHistory([]);
    if (error) setError(null);
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
        if (error) setError(null);
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
      setError: async function (errorMessage = 'Some error occurred. Please retry.') {
        setError(errorMessage || 'Some error occurred. Please retry.');
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
          gap: '16px',
        }}
      >
        {Array.isArray(chatHistory) &&
          chatHistory?.length > 0 &&
          chatHistory?.map((chat, index) => (
            <div
              key={index}
              className={cx('message-bubble custom-gap-16', {
                'message-response': chat.type === 'response',
                'message-sender': chat.type === 'message',
                'message-error': chat.type === 'error',
              })}
            >
              <div className="d-flex flex-row align-items-start custom-gap-8 position-relative message-container w-100">
                <div
                  className="d-flex flex-row align-items-start justify-content-center"
                  style={{
                    minWidth: '38px',
                  }}
                >
                  <div
                    className="d-flex flex-row align-items-center justify-content-center"
                    style={{
                      borderRadius: '50%',
                      width: '38px',
                      height: '38px',
                      border: '1px solid var(--borders-disabled-on-white)',
                    }}
                  >
                    {chat.avatar ? (
                      <img
                        src={chat.type === 'message' ? properties.userAvatar : properties.respondentAvatar}
                        alt="avatar"
                        className="avatar"
                        style={{ width: '16px', height: '16px' }}
                      />
                    ) : (
                      <SolidIcon
                        name={chat.type === 'message' ? 'defaultsenderchatavatar' : 'defaultresponseavatar'}
                        width="16"
                        viewBox="0 0 20 20"
                        fill={chat.type === 'message' ? 'var(--primary-brand)' : 'var(--icons-strong)'}
                      />
                    )}
                  </div>
                </div>
                <div className="d-flex flex-column custom-gap-12 flex-grow-1">
                  <div className="d-flex flex-row custom-gap-16 align-items-center justify-content-between">
                    <div className="d-flex flex-row custom-gap-16">
                      <span className="tj-text tj-header-h8 message-title">{chat.name}</span>
                      <span className="tj-text tj-text-xsm message-timestamp">{formatTimestamp(chat.timestamp)}</span>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => copyToClipboard(chat.message)}
                      iconOnly={true}
                      className="copy-button ms-auto"
                    >
                      <SolidIcon name="copy" width="14" fill="var(--icons-strong)" />
                    </Button>
                  </div>
                  <div className={`tj-text tj-text-md message-content`}>
                    <MarkdownMessage content={chat.message} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        {error && (
          <div className="message-bubble custom-gap-16 message-error">
            <div className="d-flex flex-row align-items-start custom-gap-8 position-relative message-container w-100">
              <div
                className="d-flex flex-row align-items-start justify-content-center"
                style={{
                  minWidth: '38px',
                }}
              >
                <div
                  className="d-flex flex-row align-items-center justify-content-center"
                  style={{
                    borderRadius: '50%',
                    width: '38px',
                    height: '38px',
                    border: '1px solid var(--borders-disabled-on-white)',
                  }}
                >
                  <SolidIcon
                    name={'defaultresponseavatar'}
                    width="16"
                    viewBox="0 0 20 20"
                    fill={'var(--icons-strong)'}
                  />
                </div>
              </div>
              <div className="d-flex flex-column custom-gap-12 flex-grow-1">
                <div className="d-flex flex-row custom-gap-16 align-items-center justify-content-between">
                  <div className="d-flex flex-row custom-gap-16">
                    <span className="tj-text tj-header-h8 message-title">{properties.respondentName}</span>
                    <span className="tj-text tj-text-xsm message-timestamp">
                      {formatTimestamp(new Date().toISOString())}
                    </span>
                  </div>
                </div>
                <div className={`tj-text tj-text-md message-content`}>{error}</div>
              </div>
            </div>
          </div>
        )}
        {properties.loadingResponse && (
          <div className="message-bubble d-flex justify-content-end">
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
        <div className="d-flex gap-2 align-items-center">
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
            variant="ghost"
            onClick={() => handleSendMessage(message, 'message')}
            iconOnly={true}
            disabled={!message.trim() || properties.disableInput || properties.loadingResponse || newMessageDisabled}
          >
            <SolidIcon
              name="send"
              width="16"
              fill={
                !message.trim() || properties.disableInput || properties.loadingResponse || newMessageDisabled
                  ? 'var(--icons-weak-disabled)'
                  : 'var(--icons-strong)'
              }
            />
          </Button>
        </div>
      </div>
    </div>
  );
};
