import React, { useState } from 'react';
import Dropdown from './Dropdown';

function EndPointBlock({ Url, editorSession, editorSessionActions }) {
  const [open, setOpen] = useState(false);

  const containerStyle = {
    width: '90px',
    height: 'auto',
    marginLeft: '10px',
    borderRadius: '4px',
    border: '1px solid rgba(101, 109, 119, 0.16)',
  };

  const containerStyleOpen = {
    width: '90px',
    height: 'auto',
    marginLeft: '10px',
    borderRadius: '4px',
    border: '1px solid #3E63DD',
  };

  const dropDownBlockStyle = open ? containerStyleOpen : containerStyle;

  return (
    <div className="endpoint-block mt-3">
      <strong>Endpoint</strong>
      <div className="d-flex align-items-center justify-content-between mt-2">
        <div className="endpoint-url p-2 bg-gray rounded">{Url}</div>
        <Dropdown
          open={open}
          setOpen={setOpen}
          containerStyle={dropDownBlockStyle}
          title=""
          content="Copy"
          contentData={[{ name: 'Copy URL' }, { name: 'Copy as cURL' }]}
          mt="mt-0"
          editorSessionActions={editorSessionActions}
          editorSession={editorSession}
        />
      </div>
    </div>
  );
}

export default EndPointBlock;
