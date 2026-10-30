// Mirrors the SVG rules in webpack.config.js: `*.svg` goes through @svgr/webpack, `*.svg?url` is an asset URL.
declare module '*.svg' {
  import type { FC, SVGProps } from 'react';
  const ReactComponent: FC<SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

declare module '*.svg?url' {
  const url: string;
  export default url;
}

// Plain imports are side-effect only; css-loader exposes a class map as default for `*.module.*` files.
declare module '*.scss' {
  const classes: Record<string, string>;
  export default classes;
}

declare module '*.css' {
  const classes: Record<string, string>;
  export default classes;
}
