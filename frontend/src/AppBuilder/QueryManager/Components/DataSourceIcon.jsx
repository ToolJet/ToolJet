import React from 'react';
import { getSvgIcon } from '@/_helpers/appUtils';
import RunjsIcon from '@/AppBuilder/QueryManager/Icons/Icons/runjs.svg';
import RunTooljetDbIcon from '@/AppBuilder/QueryManager/Icons/Icons/tooljetdb.svg';
import RunpyIcon from '@/AppBuilder/QueryManager/Icons/Icons/runpy.svg';
import ResponseIcon from '@assets/images/icons/response.svg';
import IfIcon from '@assets/images/icons/if.svg';
import LoopIcon from '@assets/images/icons/loop.svg';
import AgentNodeIcon from '../../../../assets/images/icons/agent-node.svg';
import { Library } from 'lucide-react';

const DataSourceIcon = ({ source, height = 25, styles }) => {
  const iconFile = source?.plugin?.iconFile?.data ?? source?.plugin?.icon_file?.data;
  const Icon = () => getSvgIcon(source?.kind, height, height, iconFile, styles);

  switch (source?.kind) {
    case 'runjs':
      return <RunjsIcon style={{ height: height, width: height, marginTop: '-3px' }} />;
    case 'runpy':
      return <RunpyIcon style={{ height: height, width: height, marginTop: '-3px' }} />;
    case 'tooljetdb':
      return <RunTooljetDbIcon style={{ height: height, width: height, marginTop: '-3px' }} />;
    case 'If condition':
      return <IfIcon style={{ height: height, width: height, marginTop: '-3px' }} />;
    case 'loop':
      return <LoopIcon style={{ height: height, width: height, marginTop: '-3px' }} />;
    case 'response':
      return <ResponseIcon style={{ height: height, width: height, marginTop: '-3px' }} />;
    case 'agent':
      return <AgentNodeIcon style={{ height: height, width: height, marginTop: '-3px' }} />;
    // The same mark as "Add to query library", in the brand colour like the other built-in ToolJet sources.
    case 'library':
      return <Library size={height} color="var(--icon-brand)" aria-hidden="true" />;
    default:
      return <Icon />;
  }
};

export default DataSourceIcon;
