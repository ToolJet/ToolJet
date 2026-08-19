declare module '*.svg' {
  import { ComponentType, SVGProps } from 'react';

  const Component: ComponentType<SVGProps<SVGSVGElement>>;
  export default Component;
}
