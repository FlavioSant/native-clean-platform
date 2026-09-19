import { render, screen } from '@testing-library/react-native';

import { SplashScreen } from './SplashScreen';

describe('SplashScreen', () => {
  it('shows a spinner that assistive technology can name', async () => {
    await render(<SplashScreen />);

    expect(screen.getByLabelText('Loading')).toBeTruthy();
  });
});
