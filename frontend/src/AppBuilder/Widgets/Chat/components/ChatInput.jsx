import React, { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const ChatInput = ({
  message,
  onChange,
  onSend,
  disabled,
  loading,
  newMessageDisabled,
  computedStyles,
  placeholder = 'Ask me anything!',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = React.useRef(null);

  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '36px';
      textareaRef.current.classList.remove('scrollable');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && !disabled && !loading && !newMessageDisabled) {
        onSend();
        resetTextareaHeight();
      }
    }
  };

  return (
    <div className="chat-input">
      <div className="d-flex gap-2 align-items-center">
        <textarea
          ref={textareaRef}
          className="form-control chat-input-textarea"
          value={message}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            resize: 'none',
            height: '36px',
            maxHeight: `${36 * 3.22}px`,
            transition: 'height 0.1s ease-out, border-color 0.15s ease, box-shadow 0.15s ease',
            minHeight: '36px',
            backgroundColor: computedStyles.chatInput.backgroundColor,
            color: computedStyles.chatInput.textColor,
            borderColor: isFocused ? computedStyles.chatInput.accentColor : computedStyles.chatInput.borderColor,
            outline: 'none',
            boxShadow: isFocused ? `0 0 0 1px ${computedStyles.chatInput.accentColor}` : `0 0 0 1px transparent`,
          }}
          disabled={disabled || newMessageDisabled}
        />
        <Button
          variant="outline"
          onClick={() => {
            onSend();
            resetTextareaHeight();
          }}
          iconOnly={true}
          disabled={!message?.trim() || disabled || loading || newMessageDisabled}
          style={{
            width: '36px',
            height: '36px',
          }}
        >
          <SolidIcon
            name="send"
            width="16"
            fill={
              !message.trim() || disabled || loading ? 'var(--icons-disabled)' : computedStyles.chatInput.sendIconColor
            }
          />
        </Button>
      </div>
    </div>
  );
};
