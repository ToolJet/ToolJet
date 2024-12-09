import React from 'react';
import isEmpty from 'lodash/isEmpty';
import Accordion from '@/_ui/Accordion';

const AccordionForm = ({ formComponent, getLayout }) => {
  const sections = Object.keys(formComponent)
    .map((key) => ({
      title: formComponent[key].title,
      inputs: formComponent[key].inputs,
    }))
    .filter(({ inputs }) => inputs && !isEmpty(inputs));

  const items = sections.map(({ title, inputs }) => ({
    title: title,
    isOpen: true,
    children: getLayout(inputs),
  }));

  return <Accordion items={items} />;
};

export default AccordionForm;
