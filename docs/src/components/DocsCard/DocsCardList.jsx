import React from 'react'
import { DocsCard } from './';
import styles from './DocsCard.css'

export const DocsCardList = ({ list }) => {
    return (
        <div className='card-container-setup'>
            {list.map(item => <DocsCard key={item.docId} label={item.label} imgSrc={item.docId.split('/')[1]} link={item.href} />)}
        </div>
    )
}

