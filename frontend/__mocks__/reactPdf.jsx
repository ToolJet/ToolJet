// Renderable stand-in for `react-pdf`.
//
// Why a stub and not a transform: react-pdf's dist is ESM-only and pulls the
// whole `pdfjs-dist` tree plus a web worker that jsdom cannot run — a real PDF
// never renders under jest. Per the PDF testing contract (D-01/D-03/D-04/D-05 in
// ee/test/app-builder/widgets/PDF/TESTING.md) real rendering, page controls, and
// download are QA/browser-owned; the engineering layer asserts the empty-url
// placeholder, container inline styles, and (per D-11/D-12) the load lifecycle
// wiring — none of which needs a real <Document>. A pass-through preserves
// everything those tests observe — the same reasoning as the react-markdown
// stub in this directory.
//
// Boundary fidelity (D-11/D-12, PDF bug-fix batch 2026-10-26), mirrored from
// react-pdf 10.1.0 / pdfjs 5.3.93 — behavior at the seam, not production logic:
//   1. pdfjs `getUrlProp` runs `new URL(val, window.location)` and THROWS
//      synchronously ("Invalid PDF url data: ...") on an unparsable string like
//      "https:" — `Document` calls `getDocument` in an effect with no try/catch,
//      so the throw escapes into React. The stub throws the same way.
//   2. A loadable `file` resolves with a page count (`onLoadSuccess({numPages})`).
//      Tests pick the count via a `#numPages=<n>` url fragment (default 3);
//      a url containing `load-error` rejects through `onLoadError` instead.
const React = require('react');

const Document = ({ file, children, className, onLoadSuccess, onLoadError }) => {
  // pdfjs getUrlProp fidelity: a string url must parse against the page origin.
  if (typeof file === 'string' && file !== '') {
    try {
      new URL(file, window.location.href);
    } catch {
      throw new Error('Invalid PDF url data: either string or URL-object is expected in the url property.');
    }
  }

  React.useEffect(() => {
    if (!file) return undefined;
    // The real lib resolves through a pdfjs loading-task PROMISE, so success
    // always lands after the mount-effect pass (PDF.jsx's own `[url]` effect
    // included). Firing synchronously here would invert that order and leave
    // `pageLoading` stuck true. setTimeout(0) preserves the real sequencing.
    const source = String(file);
    const timer = setTimeout(() => {
      if (source.includes('load-error')) {
        onLoadError?.(new Error('Failed to load PDF file.'));
        return;
      }
      const pages = /numPages=(\d+)/.exec(source);
      onLoadSuccess?.({ numPages: pages ? Number(pages[1]) : 3 });
    }, 0);
    return () => clearTimeout(timer);
    // Callbacks intentionally omitted from deps, mirroring react-pdf's own
    // "Omitted callbacks so they are not called every time they change".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  return React.createElement('div', { className, 'data-testid': 'react-pdf-document' }, children);
};

const Page = ({ pageNumber, inputRef }) =>
  React.createElement('div', { className: 'react-pdf__Page', 'data-page-number': pageNumber, ref: inputRef });

// PDF.jsx assigns `pdfjs.GlobalWorkerOptions.workerSrc` at module scope, so the
// stub must expose that shape without loading the real worker.
const pdfjs = { GlobalWorkerOptions: {}, version: 'stub' };

module.exports = { Document, Page, pdfjs };
module.exports.default = { Document, Page, pdfjs };
