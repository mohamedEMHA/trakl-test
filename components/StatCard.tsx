import { View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { Card } from './Card';
import { Caption, ClashText } from './Typography';

type StatCardProps = {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: string;
  onPress?: () => void;
};

/** Small quick-stat card: accent icon, caption label, big Clash number. */
export function StatCard({ icon: Icon, iconColor, label, value, onPress }: StatCardProps) {
  return (
    <Card onPress={onPress} className="flex-1 gap-3">
      <Icon size={22} color={iconColor} strokeWidth={1.5} />
      <View className="gap-1">
        <Caption fit>{label}</Caption>
        <ClashText weight="bold" style={{ fontSize: 28 }}>
          {value}
        </ClashText>
      </View>
    </Card>
  );
}
