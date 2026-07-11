declare module '*.css';

// heroui-native ships without TypeScript declarations; the Switch component is used as a
// controlled toggle across the app. This ambient declaration keeps the type checker happy.
declare module 'heroui-native' {
  import type { ComponentType, ReactNode } from 'react';
  type HeroSwitchProps = {
    isSelected?: boolean;
    onSelectedChange?: (value: boolean) => void;
  };
  export const Switch: ComponentType<HeroSwitchProps>;
  export const HeroUINativeProvider: ComponentType<{ children: ReactNode }>;
}

// react-native-maps ships without up-to-date types in this setup; the app lazy-loads it
// for native dev builds only. Provide a minimal declaration so the dynamic import and
// usage pass the type checker.
declare module 'react-native-maps' {
  import type { ComponentType } from 'react';
  const MapView: ComponentType<Record<string, unknown>>;
  export default MapView;
  export const Marker: ComponentType<Record<string, unknown>>;
  export const Polyline: ComponentType<Record<string, unknown>>;
  export const Polygon: ComponentType<Record<string, unknown>>;
  export const Circle: ComponentType<Record<string, unknown>>;
}
