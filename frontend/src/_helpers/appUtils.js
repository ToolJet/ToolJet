import React from 'react';
import { toast } from 'react-hot-toast';
import { merge, mergeWith, camelCase } from 'lodash';
import Tooltip from 'react-bootstrap/Tooltip';
import { componentTypes } from '@/AppBuilder/WidgetManager';
import RunjsIcon from '@/AppBuilder/QueryManager/Icons/Icons/runjs.svg';
import RunTooljetDbIcon from '@/AppBuilder/QueryManager/Icons/Icons/tooljetdb.svg';
import RunPyIcon from '@/AppBuilder/QueryManager/Icons/Icons/runpy.svg';
// eslint-disable-next-line import/no-unresolved
import { allSvgs } from '@tooljet/plugins/client';
import SolidIcon from '../_ui/Icon/SolidIcons';
import { deepClone } from './utilities/utils.helpers';

export const getDateTimeFormat = (
  dateDisplayFormat,
  isTimeChecked,
  isTwentyFourHrFormatEnabled,
  isDateSelectionEnabled
) => {
  const timeFormat = isTwentyFourHrFormatEnabled ? 'HH:mm' : 'LT';
  if (isTimeChecked && !isDateSelectionEnabled) {
    return timeFormat;
  }
  return isTimeChecked ? `${dateDisplayFormat} ${timeFormat}` : dateDisplayFormat;
};

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  } catch (err) {
    console.log('Failed to copy!', err);
  }
}

export const getSvgIcon = (key, height = 50, width = 50, iconFile = undefined, styles = {}) => {
  if (iconFile) return <img src={`data:image/svg+xml;base64,${iconFile}`} style={{ height, width }} />;
  if (key === 'runjs') return <RunjsIcon style={{ height, width }} />;
  if (key === 'tooljetdb') return <RunTooljetDbIcon style={{ height, width }} />;
  if (key === 'runpy') return <RunPyIcon style={{ height, width }} />;
  if (key === 'workflows') return <SolidIcon name="workflows" fill="#3D63DC" />;

  if (typeof localStorage !== 'undefined') {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    //Add darkMode icons in allSvgs if needed ending with Dark
    if (darkMode) {
      const darkSrc = `${key}Dark`;
      if (allSvgs[darkSrc]) {
        key = darkSrc;
      }
    }
  }

  const Icon = allSvgs[key];

  if (!Icon) return <></>;

  return <Icon style={{ height, width, ...styles }} />;
};

// Color picker utils

export const getRGBAValueFromHex = (hex) => {
  let c = hex.substring(1).split('');
  switch (c.length) {
    case 3:
      c = [c[0] + c[0], c[1] + c[1], c[2] + c[2], 'ff'];
      break;
    case 4:
      c = [c[0] + c[0], c[1] + c[1], c[2] + c[2], c[3] + c[3]];
      break;
    case 6:
      c = [c[0] + c[1], c[2] + c[3], c[4] + c[5], 'ff'];
      break;
    case 8:
      c = [c[0] + c[1], c[2] + c[3], c[4] + c[5], c[6] + c[7]];
      break;
  }
  c = c.map((char) => parseInt(char, 16).toString());
  c[3] = (Math.round((parseInt(c[3], 10) / 255) * 100) / 100).toString();
  return c;
};

export const hexToRgba = (hex) => {
  const rgbaArray = getRGBAValueFromHex(hex);
  return `rgba(${rgbaArray[0]}, ${rgbaArray[1]}, ${rgbaArray[2]}, ${rgbaArray[3]})`;
};

export const hexToRgb = (hex) => {
  const rgbaArray = getRGBAValueFromHex(hex);
  return `rgba(${rgbaArray[0]}, ${rgbaArray[1]}, ${rgbaArray[2]})`;
};

export function isPDFSupported() {
  const browser = getBrowserUserAgent();

  if (!browser) {
    return true;
  }

  const isChrome = browser.name === 'Chrome' && browser.major >= 92;
  const isEdge = browser.name === 'Edge' && browser.major >= 92;
  const isSafari = browser.name === 'Safari' && (browser.major > 15 || (browser.major === 15 && browser.minor >= 4));
  const isFirefox = browser.name === 'Firefox' && browser.major >= 90;

  return isChrome || isEdge || isSafari || isFirefox;
}

function getBrowserUserAgent(userAgent) {
  var regexps = {
    Chrome: [/Chrome\/(\S+)/],
    Firefox: [/Firefox\/(\S+)/],
    MSIE: [/MSIE (\S+);/],
    Opera: [/Opera\/.*?Version\/(\S+)/ /* Opera 10 */, /Opera\/(\S+)/ /* Opera 9 and older */],
    Safari: [/Version\/(\S+).*?Safari\//],
  },
    re,
    m,
    browser,
    version;

  if (userAgent === undefined) userAgent = navigator.userAgent;

  for (browser in regexps)
    while ((re = regexps[browser].shift()))
      if ((m = userAgent.match(re))) {
        version = m[1].match(new RegExp('[^.]+(?:.[^.]+){0,1}'))[0];
        const { major, minor } = extractVersion(version);
        return {
          name: browser,
          major,
          minor,
        };
      }

  return null;
}

function extractVersion(versionStr) {
  // Split the string by "."
  const parts = versionStr.split('.');

  // Check for valid input
  if (parts.length === 0 || parts.some((part) => isNaN(part))) {
    return { major: null, minor: null };
  }

  // Extract major version
  const major = parseInt(parts[0], 10);

  // Handle minor version (default to 0)
  const minor = parts.length > 1 ? parseInt(parts[1], 10) : 0;

  return { major, minor };
}

export const removeFunctionObjects = (obj) => {
  for (const key in obj) {
    if (typeof obj[key] === 'function') {
      delete obj[key];
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      removeFunctionObjects(obj[key]);
    }
  }
  return obj;
};

export const isMobileDevice = () => {
  const userAgent = window.navigator.userAgent;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
};

// Color picker utils
export function renderTooltip({ props, text }) {
  if (text === '') return <></>;
  return (
    <Tooltip id="button-tooltip" {...props}>
      {text}
    </Tooltip>
  );
}

export const buildComponentMetaDefinition = (components = {}) => {
  for (const componentId in components) {
    const currentComponentData = components[componentId];

    const componentMeta = deepClone(
      componentTypes.find((comp) => currentComponentData.component.component === comp.component)
    );

    const mergedDefinition = {
      ...componentMeta.definition,
      properties: mergeWith(
        componentMeta.definition.properties,
        currentComponentData?.component?.definition?.properties,
        (objValue, srcValue) => {
          if (currentComponentData?.component?.component === 'Table' && Array.isArray(objValue)) {
            return srcValue;
          }
        }
      ),
      styles: merge(componentMeta.definition.styles, currentComponentData?.component.definition.styles),
      generalStyles: merge(
        componentMeta.definition.generalStyles,
        currentComponentData?.component.definition.generalStyles
      ),
      validation: merge(componentMeta.definition.validation, currentComponentData?.component.definition.validation),
      others: merge(componentMeta.definition.others, currentComponentData?.component.definition.others),
      general: merge(componentMeta.definition.general, currentComponentData?.component.definition.general),
    };

    const mergedComponent = {
      component: {
        ...componentMeta,
        ...currentComponentData.component,
      },
      layouts: {
        ...currentComponentData.layouts,
      },
      withDefaultChildren: componentMeta.withDefaultChildren ?? false,
    };

    mergedComponent.component.definition = mergedDefinition;

    components[componentId] = mergedComponent;
  }

  return components;
};

export const deepCamelCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map((item) => deepCamelCase(item));
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.keys(obj).reduce((acc, key) => {
      const camelCaseKey = camelCase(key);
      acc[camelCaseKey] = deepCamelCase(obj[key]);
      return acc;
    }, {});
  }
  return obj;
};

export const isTruthyOrZero = (value) => {
  return !!value || value === 0;
};
