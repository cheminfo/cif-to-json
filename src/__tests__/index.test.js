import { expect, test } from 'vitest';

import { cifParser } from '../index.js';

test('re-exports cifParser', () => {
  expect(typeof cifParser).toBe('function');
});
