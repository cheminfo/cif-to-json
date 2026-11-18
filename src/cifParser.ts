import { buildBlocks } from './buildBlocks.ts';
import { tokenize } from './tokenize.ts';
import type { CifBlock, CifJson, CifParserOptions } from './types.ts';

/**
 * Parse the first data block of a CIF (Crystallographic Information File).
 * Reads classic crystallographic CIF and mmCIF / CCD alike (dotted tags such as
 * `_chem_comp_atom.atom_id`). A file holding several blocks has only its first
 * read, and says so to the logger; `parseCifBlocks` reads them all.
 * @param input - CIF file content.
 * @param options - Options.
 * @returns The first block: scalar tags under their own name, each loop as an
 * array under the prefix its tags share, every row keyed on the full tags.
 */
export function cifParser(
  input: string,
  options: CifParserOptions = {},
): CifJson {
  const blocks = parseCifBlocks(input, options);
  const [first] = blocks;
  if (first === undefined) return {};
  if (blocks.length > 1) {
    options.logger?.warn(
      { blocks: blocks.length },
      `The file holds ${blocks.length} data blocks; only the first, "${first.name}", was read. Read them all with parseCifBlocks.`,
    );
  }
  return first.data;
}

/**
 * Parse every data block of a CIF, keeping each apart.
 * @param input - CIF file content.
 * @param options - Options.
 * @returns The blocks, in file order, each with its name and its data as
 * `cifParser` returns it.
 */
export function parseCifBlocks(
  input: string,
  options: CifParserOptions = {},
): CifBlock[] {
  const { logger } = options;
  return buildBlocks(tokenize(input, logger), logger);
}
