// Renderable stand-in for `react-pdf`.
//
// Why a stub and not a transform: react-pdf's dist is ESM-only and pulls the
// whole `pdfjs-dist` tree plus a web worker that jsdom cannot run — a real PDF
// never renders under jest. Per the PDF testing contract (D-01/D-03/D-04/D-05 in
// ee/test/app-builder/widgets/PDF/TESTING.md) real rendering, page controls, and
// download are QA/browser-owned; the engineering layer only asserts the empty-url
// placeholder and the container inline styles, neither of which needs a real
// <Document>. A pass-through preserves everything those tests observe — the same
// reasoning as the react-markdown stub in this directory.
const React = require('react');

const Document = ({ children, className }) =>
  React.createElement('div', { className, 'data-testid': 'react-pdf-document' }, children);

const Page = ({ pageNumber, inputRef }) =>
  React.createElement('div', { className: 'react-pdf__Page', 'data-page-number': pageNumber, ref: inputRef });

// PDF.jsx assigns `pdfjs.GlobalWorkerOptions.workerSrc` at module scope, so the
// stub must expose that shape without loading the real worker.
const pdfjs = { GlobalWorkerOptions: {}, version: 'stub' };

module.exports = { Document, Page, pdfjs };
module.exports.default = { Document, Page, pdfjs };
