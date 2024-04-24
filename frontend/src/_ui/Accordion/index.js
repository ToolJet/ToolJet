import React from 'react';
import AccordionItem from './AccordionItem';

const Accordion = ({ items, className = '' }) => {
  return (
    <div className={`accordion ${className}`}>
      {items.map(({ title, isOpen, children }, index) => {
        // eslint-disable-next-line react/no-children-prop
        return <AccordionItem open={isOpen} key={index} index={index} title={title} children={children} />;
      })}
    </div>
  );
};

export default Accordion;
