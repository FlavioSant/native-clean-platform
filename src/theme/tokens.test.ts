import { semanticColors, semanticColorsDark } from './tokens';

describe('semanticColorsDark', () => {
  it('defines exactly the same aliases as the light theme', () => {
    expect(Object.keys(semanticColorsDark).sort()).toEqual(Object.keys(semanticColors).sort());
  });
});
