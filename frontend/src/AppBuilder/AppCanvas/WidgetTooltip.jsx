import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import DOMPurify from 'dompurify';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Rocket/Tooltip/Tooltip';
import './WidgetTooltip.scss';

export const TOOLTIP_FORMATS = ['plainText', 'markdown', 'html'];
const DEFAULT_FORMAT = 'plainText';
const MARKDOWN_REMARK_PLUGINS = [remarkGfm];

// styles for markdown and plain text
const THEMED_CLASSES = [
  'tw-rounded-md',
  'tw-p-[6px]',
  'tw-text-text-tooltip',
  'tw-leading-normal',
  'tw-shadow-none',
].join(' ');

// styles for html
const UNSTYLED_CLASSES = ['tw-bg-transparent', 'tw-p-0', 'tw-rounded-none', 'tw-shadow-none'].join(' ');

const TooltipBody = ({ content, format }) => {
  if (format === 'html') {
    return <div className="widget-tooltip-html" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />;
  }
  if (format === 'markdown') {
    return (
      <div className="widget-tooltip-markdown [&>*:first-child]:tw-mt-0 [&>*:last-child]:tw-mb-0">
        <Markdown remarkPlugins={MARKDOWN_REMARK_PLUGINS}>{content}</Markdown>
      </div>
    );
  }
  return <span className="tw-whitespace-pre-wrap">{content}</span>;
};

TooltipBody.propTypes = {
  content: PropTypes.string.isRequired,
  format: PropTypes.oneOf(TOOLTIP_FORMATS).isRequired,
};

const WidgetTooltip = ({
  content,
  format = DEFAULT_FORMAT,
  show = true,
  children,
  delayDuration = 500,
  darkMode = false,
}) => {
  const trimmed = typeof content === 'string' ? content.trim() : '';
  const shouldShowTooltip = show && !!trimmed;

  const resolvedFormat = TOOLTIP_FORMATS.includes(format) ? format : DEFAULT_FORMAT;
  const isHtml = resolvedFormat === 'html';

  const themeClass = darkMode ? 'dark-theme theme-dark' : '';

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        {shouldShowTooltip && (
          <TooltipContent
            side="top"
            align="start"
            sideOffset={2}
            showArrow={false}
            data-cy="widget-tooltip"
            className={cx(isHtml ? UNSTYLED_CLASSES : THEMED_CLASSES, themeClass)}
          >
            <TooltipBody content={trimmed} format={resolvedFormat} />
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

WidgetTooltip.propTypes = {
  content: PropTypes.string,
  format: PropTypes.oneOf(TOOLTIP_FORMATS),
  show: PropTypes.bool,
  delayDuration: PropTypes.number,
  darkMode: PropTypes.bool,
  children: PropTypes.node,
};

export default WidgetTooltip;
