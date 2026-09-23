import { ActivityIndicator, View } from 'react-native';

import { useThemeColors } from '@/theme';

const COPY = { loadingLabel: 'Loading' } as const;

/** Shown only during boot, while the stored token is being verified. */
export const SplashScreen = () => {
  const theme = useThemeColors();

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator accessibilityLabel={COPY.loadingLabel} color={theme.primary} />
    </View>
  );
};
