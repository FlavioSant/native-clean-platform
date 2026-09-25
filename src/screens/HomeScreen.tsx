import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, Text, View } from 'react-native';

import type { AppStackParamList } from '@/navigation';

const COPY = {
  title: 'Signed-in area',
  accountLabel: 'Account',
} as const;

type HomeScreenProps = NativeStackScreenProps<AppStackParamList, 'Home'>;

/** Only leads to `AccountScreen`, which is where the sign-out actions live. */
export const HomeScreen = ({ navigation }: HomeScreenProps) => (
  <View className="flex-1 items-center justify-center gap-4 bg-background px-6">
    <Text className="text-2xl font-semibold text-content">{COPY.title}</Text>
    <Pressable
      accessibilityRole="button"
      className="w-full items-center rounded-lg bg-primary px-4 py-3 active:bg-primary-pressed"
      onPress={() => navigation.navigate('Account', { screen: 'AccountOverview' })}
    >
      <Text className="text-base font-semibold text-content-inverse">{COPY.accountLabel}</Text>
    </Pressable>
  </View>
);
