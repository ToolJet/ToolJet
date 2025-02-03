import React from 'react';
import { Button } from '@/components/ui/Button/Button';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const ChatHeader = ({ title, onDownload, onClear }) => (
  <div
    className="chat-header p-2 d-flex justify-content-between align-items-center"
    style={{ borderBottom: '1px solid var(--borders-weak-disabled)' }}
  >
    <span className="chat-title tj-text-xx-large">{title}</span>
    <div className="button-group">
      <Button variant="ghost" onClick={onDownload} iconOnly title="Download chat history">
        <SolidIcon name="pagedownload" width="16" fill="var(--icons-strong)" />
      </Button>
      <Button variant="ghost" onClick={onClear} iconOnly>
        <SolidIcon name="clearhistory" width="16" fill="var(--icons-strong)" />
      </Button>
    </div>
  </div>
);
