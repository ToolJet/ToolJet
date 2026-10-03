---
to: <%= name %>/src/global.d.ts
---
declare module '*.module.css' {
  const classes: { readonly [className: string]: string };
  export default classes;
}

declare module '*.css';
