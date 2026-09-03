import { createBackspaceText } from "Texts/common";

/**
 * @tjCmd   codemirror · type a value into a CodeMirror editor after clearing its current content
 * @tjUsage cy.get('.code-editor-basic-wrapper').clearAndTypeOnCodeMirror('return components.textinput1.value')
 */
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
      // NOTE: include `-` and `#` in the word-char class. The regex only keeps
      // matched substrings, so any char absent from every alternative is
      // silently dropped — previously `custom-btn` tokenized to ["custom","btn"]
      // (typed "custombtn"), and `#ff0000` dropped its `#` (typed "ff0000",
      // breaking hex-colour fx values). `#` is added to the class and `-` stays
      // last so it's a literal.
      // {{/}}/(( must come FIRST (alternation is first-match-wins), or a
      // {{...}} expression types as scrambled single braces, not one pair —
      // e.g. "{{components.toggleswitch1.valu}e}". The reduce below already
      // branches on "{{" / "}}" / "((" tokens, which single-brace-only
      // alternatives can never produce.
      const regex = /(\{\{|\}\}|\{|\}|\(\(|\(|\)|\[|\]|,|:|;|=>|\*|"[^"]*"|'[^']*'|[a-zA-Z0-9._#-]+|\s+)/g;
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

/**
 * @tjCmd   codemirror · erase all existing content from a CodeMirror editor without typing new content
 * @tjUsage cy.get('.code-editor-basic-wrapper').clearCodeMirror()
 */
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
