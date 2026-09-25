import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Pressable, Text, View } from 'react-native';

import { useErrorToast } from '@/errors';
import { THEME_PREFERENCES, type ThemePreference, useThemePreference } from '@/theme';
import { classnames } from '@/utils';

import { useAuth } from '../hooks/useAuth';
import type { AccountStackParamList } from '../navigation/types';

const COPY = {
  emailLabel: 'Signed in as',
  changePasswordLabel: 'Change password',
  sessionsLabel: 'Active sessions',
  deleteAccountLabel: 'Delete account',
  signOutLabel: 'Sign out',
  signOutEverywhereLabel: 'Sign out everywhere',
  confirmTitle: 'Sign out everywhere?',
  confirmMessage: 'Every device signed in to this account will be signed out.',
  confirmLabel: 'Sign out',
  cancelLabel: 'Cancel',
  appearanceLabel: 'Appearance',
  systemLabel: 'System',
  lightLabel: 'Light',
  darkLabel: 'Dark',
} as const;

const APPEARANCE_OPTIONS: readonly { value: ThemePreference; label: string }[] = [
  { value: THEME_PREFERENCES.SYSTEM, label: COPY.systemLabel },
  { value: THEME_PREFERENCES.LIGHT, label: COPY.lightLabel },
  { value: THEME_PREFERENCES.DARK, label: COPY.darkLabel },
];

type AccountScreenProps = NativeStackScreenProps<AccountStackParamList, 'AccountOverview'>;

/**
 * Renders the address and the actions, and nothing dated. `/auth/me` also
 * returns `createdAt` and `emailVerifiedAt`, and rendering either would need a
 * formatter, a locale decision and a `Date` whose only consumer is its own
 * formatting.
 */
export const AccountScreen = ({ navigation }: AccountScreenProps) => {
  const { user, signOut, signOutEverywhere, isSigningOut } = useAuth();
  const { showError } = useErrorToast();
  const { preference, setPreference } = useThemePreference();

  const handleSignOut = () => {
    // Cannot reject by construction: the mutation swallows every failure
    // inside it, network and keychain alike.
    signOut();
  };

  const handleConfirmSignOutEverywhere = async () => {
    // This one rejects on failure and keeps the session, so the rejection
    // has to reach the toast instead of going unhandled.
    try {
      await signOutEverywhere();
    } catch (error) {
      showError(error);
    }
  };

  const confirmSignOutEverywhere = () => {
    Alert.alert(COPY.confirmTitle, COPY.confirmMessage, [
      { text: COPY.cancelLabel, style: 'cancel' },
      {
        text: COPY.confirmLabel,
        style: 'destructive',
        onPress: handleConfirmSignOutEverywhere,
      },
    ]);
  };

  return (
    <View className="flex-1 gap-4 bg-background px-6 py-8">
      <View>
        <Text className="text-sm text-content-muted">{COPY.emailLabel}</Text>
        <Text className="text-lg font-semibold text-content">{user?.email ?? ''}</Text>
      </View>

      <View>
        <Text className="mb-2 text-sm text-content-muted">{COPY.appearanceLabel}</Text>
        <View className="flex-row gap-2">
          {APPEARANCE_OPTIONS.map((option) => {
            const isSelected = preference === option.value;

            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                className={classnames(
                  'flex-1 items-center rounded-lg border px-3 py-2',
                  isSelected ? 'border-primary bg-primary' : 'border-border',
                )}
                onPress={() => setPreference(option.value)}
              >
                <Text
                  className={classnames(
                    'text-sm font-semibold',
                    isSelected ? 'text-content-inverse' : 'text-content',
                  )}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isSigningOut }}
        className="w-full items-center rounded-lg bg-primary px-4 py-3 active:bg-primary-pressed"
        disabled={isSigningOut}
        onPress={() => navigation.navigate('ChangePassword')}
      >
        <Text className="text-base font-semibold text-content-inverse">
          {COPY.changePasswordLabel}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isSigningOut }}
        className="w-full items-center rounded-lg border border-border px-4 py-3"
        disabled={isSigningOut}
        onPress={() => navigation.navigate('Sessions')}
      >
        <Text className="text-base font-semibold text-content">{COPY.sessionsLabel}</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isSigningOut }}
        className="w-full items-center rounded-lg border border-border px-4 py-3"
        disabled={isSigningOut}
        onPress={handleSignOut}
      >
        <Text className="text-base font-semibold text-content">{COPY.signOutLabel}</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isSigningOut }}
        className="w-full items-center rounded-lg border border-danger px-4 py-3"
        disabled={isSigningOut}
        onPress={confirmSignOutEverywhere}
      >
        <Text className="text-base font-semibold text-danger">{COPY.signOutEverywhereLabel}</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isSigningOut }}
        className="w-full items-center rounded-lg border border-danger px-4 py-3"
        disabled={isSigningOut}
        onPress={() => navigation.navigate('DeleteAccount')}
      >
        <Text className="text-base font-semibold text-danger">{COPY.deleteAccountLabel}</Text>
      </Pressable>
    </View>
  );
};
