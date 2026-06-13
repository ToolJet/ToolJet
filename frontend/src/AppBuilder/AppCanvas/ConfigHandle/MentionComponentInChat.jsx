import React from 'react';
import EEMentionComponentInChat from '@ee/modules/Appbuilder/components/MentionComponentInChat';

function MentionComponentInChat() {
  return <></>;
}

export default process.env.TOOLJET_EDITION === 'ce' ? MentionComponentInChat : EEMentionComponentInChat;
