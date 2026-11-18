import type { Molecule } from 'openchemlib';

import type { CifJson, CifParserOptions, CifRow } from './types.ts';

/**
 * OpenChemLib's `Molecule` class, passed in so the peer stays optional.
 */
export type MoleculeClass = typeof Molecule;

/**
 * Options of `moleculeFromCif` and `moleculeFromCifJson`.
 */
export type MoleculeFromCifOptions = CifParserOptions;

/**
 * A chemical component, as a molecule and what its entry says of itself.
 */
export interface MoleculeFromCif {
  /**
   * The molecule, with the entry's 3D coordinates.
   */
  molecule: Molecule;
  /**
   * `_chem_comp.id`, else `_chem_comp.three_letter_code`.
   */
  code: string;
  /**
   * `_chem_comp.name`.
   */
  name: string;
  /**
   * `_chem_comp.type`.
   */
  type: string;
  /**
   * `_chem_comp.formula`.
   */
  formula: string;
  /**
   * How many atoms the entry lists.
   */
  nbAtoms: number;
}

/**
 * Build an OpenChemLib molecule from one parsed block of the wwPDB Chemical
 * Component Dictionary (CCD).
 *
 * Atoms are placed at their ideal coordinates (`pdbx_model_Cartn_*_ideal`,
 * else `model_Cartn_*`), which gives OpenChemLib enough 3D information to
 * encode tetrahedral and double-bond stereochemistry in the ID code.
 * @param json - One block, as `cifParser` returns it.
 * @param Molecule - OpenChemLib's `Molecule` class (an optional peer dependency).
 * @param options - Options. The logger says why an entry gave no molecule.
 * @returns The molecule and what the entry says of itself, or `null` for an
 * entry that is not a small molecule: a single atom, an unknown element, or a
 * bond to an atom the entry does not list.
 */
export function moleculeFromCifJson(
  json: CifJson,
  Molecule: MoleculeClass,
  options: MoleculeFromCifOptions = {},
): MoleculeFromCif | null {
  const { logger } = options;
  const code =
    scalar(json, '_chem_comp.id') ??
    scalar(json, '_chem_comp.three_letter_code') ??
    '';
  const atomRows = loop(json, '_chem_comp_atom');
  if (atomRows.length < 2) {
    logger?.info(
      { code },
      `${code} lists ${atomRows.length} atoms; no molecule was built.`,
    );
    return null;
  }
  const bondRows = loop(json, '_chem_comp_bond');

  const molecule = new Molecule(atomRows.length, bondRows.length);
  const atomIndex = new Map<string, number>();

  for (const row of atomRows) {
    const atomId = get(row, '_chem_comp_atom.atom_id');
    const rawSymbol = get(row, '_chem_comp_atom.type_symbol');
    const atomicNo = rawSymbol
      ? Molecule.getAtomicNoFromLabel(normalizeSymbol(rawSymbol))
      : 0;
    if (!atomId || !atomicNo) {
      logger?.warn(
        { code, atom: atomId },
        `${code}: atom "${atomId}" has no known element ("${rawSymbol}"); no molecule was built.`,
      );
      return null;
    }

    const index = molecule.addAtom(atomicNo);
    molecule.setAtomX(index, coordinate(row, 'x'));
    molecule.setAtomY(index, coordinate(row, 'y'));
    molecule.setAtomZ(index, coordinate(row, 'z'));

    const charge = Math.trunc(
      Number(get(row, '_chem_comp_atom.charge') || '0'),
    );
    if (charge) molecule.setAtomCharge(index, charge);

    atomIndex.set(atomId, index);
  }

  for (const row of bondRows) {
    const atom1 = get(row, '_chem_comp_bond.atom_id_1');
    const atom2 = get(row, '_chem_comp_bond.atom_id_2');
    const from = atomIndex.get(atom1);
    const to = atomIndex.get(atom2);
    if (from === undefined || to === undefined) {
      logger?.warn(
        { code, atom1, atom2 },
        `${code}: a bond joins "${atom1}" and "${atom2}", which the entry does not both list; no molecule was built.`,
      );
      return null;
    }

    const bondIndex = molecule.addBond(from, to);
    const order = (
      get(row, '_chem_comp_bond.value_order') || 'SING'
    ).toUpperCase();
    molecule.setBondType(bondIndex, bondType(order, Molecule));
  }

  return {
    molecule,
    code,
    name: scalar(json, '_chem_comp.name') ?? '',
    type: scalar(json, '_chem_comp.type') ?? '',
    formula: scalar(json, '_chem_comp.formula') ?? '',
    nbAtoms: atomRows.length,
  };
}

/**
 * A scalar tag of a block.
 * @param json - The block.
 * @param tag - The tag.
 * @returns Its value, or `undefined` when the block has no such scalar.
 */
function scalar(json: CifJson, tag: string): string | undefined {
  const value = json[tag];
  return typeof value === 'string' ? value : undefined;
}

/**
 * The rows of a loop of a block.
 * @param json - The block.
 * @param key - The loop's prefix.
 * @returns Its rows, or none when the block has no such loop.
 */
function loop(json: CifJson, key: string): CifRow[] {
  const value = json[key];
  return Array.isArray(value) ? value : [];
}

/**
 * A value of a loop row; the missing-value markers `.` and `?` are already
 * `''`.
 * @param row - The row.
 * @param tag - The full tag.
 * @returns The value, or `''` when the row has none.
 */
function get(row: CifRow, tag: string): string {
  return row[tag] ?? '';
}

/**
 * One coordinate of an atom: the ideal one, else the model one, else 0.
 * @param row - The atom's row.
 * @param axis - Which coordinate.
 * @returns The coordinate, in Å.
 */
function coordinate(row: CifRow, axis: 'x' | 'y' | 'z'): number {
  return Number(
    get(row, `_chem_comp_atom.pdbx_model_Cartn_${axis}_ideal`) ||
      get(row, `_chem_comp_atom.model_Cartn_${axis}`) ||
      '0',
  );
}

/**
 * Write a CCD element symbol the way OpenChemLib reads it: `FE` as `Fe`.
 * @param symbol - The symbol as the CCD writes it.
 * @returns The symbol in mixed case.
 */
function normalizeSymbol(symbol: string): string {
  return symbol.charAt(0).toUpperCase() + symbol.slice(1).toLowerCase();
}

/**
 * OpenChemLib's bond type for a CCD `value_order`.
 * @param order - `SING`, `DOUB`, `TRIP`, `AROM` or `AROMATIC`.
 * @param Molecule - OpenChemLib's `Molecule` class.
 * @returns The bond type; single for anything else.
 */
function bondType(order: string, Molecule: MoleculeClass): number {
  switch (order) {
    case 'DOUB':
      return Molecule.cBondTypeDouble;
    case 'TRIP':
      return Molecule.cBondTypeTriple;
    case 'AROM':
    case 'AROMATIC':
      return Molecule.cBondTypeDelocalized;
    default:
      return Molecule.cBondTypeSingle;
  }
}
