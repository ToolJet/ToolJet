import React from 'react' 
import { DocsCard } from './'; 
import styles from './DocsCard.css' 

export const DocsCardList = ({ list }) => { 
    return ( 
        <div className='card-container-setup'> 
            {list.map(item => {
                const docId = item?.docId || "";
                const parts = docId.split("/");
                const imgSrc = item.customProps?.icon || parts[parts.length - 1];
                
                return (
                    <DocsCard
                        key={docId || item.label}
                        label={item.label}
                        imgSrc={imgSrc}
                        link={item.href}
                    />
                );
            })}
        </div> 
    ) 
}