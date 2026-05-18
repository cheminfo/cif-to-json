/* eslint-disable camelcase -- CIF tag names use underscore-dot notation, not camelCase */
import OCL from 'openchemlib';
import { expect, test } from 'vitest';

import { moleculeFromCifJson } from '../moleculeFromCifJson.js';

const { Molecule } = OCL;

/**
 * Minimal JSON representation of an ALA block as produced by cifParser.
 * Heavy atoms only; ideal coordinates used for stereochemistry tests.
 */
const ALA_JSON = {
  '_chem_comp.id': 'ALA',
  '_chem_comp.name': 'ALANINE',
  '_chem_comp.type': 'L-PEPTIDE LINKING',
  '_chem_comp.formula': 'C3 H7 N O2',
  _chem_comp_atom: [
    {
      '_chem_comp_atom.atom_id': 'N',
      '_chem_comp_atom.type_symbol': 'N',
      '_chem_comp_atom.charge': '0',
      '_chem_comp_atom.pdbx_model_Cartn_x_ideal': '1.276',
      '_chem_comp_atom.pdbx_model_Cartn_y_ideal': '0.492',
      '_chem_comp_atom.pdbx_model_Cartn_z_ideal': '0.000',
    },
    {
      '_chem_comp_atom.atom_id': 'CA',
      '_chem_comp_atom.type_symbol': 'C',
      '_chem_comp_atom.charge': '0',
      '_chem_comp_atom.pdbx_model_Cartn_x_ideal': '0.000',
      '_chem_comp_atom.pdbx_model_Cartn_y_ideal': '0.000',
      '_chem_comp_atom.pdbx_model_Cartn_z_ideal': '0.000',
    },
    {
      '_chem_comp_atom.atom_id': 'C',
      '_chem_comp_atom.type_symbol': 'C',
      '_chem_comp_atom.charge': '0',
      '_chem_comp_atom.pdbx_model_Cartn_x_ideal': '-1.184',
      '_chem_comp_atom.pdbx_model_Cartn_y_ideal': '0.499',
      '_chem_comp_atom.pdbx_model_Cartn_z_ideal': '0.000',
    },
    {
      '_chem_comp_atom.atom_id': 'O',
      '_chem_comp_atom.type_symbol': 'O',
      '_chem_comp_atom.charge': '0',
      '_chem_comp_atom.pdbx_model_Cartn_x_ideal': '-1.374',
      '_chem_comp_atom.pdbx_model_Cartn_y_ideal': '1.706',
      '_chem_comp_atom.pdbx_model_Cartn_z_ideal': '0.000',
    },
    {
      '_chem_comp_atom.atom_id': 'OXT',
      '_chem_comp_atom.type_symbol': 'O',
      '_chem_comp_atom.charge': '0',
      '_chem_comp_atom.pdbx_model_Cartn_x_ideal': '-2.175',
      '_chem_comp_atom.pdbx_model_Cartn_y_ideal': '-0.341',
      '_chem_comp_atom.pdbx_model_Cartn_z_ideal': '0.000',
    },
    {
      '_chem_comp_atom.atom_id': 'CB',
      '_chem_comp_atom.type_symbol': 'C',
      '_chem_comp_atom.charge': '0',
      '_chem_comp_atom.pdbx_model_Cartn_x_ideal': '0.049',
      '_chem_comp_atom.pdbx_model_Cartn_y_ideal': '-1.090',
      '_chem_comp_atom.pdbx_model_Cartn_z_ideal': '0.764',
    },
  ],
  _chem_comp_bond: [
    {
      '_chem_comp_bond.atom_id_1': 'N',
      '_chem_comp_bond.atom_id_2': 'CA',
      '_chem_comp_bond.value_order': 'SING',
    },
    {
      '_chem_comp_bond.atom_id_1': 'CA',
      '_chem_comp_bond.atom_id_2': 'C',
      '_chem_comp_bond.value_order': 'SING',
    },
    {
      '_chem_comp_bond.atom_id_1': 'CA',
      '_chem_comp_bond.atom_id_2': 'CB',
      '_chem_comp_bond.value_order': 'SING',
    },
    {
      '_chem_comp_bond.atom_id_1': 'C',
      '_chem_comp_bond.atom_id_2': 'O',
      '_chem_comp_bond.value_order': 'DOUB',
    },
    {
      '_chem_comp_bond.atom_id_1': 'C',
      '_chem_comp_bond.atom_id_2': 'OXT',
      '_chem_comp_bond.value_order': 'SING',
    },
  ],
};

test('returns null for a single-atom entry', () => {
  expect(moleculeFromCifJson({ _chem_comp_atom: [] }, Molecule)).toBeNull();
  expect(
    moleculeFromCifJson(
      {
        _chem_comp_atom: [
          {
            '_chem_comp_atom.atom_id': 'NA',
            '_chem_comp_atom.type_symbol': 'Na',
            '_chem_comp_atom.charge': '1',
          },
        ],
      },
      Molecule,
    ),
  ).toBeNull();
});

test('returns null for an unknown element symbol', () => {
  const json = {
    _chem_comp_atom: [
      {
        '_chem_comp_atom.atom_id': 'X1',
        '_chem_comp_atom.type_symbol': 'Xx',
        '_chem_comp_atom.charge': '0',
      },
      {
        '_chem_comp_atom.atom_id': 'X2',
        '_chem_comp_atom.type_symbol': 'Yy',
        '_chem_comp_atom.charge': '0',
      },
    ],
    _chem_comp_bond: [
      {
        '_chem_comp_bond.atom_id_1': 'X1',
        '_chem_comp_bond.atom_id_2': 'X2',
        '_chem_comp_bond.value_order': 'SING',
      },
    ],
  };

  expect(moleculeFromCifJson(json, Molecule)).toBeNull();
});

test('ALA: returns correct code, name, type, formula, and nbAtoms', () => {
  const result = moleculeFromCifJson(ALA_JSON, Molecule);

  expect(result).not.toBeNull();
  expect(result.code).toBe('ALA');
  expect(result.name).toBe('ALANINE');
  expect(result.type).toBe('L-PEPTIDE LINKING');
  expect(result.formula).toBe('C3 H7 N O2');
  expect(result.nbAtoms).toBe(6);
});

test('ALA: idCode encodes S (L-alanine) stereochemistry from 3D coordinates', () => {
  const result = moleculeFromCifJson(ALA_JSON, Molecule);

  expect(result).not.toBeNull();

  // L-alanine is S-configured; R-alanine must give a different idCode.
  const sAla = Molecule.fromSmiles('N[C@@H](C)C(=O)O');
  const rAla = Molecule.fromSmiles('N[C@H](C)C(=O)O');

  expect(sAla.getIDCode()).not.toBe(rAla.getIDCode());
  expect(result.molecule.getIDCode()).toBe(sAla.getIDCode());
});

test('ALA: R-alanine coordinates produce D-alanine (R-config) idCode', () => {
  // Mirror CB across Z=0 plane: z = -0.764 gives R configuration.
  const rAlaJson = {
    ...ALA_JSON,
    _chem_comp_atom: ALA_JSON._chem_comp_atom.map((row) =>
      row['_chem_comp_atom.atom_id'] === 'CB'
        ? { ...row, '_chem_comp_atom.pdbx_model_Cartn_z_ideal': '-0.764' }
        : row,
    ),
  };
  const result = moleculeFromCifJson(rAlaJson, Molecule);

  expect(result).not.toBeNull();

  const rAla = Molecule.fromSmiles('N[C@H](C)C(=O)O');

  expect(result.molecule.getIDCode()).toBe(rAla.getIDCode());
});
