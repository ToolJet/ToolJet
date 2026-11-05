import React from 'react';
// Colocated with the sibling data-source icons (runjs/runpy/tooljetdb): imported
// through the bundler, not served from frontend/assets as a static path.
import openAILightUrl from '@/AppBuilder/QueryManager/Icons/Icons/openai-light.svg?url';
import { isDarkMode } from '@/_helpers/theme';
import { isOpenAIKind } from '@/_helpers/pluginKind';

const PluginIcon = ({ pluginKind, src, alt = '', height, width, style, className }) => {
  const iconSrc = isDarkMode() && isOpenAIKind(pluginKind) ? openAILightUrl : src;
  return <img height={height} width={width} src={iconSrc} alt={alt} style={style} className={className} />;
};

export default PluginIcon;
