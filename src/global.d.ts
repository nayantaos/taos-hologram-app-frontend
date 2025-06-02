declare namespace JSX {
  interface IntrinsicElements {
    "model-viewer": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        src?: string;
        alt?: string;
        "ios-src"?: string;
        ar?: boolean | string;
        "ar-modes"?: string;
        "auto-rotate"?: boolean | string;
        "camera-controls"?: boolean | string;
        "shadow-intensity"?: number | string;
        style?: React.CSSProperties;
        slot?: string;
      },
      HTMLElement
    >;
  }
}
