declare module 'vanta/dist/vanta.globe.min.js' {
  import * as THREE from 'three';

  interface VantaGlobeOptions {
    el: HTMLElement;
    THREE: typeof THREE;
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    scale?: number;
    scaleMobile?: number;
    color1?: number | string;
    color2?: number | string;
    backgroundColor?: number | string;
    midColor?: number | string;
  }

  interface VantaEffect {
    destroy?: () => void;
    resize?: () => void;
    setOptions?: (options: Partial<VantaGlobeOptions>) => void;
  }

  function vantaGlobe(options: VantaGlobeOptions): VantaEffect;

  export default vantaGlobe;
}

declare module 'vanta/dist/vanta.net.min.js' {
  import * as THREE from 'three';

  interface VantaNetOptions {
    el: HTMLElement;
    THREE: typeof THREE;
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    scale?: number;
    scaleMobile?: number;
    color?: number | string;
    backgroundColor?: number | string;
    speed?: number;
    points?: number;
    maxDistance?: number;
    spacing?: number;
  }

  interface VantaEffect {
    destroy?: () => void;
    resize?: () => void;
    setOptions?: (options: Partial<VantaNetOptions>) => void;
  }

  function vantaNet(options: VantaNetOptions): VantaEffect;

  export default vantaNet;
}
