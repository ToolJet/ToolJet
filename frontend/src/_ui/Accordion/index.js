import React from 'react';
import AccordionItem from './AccordionItem';

const Accordion = ({ items }) => {
  return (
    <div className="accordion" id="accordion-example">
      {items.map(({ title, children }, index) => {
        // eslint-disable-next-line react/no-children-prop
        return <AccordionItem key={index} index={index} title={title} children={children} />;
      })}
    </div>
  );
};

export default Accordion;
