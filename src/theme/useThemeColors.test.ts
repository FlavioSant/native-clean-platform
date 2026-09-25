import { act, renderHook } from '@testing-library/react-native';
import { colorScheme } from 'nativewind';

import { semanticColors, semanticColorsDark } from './tokens';
import { useThemeColors } from './useThemeColors';

describe('useThemeColors', () => {
  afterEach(async () => {
    await act(async () => {
      colorScheme.set('system');
    });
  });

  it('returns the light map for the light scheme', async () => {
    colorScheme.set('light');

    const { result } = await renderHook(() => useThemeColors());

    expect(result.current).toBe(semanticColors);
  });

  it('switches to the dark map when the scheme changes while mounted', async () => {
    colorScheme.set('light');
    const { result } = await renderHook(() => useThemeColors());

    await act(async () => {
      colorScheme.set('dark');
    });

    expect(result.current).toBe(semanticColorsDark);
  });
});
