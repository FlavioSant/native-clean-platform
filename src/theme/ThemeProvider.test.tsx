import { act, render, screen } from '@testing-library/react-native';
import { colorScheme } from 'nativewind';
import { Text } from 'react-native';

import { ThemeProvider } from './ThemeProvider';
import { useThemeColors } from './useThemeColors';

const Probe = () => {
  const theme = useThemeColors();

  return <Text>{`primary:${theme.primary}`}</Text>;
};

describe('ThemeProvider', () => {
  afterEach(() => {
    colorScheme.set('system');
  });

  it('renders its children', async () => {
    await render(
      <ThemeProvider>
        <Text>content</Text>
      </ThemeProvider>,
    );

    expect(screen.getByText('content')).toBeTruthy();
  });

  it('reacts to the resolved scheme changing while mounted', async () => {
    colorScheme.set('light');
    await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    const lightValue = screen.getByText(/^primary:/).props.children;

    await act(async () => {
      colorScheme.set('dark');
    });

    const darkValue = screen.getByText(/^primary:/).props.children;

    expect(darkValue).not.toBe(lightValue);
  });
});
