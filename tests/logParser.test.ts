import { performance } from 'node:perf_hooks';

describe('initial test', () => {
  it('demonstrates that Jest tests run', () => {
    expect(1).toEqual(1);
  });
});

describe('performance', () => {
  it('does some stuff in under 20 seconds', () => {
    const start = performance.now();
    const seconds_elapsed = (performance.now() - start) / 1000;
    expect(seconds_elapsed).toBeLessThan(20);
  });
});
