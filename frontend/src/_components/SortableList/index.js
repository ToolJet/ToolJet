import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import EmptyIllustration from '@assets/images/no-results.svg';
import { SortableList } from './SortableList';
import { DragHandle } from './components';
import { shallow } from 'zustand/shallow';
import _ from 'lodash';

const SortableComponent = ({ data, Element, ...restProps }) => {
  const allpages = useStore((state) => _.get(state, 'modules.canvas.pages', []), shallow);
  const reorderPages = useStore((state) => state.reorderPages);

  const showSearch = useStore((state) => state.showSearch);
  const pageSearchResults = useStore((state) => state.pageSearchResults);

  const pagesTorender =
    showSearch && pageSearchResults !== null
      ? allpages.filter((page) => pageSearchResults.includes(page.id))
      : allpages;

  if (pagesTorender.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100%' }}>
        <div>
          <EmptyIllustration />
          <p data-cy={`label-no-pages-found`} className="mt-3  color-slate12">
            No pages found
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: '0' }}>
      <SortableList
        items={pagesTorender}
        onChange={reorderPages}
        renderItem={(page) => (
          <SortableList.Item id={page.id} classNames={restProps.classNames}>
            <Element page={page} {...restProps} />
          </SortableList.Item>
        )}
      />
    </div>
  );
};

SortableComponent.DragHandle = DragHandle;

export default SortableComponent;
