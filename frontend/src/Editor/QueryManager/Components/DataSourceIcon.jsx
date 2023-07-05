import React from 'react';
import { getSvgIcon } from '@/_helpers/appUtils';
import RunjsIcon from '@/Editor/Icons/runjs.svg';
import RunTooljetDbIcon from '@/Editor/Icons/tooljetdb.svg';
import RunpyIcon from '@/Editor/Icons/runpy.svg';

const DataSourceIcon = ({ source, height = 25 }) => {
  const iconFile = source?.plugin?.iconFile?.data ?? undefined;
  const Icon = () => getSvgIcon(source.kind, height, height, iconFile);

  switch (source.kind) {
    case 'runjs':
      return <RunjsIcon style={{ height: height, width: height, marginTop: '-3px' }} />;
    case 'runpy':
      return <RunpyIcon style={{ height: height, width: height, marginTop: '-3px' }} />;
    case 'tooljetdb':
      return <RunTooljetDbIcon style={{ height: height, width: height, marginTop: '-3px' }} />;
    default:
      return <Icon />;
  }
};

export default DataSourceIcon;
