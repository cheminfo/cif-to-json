import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from 'vitest';

import { cifParser } from '../cifParser.js';

const cif = readFileSync(join(import.meta.dirname, 'test.cif')).toString();
const parsed = cifParser(cif);

test('some fields', () => {
  expect(parsed._cell_angle_gamma).toBe('90');
  expect(parsed._journal_paper_doi).toBe('10.1021/om0102302');
  expect(parsed._atom_site).toHaveLength(143);
  expect(parsed._publ_author_name).toHaveLength(4);
});
