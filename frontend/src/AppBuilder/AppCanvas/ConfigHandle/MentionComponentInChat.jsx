import React from 'react';
import { Sparkle } from 'lucide-react';

import { ToolTip } from '@/_components/ToolTip';
import useStore from '@/AppBuilder/_stores/store';

export default function MentionComponentInChat({ componentName }) {
  const isLeftSidebarOpen = useStore((store) => store.isSidebarOpen);
  const toggleLeftSidebar = useStore((store) => store.toggleLeftSidebar);
  const selectedSidebarItem = useStore((store) => store.toggleLeftSidebar);
  const setSelectedSidebarItem = useStore((store) => store.setSelectedSidebarItem);
  const inputMessage = useStore((store) => store.ai.inputMessage);
  const setInputMessage = useStore((store) => store.ai.setInputMessage);
  const setSelectedComponents = useStore((state) => state.setSelectedComponents);

  const handleMentionInChat = () => {
    !isLeftSidebarOpen && toggleLeftSidebar(true);
    selectedSidebarItem !== 'tooljetai' && setSelectedSidebarItem('tooljetai');

    setSelectedComponents([]);

    setInputMessage(`${inputMessage} @${componentName}`);
  };

  return (
    <ToolTip message="Mention in chat" placement="bottom">
      <Sparkle size="12" className="tw-cursor-pointer" onClick={handleMentionInChat} />
    </ToolTip>
  );
}
