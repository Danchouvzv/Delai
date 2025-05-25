declare module 'react-syntax-highlighter' {
  import React from 'react';
  
  export interface SyntaxHighlighterProps {
    language?: string;
    style?: any;
    className?: string;
    children?: React.ReactNode;
    [key: string]: any;
  }
  
  export const Prism: React.ComponentType<SyntaxHighlighterProps>;
  const SyntaxHighlighter: React.ComponentType<SyntaxHighlighterProps>;
  export default SyntaxHighlighter;
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
  const tomorrow: any;
  export { tomorrow };
} 