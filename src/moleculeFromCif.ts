import { cifParser } from './cifParser.ts';
import type {
  MoleculeClass,
  MoleculeFromCif,
  MoleculeFromCifOptions,
} from './moleculeFromCifJson.ts';
import { moleculeFromCifJson } from './moleculeFromCifJson.ts';

/**
 * Parse one block of the wwPDB Chemical Component Dictionary (CCD) and build
 * an OpenChemLib molecule from it, with `moleculeFromCifJson`.
 *
 * Only the file's first block is read: to read every entry of
 * `components.cif`, pass each block of `parseCifBlocks` to
 * `moleculeFromCifJson`.
 * @param cifText - CIF text of one block.
 * @param Molecule - OpenChemLib's `Molecule` class (an optional peer dependency).
 * @param options - Options.
 * @returns The molecule and what the entry says of itself, or `null` when the
 * entry cannot be represented as a small molecule.
 */
export function moleculeFromCif(
  cifText: string,
  Molecule: MoleculeClass,
  options: MoleculeFromCifOptions = {},
): MoleculeFromCif | null {
  return moleculeFromCifJson(cifParser(cifText, options), Molecule, options);
}
