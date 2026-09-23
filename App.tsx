import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import './global.css';

import { createQueryClient, ErrorBoundary, ErrorToastProvider, registerErrorCopy } from '@/errors';
import { startConnectivityWatch } from '@/lib';
import { AUTH_ERROR_COPY, AuthProvider } from '@/modules/auth';
import { RootNavigator } from '@/navigation';
import { ThemeProvider } from '@/theme';

/** `GestureHandlerRootView` needs a real style object — NativeWind cannot reach it. */
const ROOT_STYLE = { flex: 1 } as const;

const STATUS_BAR_STYLE = 'auto';

startConnectivityWatch();
registerErrorCopy(AUTH_ERROR_COPY);

/** Module scope on purpose: a client built in the component would be rebuilt, cache and all, on every render. */
const queryClient = createQueryClient();

const App = () => (
  <GestureHandlerRootView style={ROOT_STYLE}>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style={STATUS_BAR_STYLE} />
          <ErrorBoundary>
            <ErrorToastProvider>
              <AuthProvider>
                <RootNavigator />
              </AuthProvider>
            </ErrorToastProvider>
          </ErrorBoundary>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </GestureHandlerRootView>
);

export default App;
