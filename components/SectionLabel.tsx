import { type ReactNode } from 'react';
import { View } from 'react-native';

import { PressableScale } from './PressableScale';
import { Caption } from './Typography';

type SectionLabelProps = {
  children: string;
  right?: ReactNode;
  onRightPress?: () => void;
};

/** ALL-CAPS section label with optional right action (e.g. "See all"). */
export function SectionLabel({ children, right, onRightPress }: SectionLabelProps) {
  return (
    <View className="mb-3 flex-row items-center justify-between">
      <Caption>{children}</Caption>
      {right ? (
        onRightPress ? (
          <PressableScale feedback="chip" hitSlop={8} onPress={onRightPress}>
            {right}
          </PressableScale>
        ) : (
          right
        )
      ) : null}
    </View>
  );
}
