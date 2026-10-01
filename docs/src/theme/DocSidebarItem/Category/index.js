import React from 'react';
import Category from '@theme-original/DocSidebarItem/Category';

// Non-collapsible category headings need a real destination when rendered as links.
function firstChildHref(items = []) {
  for (const item of items) {
    if (item.href) return item.href;
    const nestedHref = firstChildHref(item.items);
    if (nestedHref) return nestedHref;
  }
  return undefined;
}

export default function CategoryWrapper(props) {
  if (!props.item.collapsible && !props.item.href) {
    props = {
      ...props,
      item: { ...props.item, href: firstChildHref(props.item.items) },
    };
  }
  const isSelfHosted = props.item.customProps?.selfHosted === true;

  if (isSelfHosted) {
    const modifiedItem = {
      ...props.item,
      label: (
        <>
          {props.item.label}
          <img
            src="/img/badge-icons/premium.svg"
            alt="Self-hosted"
            className="self-hosted-icon"
          />
        </>
      ),
    };
    return <Category {...props} item={modifiedItem} />;
  }

  return <Category {...props} />;
}
