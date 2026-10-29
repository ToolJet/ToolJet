import React from 'react';
import { toast } from 'react-hot-toast';
import useStore from '@/AppBuilder/_stores/store';
import { ToolTip } from '@/_components';
import { Button as ButtonComponent } from '@/components/ui/Button/Button';
import { getQueryHeaderControlPresentation } from '@/AppBuilder/panelLayout';
import { CODE_EDITOR_TAB_KINDS, openCodeEditorTabWindow } from './codeEditorTabWindows';

// Opens the selected RunJS/RunPython query's code editor in a new browser tab.
const OpenCodeEditorTabButton = () => {
  const control = getQueryHeaderControlPresentation('run');
  const queryId = useStore((state) => state.queryPanel.selectedQuery?.id);
  const kind = useStore((state) => state.queryPanel.selectedQuery?.kind);
  const openCodeEditorTab = useStore((state) => state.queryPanel.openCodeEditorTab);

  if (!queryId || !CODE_EDITOR_TAB_KINDS.includes(kind)) return null;

  const onClick = () => {
    if (openCodeEditorTabWindow(queryId)) openCodeEditorTab(queryId);
    else toast.error('Your browser blocked the new tab. Allow pop-ups for this site and try again.');
  };

  return (
    <ToolTip message="Open code editor in a new tab" placement="bottom" trigger={['hover']} show={true}>
      <span>
        <ButtonComponent
          isLucid
          size={control.size}
          variant="ghost"
          onClick={onClick}
          leadingIcon="external-link"
          iconOnly
          className={control.className}
          aria-label="Open code editor in a new tab"
          data-cy="query-open-code-editor-tab"
        />
      </span>
    </ToolTip>
  );
};

export default OpenCodeEditorTabButton;
