/**
 * Normalize a CCD element symbol to the mixed-case form OCL expects.
 * CCD writes `C`, `Cl`, `FE`, …; OCL requires `C`, `Cl`, `Fe`, …
 * @param {string} symbol - Raw element symbol from CCD.
 * @returns {string} Mixed-case element symbol.
 */
function normalizeSymbol(symbol) {
  if (!symbol) return '';
  return symbol[0].toUpperCase() + symbol.slice(1).toLowerCase();
}

/**
 * Look up a value in a CDD loop row, treating CIF missing-value markers
 * (`.` and `?`, both mapped to `''` by cifParser) as absent.
 * @param {Record<string,string>} row - Parsed CIF loop row object.
 * @param {string} key - Full tag name to look up.
 * @returns {string} The string value, or `''` if absent or missing.
 */
function get(row, key) {
  return row[key] ?? '';
}

/**
 * Build an OpenChemLib `Molecule` from the parsed JSON of a single wwPDB
 * Chemical Component Dictionary (CCD) block.
 *
 * The JSON is expected to come from `cifParser` applied to a single
 * `data_XXX` CCD block. Atoms are added with their ideal Cartesian
 * coordinates (`pdbx_model_Cartn_*_ideal`); this gives OCL enough 3D
 * information to encode tetrahedral and double-bond stereochemistry
 * directly in the resulting idCode — no additional stereo-detection call
 * is required.
 *
 * Returns `null` for entries that cannot be represented as a small
 * molecule: single-atom ions (< 2 atoms), unknown element symbols, or
 * bonds that reference non-existent atom IDs.
 * @param {object} json - Output of `cifParser` for one CCD block.
 * @param {object} Molecule - OpenChemLib `Molecule` class constructor (peer dependency).
 * @returns {{ molecule: object, code: string, name: string, type: string, formula: string, nbAtoms: number } | null} Parsed result or `null` when the entry cannot be represented.
 */
export function moleculeFromCifJson(json, Molecule) {
  const atomRows = /** @type {Array<Record<string,string>>} */ (
    json._chem_comp_atom ?? []
  );
  const bondRows = /** @type {Array<Record<string,string>>} */ (
    json._chem_comp_bond ?? []
  );

  if (atomRows.length < 2) return null;

  const code =
    json['_chem_comp.id'] ?? json['_chem_comp.three_letter_code'] ?? '';
  const name = json['_chem_comp.name'] ?? '';
  const type = json['_chem_comp.type'] ?? '';
  const formula = json['_chem_comp.formula'] ?? '';

  const molecule = new Molecule(atomRows.length, bondRows.length);
  /** @type {Map<string, number>} */
  const atomIndex = new Map();

  for (const row of atomRows) {
    const atomId = get(row, '_chem_comp_atom.atom_id');
    const rawSymbol = get(row, '_chem_comp_atom.type_symbol');
    if (!atomId || !rawSymbol) return null;

    const symbol = normalizeSymbol(rawSymbol);
    const atomicNo = Molecule.getAtomicNoFromLabel(symbol);
    if (!atomicNo) return null;

    const i = molecule.addAtom(atomicNo);

    // Prefer ideal coordinates; fall back to model coordinates.
    const xIdeal = get(row, '_chem_comp_atom.pdbx_model_Cartn_x_ideal');
    const yIdeal = get(row, '_chem_comp_atom.pdbx_model_Cartn_y_ideal');
    const zIdeal = get(row, '_chem_comp_atom.pdbx_model_Cartn_z_ideal');
    const xModel = get(row, '_chem_comp_atom.model_Cartn_x');
    const yModel = get(row, '_chem_comp_atom.model_Cartn_y');
    const zModel = get(row, '_chem_comp_atom.model_Cartn_z');

    molecule.setAtomX(i, Number.parseFloat(xIdeal || xModel || '0'));
    molecule.setAtomY(i, Number.parseFloat(yIdeal || yModel || '0'));
    molecule.setAtomZ(i, Number.parseFloat(zIdeal || zModel || '0'));

    const charge = Number.parseInt(
      get(row, '_chem_comp_atom.charge') || '0',
      10,
    );
    if (charge) molecule.setAtomCharge(i, charge);

    atomIndex.set(atomId, i);
  }

  for (const row of bondRows) {
    const atom1 = get(row, '_chem_comp_bond.atom_id_1');
    const atom2 = get(row, '_chem_comp_bond.atom_id_2');
    if (!atom1 || !atom2) return null;

    const a = atomIndex.get(atom1);
    const b = atomIndex.get(atom2);
    if (a === undefined || b === undefined) return null;

    const bondIdx = molecule.addBond(a, b);
    const order = (
      get(row, '_chem_comp_bond.value_order') || 'SING'
    ).toUpperCase();
    molecule.setBondType(bondIdx, bondTypeConstant(order, Molecule));
  }

  return { molecule, code, name, type, formula, nbAtoms: atomRows.length };
}

/**
 * Map a CCD `value_order` string to the corresponding OCL bond-type constant.
 * @param {string} order - CCD bond order (e.g. `'SING'`, `'DOUB'`, `'TRIP'`, `'AROM'`).
 * @param {object} Molecule - OCL Molecule class (for bond-type constants).
 * @returns {number} OCL bond type constant.
 */
function bondTypeConstant(order, Molecule) {
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
