import { expect, test } from 'vitest';

import { cifParser } from '../index.ts';

test('re-exports cifParser', () => {
  expect(typeof cifParser).toBe('function');
});
