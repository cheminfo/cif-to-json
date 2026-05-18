import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import OCL from 'openchemlib';
import { expect, test } from 'vitest';

import { moleculeFromCif } from '../moleculeFromCif.js';

const { Molecule } = OCL;

test('parses ala.cif fixture and returns correct code and name', () => {
  const cifText = readFileSync(join(import.meta.dirname, 'ala.cif'), 'utf8');
  const result = moleculeFromCif(cifText, Molecule);

  expect(result).not.toBeNull();
  expect(result.code).toBe('ALA');
  expect(result.name).toBe('ALANINE');
});

test('parses ala.cif fixture and encodes S (L-alanine) stereochemistry', () => {
  const cifText = readFileSync(join(import.meta.dirname, 'ala.cif'), 'utf8');
  const result = moleculeFromCif(cifText, Molecule);

  expect(result).not.toBeNull();

  const sAla = Molecule.fromSmiles('N[C@@H](C)C(=O)O');

  expect(result.molecule.getIDCode()).toBe(sAla.getIDCode());
});

test('returns null for a CIF block with no atom table', () => {
  const result = moleculeFromCif('data_EMPTY\n_some_tag value\n', Molecule);

  expect(result).toBeNull();
});
