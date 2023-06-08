import React from 'react';
import { getSvgIcon } from '@/_helpers/appUtils';
import RunjsIcon from '@/Editor/Icons/runjs.svg';
import RunTooljetDbIcon from '@/Editor/Icons/tooljetdb.svg';
import RunpyIcon from '@/Editor/Icons/runpy.svg';

const DataSourceIcon = ({ source }) => {
  const iconFile = source?.plugin?.iconFile?.data ?? undefined;
  const Icon = () => getSvgIcon(source.kind, 20, 20, iconFile);

  switch (source.kind) {
    case 'runjs':
      return <RunjsIcon style={{ height: 25, width: 25, marginTop: '-3px' }} />;
    case 'runpy':
      return <RunpyIcon style={{ height: 25, width: 25, marginTop: '-3px' }} />;
    case 'tooljetdb':
      return <RunTooljetDbIcon />;
    default:
      return <Icon />;
  }
};

export default DataSourceIcon;
