import { cifParser } from './cifParser.js';
import { moleculeFromCifJson } from './moleculeFromCifJson.js';

/**
 * Parse a CIF block and build an OpenChemLib `Molecule` from it.
 *
 * Parses the CIF text with `cifParser` and delegates to
 * `moleculeFromCifJson` which handles the wwPDB Chemical Component
 * Dictionary (CCD) mmCIF schema (`_chem_comp_atom` / `_chem_comp_bond`).
 * When processing the full `components.cif` file, the caller is responsible
 * for splitting the stream into individual `data_XXX` blocks before calling
 * this function.
 * @param {string} cifText - Raw CIF text for a single block.
 * @param {object} Molecule - OpenChemLib `Molecule` class constructor (peer dependency).
 * @returns {{ molecule: object, code: string, name: string, type: string, formula: string, nbAtoms: number } | null}
 *   Parsed result, or `null` when the entry cannot be represented as a
 *   small molecule (single-atom ions, unknown elements, malformed bonds).
 */
export function moleculeFromCif(cifText, Molecule) {
  const json = cifParser(cifText);
  return moleculeFromCifJson(json, Molecule);
}
