import React from 'react';
import { useTranslation } from 'react-i18next';
import Student from '@/_ui/Icon/solidIcons/Student';
import ArrowRight from '@/_ui/Icon/solidIcons/ArrowRight';
import { getDocsLink } from '../Utils';

/**
 * What the inspector's footer says about the selected component: its type, and its documentation page when it has one.
 * A native widget names its type and links its page. A UI 2.0 widget names its display name ("Dialog", "Card grid"),
 * its internal type ("ShadDialog") being no help to a builder; the UI 2.0 widgets have no documentation pages yet, so
 * it names the type without a link. Without the footer a UI 2.0 widget showed no type at all, and a Dialog could not be
 * told apart from a container holding components.
 */
export const documentationFor = (componentMeta) => {
  const type = String(componentMeta?.component ?? '');
  if (type.startsWith('Shad')) return { name: componentMeta?.displayName || type, href: null, pack: true };
  const name =
    componentMeta?.displayName === 'Toggle Switch (Legacy)'
      ? 'Toggle (Legacy)'
      : componentMeta?.displayName === 'Toggle Switch'
      ? 'Toggle Switch'
      : type;
  return { name, href: getDocsLink(type), pack: false };
};

export const DocumentationFooter = ({ componentMeta }) => {
  const { t } = useTranslation();
  const { name, href, pack } = documentationFor(componentMeta);
  const label = (
    <span>
      <Student width={13} fill={'#3E63DD'} />
      <small className="widget-documentation-link-text">
        {href
          ? t('widget.common.documentation', 'Read documentation for {{componentMeta}}', { componentMeta: name })
          : t('widget.common.componentType', '{{componentMeta}} · ToolJet UI 2.0', { componentMeta: name })}
      </small>
    </span>
  );
  return (
    <span className="widget-documentation-link" data-cy="widget-documentation-footer">
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" data-cy="widget-documentation-link">
          {label}
          <span>
            <ArrowRight width={20} fill={'#3E63DD'} />
          </span>
        </a>
      ) : (
        <a role="note" data-cy="widget-component-type" title={pack ? 'No documentation page yet' : undefined}>
          {label}
        </a>
      )}
    </span>
  );
};
