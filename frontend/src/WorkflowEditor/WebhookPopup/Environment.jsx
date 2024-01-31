import React, { useState } from 'react';
import Dropdown from './Dropdown';

function Environment({ editorSession, editorSessionActions }) {
  const [open, setOpen] = useState(false);

  const containerStyle = {
    width: '100%',
    height: 'auto',
    borderRadius: '4px',
    border: '1px solid rgba(101, 109, 119, 0.16)',
    marginTop: '10px',
  };

  const containerStyleOpen = {
    width: '100%',
    height: 'auto',
    borderRadius: '4px',
    border: '1px solid #3E63DD',
    marginTop: '10px',
  };

  const dropDownBlockStyle = open ? containerStyleOpen : containerStyle;
  const environments = editorSession.environments;

  const environment = editorSession?.currentWebhookEnvironment;
  const defaultEnv = environment[0].toUpperCase() + environment.substring(1);

  return (
    <Dropdown
      open={open}
      setOpen={setOpen}
      containerStyle={dropDownBlockStyle}
      title="Environment"
      content={defaultEnv}
      contentData={environments}
      mt="mt-0"
      editorSessionActions={editorSessionActions}
      editorSession={editorSession}
    />
  );
}

export default Environment;
