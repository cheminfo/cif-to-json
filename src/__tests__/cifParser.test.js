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

// ---- CIF 1.1 quoting: a quote closes a value only before whitespace ---------

test('an apostrophe inside a single-quoted value does not close it', () => {
  const result = cifParser("_publ_contact_author_name 'O'Daniel, H'");

  expect(result._publ_contact_author_name).toBe("O'Daniel, H");
});

test('an escaped accent inside a single-quoted value does not close it', () => {
  const result = cifParser(
    String.raw`_publ_contact_author_name 'Bour\'ee, F.'`,
  );

  expect(result._publ_contact_author_name).toBe(String.raw`Bour\'ee, F.`);
});

test('a double quote inside a double-quoted value does not close it', () => {
  const result = cifParser('_key "a"b" _other c');

  expect(result).toStrictEqual({ _key: 'a"b', _other: 'c' });
});

test('a loop of authors with apostrophes keeps every row whole', () => {
  const cif = String.raw`loop_
_publ_author_name
'O'Daniel, H'
'Bour\'ee, F.'
'Smith, J.'
`;
  const result = cifParser(cif);

  const names = result._publ_author_name.map((row) => row._publ_author_name);

  expect(names).toStrictEqual([
    "O'Daniel, H",
    String.raw`Bour\'ee, F.`,
    'Smith, J.',
  ]);
});

test('quoted values next to each other in a loop row', () => {
  const cif = `loop_
_row.a
_row.b
_row.c
'it's' "x y" 3
`;
  const result = cifParser(cif);

  expect(result._row).toStrictEqual([
    { '_row.a': "it's", '_row.b': 'x y', '_row.c': '3' },
  ]);
});

// ---- comments ---------------------------------------------------------------

test('a # inside an unquoted value is part of the value', () => {
  const result = cifParser('_chem_smiles C#N');

  expect(result._chem_smiles).toBe('C#N');
});

test('a # after whitespace opens a comment', () => {
  const result = cifParser(
    '_cell_length_a 5.43 # silicon\n_cell_length_b 5.43',
  );

  expect(result._cell_length_a).toBe('5.43');
  expect(result._cell_length_b).toBe('5.43');
});

test('a block header is read whatever its case', () => {
  const cif = `loop_
_a
1
2
DATA_second
_b 3
`;
  const result = cifParser(cif);

  expect(result).toStrictEqual({ _a: [{ _a: '1' }, { _a: '2' }], _b: '3' });
});
