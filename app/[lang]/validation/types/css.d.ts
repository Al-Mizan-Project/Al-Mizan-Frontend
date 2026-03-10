declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.css' {
  const css: { [className: string]: string };
  export default css;
}