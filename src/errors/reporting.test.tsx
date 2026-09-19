import { QueryClientProvider, useMutation, useQuery } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Pressable, Text } from 'react-native';
import { type Metrics, SafeAreaProvider } from 'react-native-safe-area-context';

import { API_ERROR_CODES, ApiError } from '@/lib';

import { resetErrorCopy } from './copy';
import { ErrorToastProvider } from './ErrorToast';
import { createQueryClient } from './queryClient';

const OFFLINE_COPY = 'Could not reach the server. Check your connection.';
const LOADING_TEXT = 'loading';
const SUBMIT_TEXT = 'submit';

const offlineError = new ApiError({
  status: 0,
  code: API_ERROR_CODES.NETWORK_ERROR,
  message: 'never rendered',
});

/** The toast reads safe-area insets, which throw with no provider above them. */
const SAFE_AREA_METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const FailingQuery = () => {
  useQuery({
    queryKey: ['probe'],
    queryFn: async () => Promise.reject(offlineError),
    retry: false,
  });

  return <Text>{LOADING_TEXT}</Text>;
};

const SilentQuery = () => {
  useQuery({
    queryKey: ['silent-probe'],
    queryFn: async () => Promise.reject(offlineError),
    retry: false,
    meta: { silent: true },
  });

  return <Text>{LOADING_TEXT}</Text>;
};

const MutationProbe = ({ toastOnError }: { toastOnError: boolean }) => {
  const { mutate } = useMutation({
    mutationFn: async () => Promise.reject(offlineError),
    meta: { toastOnError },
  });

  return (
    <Pressable onPress={() => mutate()}>
      <Text>{SUBMIT_TEXT}</Text>
    </Pressable>
  );
};

const renderApp = async (probe: ReactElement) =>
  render(
    <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
      <QueryClientProvider
        client={createQueryClient({
          queries: { retry: false, gcTime: Infinity },
          mutations: { gcTime: Infinity },
        })}
      >
        <ErrorToastProvider>{probe}</ErrorToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>,
  );

beforeEach(() => {
  resetErrorCopy();
});

describe('a failing query', () => {
  it('reaches the toast through the registered reporter', async () => {
    await renderApp(<FailingQuery />);

    expect(await screen.findByText(OFFLINE_COPY)).toBeTruthy();
  });

  it('stays silent when the query opted out with meta.silent', async () => {
    await renderApp(<SilentQuery />);
    await screen.findByText(LOADING_TEXT);

    expect(screen.queryByText(OFFLINE_COPY)).toBeNull();
  });
});

describe('a failing mutation', () => {
  it('stays silent by default, because its form renders the error inline', async () => {
    await renderApp(<MutationProbe toastOnError={false} />);

    await fireEvent.press(screen.getByText(SUBMIT_TEXT));

    expect(screen.queryByText(OFFLINE_COPY)).toBeNull();
  });

  it('reaches the toast when it opted in with meta.toastOnError', async () => {
    await renderApp(<MutationProbe toastOnError />);

    await fireEvent.press(screen.getByText(SUBMIT_TEXT));

    expect(await screen.findByText(OFFLINE_COPY)).toBeTruthy();
  });
});
