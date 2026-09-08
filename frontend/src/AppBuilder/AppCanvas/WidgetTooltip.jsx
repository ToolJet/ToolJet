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

/**
 * The box a widget tooltip must stay inside.
 *
 * Radix avoids collisions against the viewport by default, and the editor's
 * left sidebar sits inside the viewport — so an unbounded tooltip on a widget
 * near the left edge of a horizontally scrolled canvas paints over it.
 *
 * `.canvas-container.page-container` is the element that actually scrolls
 * (AppCanvas.jsx:228) and is a flex sibling of the sidebar, so its rect is
 * always the visible canvas area beside it. Deliberately NOT `#real-canvas`:
 * that is the scrolled content, whose own left edge is already under the
 * sidebar once the canvas is scrolled right.
 *
 * Both classes are required. The viewer nests two `.canvas-container` elements
 * — Viewer.jsx:173 wraps the page-navigation sidebar, AppCanvas's sits inside
 * `.canvas-box`, which clears that sidebar. Matching on the bare class would
 * take the outer wrapper there and let a tooltip cover the page sidebar.
 *
 * Returns null outside the editor (viewer, module preview), where there is no
 * scroll container and no sidebar to avoid — Radix then falls back to the
 * viewport, which is correct there.
 */
export const getTooltipCollisionBoundary = () => document.querySelector('.canvas-container.page-container');

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
            collisionBoundary={getTooltipCollisionBoundary()}
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
