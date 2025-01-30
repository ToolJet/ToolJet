import React from 'react';
import { Button } from '@/components/ui/Button/Button';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const ChatInput = ({ message, onChange, onSend, disabled, loading, newMessageDisabled }) => (
  <div className="chat-input p-2" style={{ borderTop: '1px solid var(--slate7)' }}>
    <div className="d-flex gap-2 align-items-center">
      <textarea
        className="form-control chat-input-textarea"
        value={message}
        onChange={onChange}
        placeholder="Type a message..."
        style={{
          resize: 'none',
          height: '36px',
          maxHeight: `${36 * 5}px`,
          transition: 'height 0.1s ease-out',
          minHeight: '36px',
        }}
        disabled={disabled}
      />
      <Button
        variant="ghost"
        onClick={onSend}
        iconOnly
        disabled={!message.trim() || disabled || loading || newMessageDisabled}
      >
        <SolidIcon
          name="send"
          width="16"
          fill={
            !message.trim() || disabled || loading || newMessageDisabled
              ? 'var(--icons-weak-disabled)'
              : `var(--chat-send-icon, var(--icons-strong))`
          }
        />
      </Button>
    </div>
  </div>
);
