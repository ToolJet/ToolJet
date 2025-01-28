import React, { useState, useEffect, useRef } from 'react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

export const Chat = function Chat({
  id,
  width,
  height,
  component,
  darkMode,
  properties,
  styles,
  setExposedVariable,
  fireEvent,
}) {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState(properties.initialChat || []);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    setExposedVariable('history', chatHistory);
    setExposedVariable('messageCount', chatHistory.length);
    setExposedVariable('lastMessage', chatHistory[chatHistory.length - 1]?.message || '');
  }, [chatHistory]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage = {
      type: 'sender',
      message: message,
      timestamp: new Date().toISOString(),
      sender: properties.userName,
    };

    setChatHistory((prev) => [...prev, newMessage]);
    setMessage('');
    fireEvent('onMessageSent');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearHistory = () => {
    setChatHistory([]);
  };

  if (!styles.visibility) return null;

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
      {/* Header */}
      <div
        className="chat-header p-2 d-flex justify-content-between align-items-center"
        style={{ borderBottom: '1px solid var(--slate7)' }}
      >
        <span className="chat-title">{properties.title}</span>
        <div>
          <ButtonSolid variant="secondary" size="sm" onClick={clearHistory} className="mx-1">
            Clear History
          </ButtonSolid>
        </div>
      </div>

      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
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
        {styles.loadingResponse && (
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
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            style={{ resize: 'none', height: '38px' }}
            disabled={styles.disableInput || styles.loadingResponse}
          />
          <ButtonSolid
            variant="primary"
            onClick={handleSendMessage}
            disabled={!message.trim() || styles.disableInput || styles.loadingResponse}
          >
            Send
          </ButtonSolid>
        </div>
      </div>
    </div>
  );
};
