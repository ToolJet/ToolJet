import { createBackspaceText } from "Texts/common";

Cypress.Commands.add(
  "clearAndTypeOnCodeMirror",
  { prevSubject: "optional" },
  (subject, value) => {
    cy.wrap(subject)
      .realClick()
      .find(".cm-line")
      .invoke("text")
      .then((text) => {
        cy.wrap(subject)
          .last()
          .click()
          .type(createBackspaceText(text), { delay: 0 });
      });

    const splitIntoFlatArray = (value) => {
      // NOTE: include `-` in the word-char class. The regex only keeps matched
      // substrings, so any char absent from every alternative is silently
      // dropped — previously `custom-btn` tokenized to ["custom","btn"] and was
      // typed as "custombtn". `-` is placed last in the class so it's a literal.
      const regex = /(\{|\}|\(|\)|\[|\]|,|:|;|=>|\*|"[^"]*"|'[^']*'|[a-zA-Z0-9._-]+|\s+)/g;
      let prefix = "";
      return (
        value.match(regex)?.reduce((acc, part) => {
          if (part === "{{" || part === "((") {
            prefix = "{backspace}{backspace}";
            acc.push(part);
          } else if (part === "{" || part === "(" || part === "[") {
            acc.push(prefix + part);
            prefix = "{backspace}";
          } else if (part === "}}") {
            acc.push(prefix + part);
          } else if (part === " ") {
            acc.push(prefix + " ");
          } else if (part === ":") {
            acc.push(prefix + ":");
          } else {
            acc.push(prefix + part);
            prefix = "";
          }
          return acc;
        }, []) || []
      );
    };

    if (Array.isArray(value)) {
      cy.wrap(subject).last().realType(value.join(""), {
        parseSpecialCharSequences: false,
        delay: 0,
        force: true,
      });
    } else {
      splitIntoFlatArray(value).forEach((i) => {
        cy.wrap(subject)
          .last()
          .click()
          .realType(
            `{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}${i}`,
            { parseSpecialCharSequences: false, delay: 0, force: true }
          );
      });
    }
  }
);

Cypress.Commands.add(
  "clearCodeMirror",
  {
    prevSubject: "element",
  },
  (subject, value) => {
    cy.wrap(subject)
      .realClick()
      .find(".cm-line")
      .invoke("text")
      .then((text) => {
        cy.wrap(subject).realType(createBackspaceText(text)),
        {
          delay: 0,
        };
      });
  }
);
