declare module '*.svg' {
  import React = require('react');
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGAElement>>;
  
  const src: string;
  export default src;
}

declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.ogg' {
  const src: string;
  export default src;
}

declare module '*.wav' {
  const src: string;
  export default src;
}