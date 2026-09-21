import * as React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        alt?: string;
        autoplay?: boolean;
        "animation-name"?: string;
        "camera-controls"?: boolean;
        "disable-zoom"?: boolean;
        "auto-rotate"?: boolean;
        "rotation-per-second"?: string;
        "shadow-intensity"?: string;
        "exposure"?: string;
        style?: any;
        onError?: () => void;
      };
    }
  }
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        alt?: string;
        autoplay?: boolean;
        "animation-name"?: string;
        "camera-controls"?: boolean;
        "disable-zoom"?: boolean;
        "auto-rotate"?: boolean;
        "rotation-per-second"?: string;
        "shadow-intensity"?: string;
        "exposure"?: string;
        style?: any;
        onError?: () => void;
      };
    }
  }
}
