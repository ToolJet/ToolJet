import React from 'react'
import { DocsCard } from './';

export const DocsCardList = ({list}) => {
    console.log('list', list);
  return (
      <div>
         {list.map(item => <DocsCard key={item.docId} label={item.label} imgSrc={item.docId.split('/')[1]} link={item.href} />)}
      </div>
  )
}

