import React, { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const ChatInput = ({ message, onChange, onSend, disabled, loading, newMessageDisabled, computedStyles }) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && !disabled && !loading && !newMessageDisabled) {
        onSend();
        const textarea = document.querySelector('.chat-input-textarea');
        if (textarea) {
          textarea.style.height = '36px';
          textarea.classList.remove('scrollable');
        }
      }
    }
  };

  return (
    <div className="chat-input p-2" style={{ borderTop: '1px solid var(--slate7)' }}>
      <div className="d-flex gap-2 align-items-end">
        <textarea
          className="form-control chat-input-textarea"
          value={message}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            resize: 'none',
            height: '36px',
            maxHeight: `${36 * 3.22}px`,
            transition: 'height 0.1s ease-out, border-color 0.15s ease',
            minHeight: '36px',
            backgroundColor: computedStyles.chatInput.backgroundColor,
            color: computedStyles.chatInput.textColor,
            borderColor: isFocused ? computedStyles.chatInput.accentColor : computedStyles.chatInput.borderColor,
            borderWidth: isFocused ? '2px' : '1px',
            outline: 'none',
          }}
          disabled={disabled || newMessageDisabled}
        />
        <Button
          variant="ghost"
          onClick={() => {
            onSend();
            const textarea = document.querySelector('.chat-input-textarea');
            if (textarea) {
              textarea.style.height = '36px';
              textarea.classList.remove('scrollable');
            }
          }}
          iconOnly
          disabled={!message.trim() || disabled || loading}
        >
          <SolidIcon
            name="send"
            width="16"
            fill={
              !message.trim() || disabled || loading
                ? 'var(--icons-weak-disabled)'
                : computedStyles.chatInput.sendIconColor
            }
          />
        </Button>
      </div>
    </div>
  );
};
