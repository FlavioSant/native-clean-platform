import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { FormScreen } from './FormScreen';

describe('FormScreen', () => {
  it('renders its children', async () => {
    await render(
      <FormScreen>
        <Text>form content</Text>
      </FormScreen>,
    );

    expect(screen.getByText('form content')).toBeTruthy();
  });
});
