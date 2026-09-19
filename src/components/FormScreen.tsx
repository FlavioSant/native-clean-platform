import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, ScrollView } from 'react-native';

/**
 * The root of any screen that holds a form: it lifts the content over the
 * keyboard and scrolls when the form is taller than what is left. Content is
 * centered while it fits.
 *
 * `behavior="padding"` on both platforms: Android is edge-to-edge here, where
 * the window no longer resizes for the keyboard and Expo's guidance is to use
 * `KeyboardAvoidingView` "like on iOS" — the `undefined` Android example in its
 * keyboard guide predates that.
 *
 * `keyboardShouldPersistTaps="handled"`: without it the first tap on a button
 * while a field is focused only dismisses the keyboard, so the submit button
 * would need two taps.
 */
export const FormScreen = ({ children }: PropsWithChildren) => (
  <KeyboardAvoidingView behavior="padding" className="flex-1 bg-background">
    <ScrollView
      contentContainerClassName="flex-grow justify-center px-6 py-8"
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  </KeyboardAvoidingView>
);
