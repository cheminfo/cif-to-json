import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from 'vitest';

import { cifParser } from '../cifParser.js';

const cif = readFileSync(join(import.meta.dirname, 'test.cif')).toString();
const parsed = cifParser(cif);

// ---- crystallographic CIF backward-compatibility ----------------------------

test('scalar fields and loop arrays from crystallographic CIF', () => {
  expect(parsed._cell_angle_gamma).toBe('90');
  expect(parsed._journal_paper_doi).toBe('10.1021/om0102302');
  expect(parsed._atom_site).toHaveLength(143);
  expect(parsed._publ_author_name).toHaveLength(4);
});

// ---- double-quoted strings --------------------------------------------------

test('double-quoted string value is parsed without the quotes', () => {
  const result = cifParser('_key "hello world"');

  expect(result._key).toBe('hello world');
});

test('double-quoted string may contain single quotes without breaking', () => {
  const result = cifParser(`_name "ADENOSINE-5'-TRIPHOSPHATE"`);

  expect(result._name).toBe("ADENOSINE-5'-TRIPHOSPHATE");
});

test('single-quoted string value is parsed without the quotes', () => {
  const result = cifParser("_key 'hello world'");

  expect(result._key).toBe('hello world');
});

// ---- semicolon-delimited multiline text -------------------------------------

test('semicolon text block is parsed into a single string value', () => {
  const cif = `_key
;
line one
line two
;
`;
  const result = cifParser(cif);

  expect(result._key).toBe('line one\nline two');
});

// ---- CDD mmCIF dotted tags --------------------------------------------------

test('loop with dotted tag prefix uses the prefix without trailing dot as key', () => {
  const cif = `loop_
_chem_comp_atom.atom_id
_chem_comp_atom.type_symbol
 N  N
 CA C
`;
  const result = cifParser(cif);

  expect(result._chem_comp_atom).toHaveLength(2);
  expect(result._chem_comp_atom[0]['_chem_comp_atom.atom_id']).toBe('N');
  expect(result._chem_comp_atom[1]['_chem_comp_atom.type_symbol']).toBe('C');
});

test('missing-value markers . and ? become empty strings', () => {
  const cif = '_a .\n_b ?';
  const result = cifParser(cif);

  expect(result._a).toBe('');
  expect(result._b).toBe('');
});
