import React, { useEffect } from 'react';
// eslint-disable-next-line import/no-unresolved
import { DynamicIcon } from 'lucide-react/dynamic.mjs';

import useStore from '@/AppBuilder/_stores/store';

/**
 * "Agent is building" overlay for the editor canvas. While an AI build or modification is in
 * progress (ai.isLoading in the generate conversation), it disables the canvas and warns the user
 * not to refresh: a mid-build refresh interrupts a live direct-build and can leave a half-applied
 * app. Mounted inside #main-editor-canvas so it covers only the canvas — the chat panel stays
 * visible so the user can watch progress. Applies equally to new builds and edits of existing apps.
 */
const AgentBuildingOverlay = () => {
  const isBuilding = useStore((state) => Boolean(state.ai?.isLoading && state.ai?.currentConversation === 'generate'));

  useEffect(() => {
    if (!isBuilding) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isBuilding]);

  if (!isBuilding) return null;

  const block = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center"
      style={{ background: 'rgba(17, 24, 39, 0.35)', cursor: 'not-allowed', zIndex: 60 }}
      onClickCapture={block}
      onMouseDownCapture={block}
      data-cy="agent-building-overlay"
    >
      <div className="tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-bg-background-surface-layer-01 tw-px-4 tw-py-3 tw-shadow-lg">
        <DynamicIcon name="loader-circle" size={18} className="tw-animate-spin tw-text-icon-accent-primary" />
        <div className="tw-flex tw-flex-col">
          <span className="tw-font-body-large tw-text-text-default" style={{ fontWeight: 600 }}>
            Agent is building your app
          </span>
          <span className="tw-font-body-default tw-text-text-placeholder">
            Please don&apos;t refresh or make edits until it finishes.
          </span>
        </div>
      </div>
    </div>
  );
};

export default AgentBuildingOverlay;
