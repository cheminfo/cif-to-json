import type { LightLogger } from 'cheminfo-types';

import type { Token } from './tokenize.ts';
import type { CifBlock, CifRow } from './types.ts';

/**
 * Gather the tokens of a CIF into its data blocks.
 * @param tokens - The tokens, in file order.
 * @param logger - Where what had to be dropped is reported.
 * @returns The blocks, in file order. Tags written before the first `data_`
 * header form a block named `''`.
 */
export function buildBlocks(
  tokens: readonly Token[],
  logger?: LightLogger,
): CifBlock[] {
  const blocks: CifBlock[] = [];
  let block: CifBlock | null = null;
  let isReservedReported = false;
  let index = 0;

  while (index < tokens.length) {
    const token = tokens[index] as Token;
    index++;
    if (token.kind === 'data') {
      block = { name: token.value, data: {} };
      blocks.push(block);
      continue;
    }
    if (block === null) {
      block = { name: '', data: {} };
      blocks.push(block);
    }
    const meta = { block: block.name, line: token.line };
    switch (token.kind) {
      case 'loop':
        index = readLoop(tokens, index, block, token.line, logger);
        break;
      case 'tag': {
        const next = tokens[index];
        if (next?.kind === 'value') {
          setEntry(block, token.value, next.value, token.line, logger);
          index++;
        } else {
          logger?.error(
            { ...meta, tag: token.value },
            `${token.value} on line ${token.line} has no value; it was dropped.`,
          );
        }
        break;
      }
      case 'reserved':
        if (!isReservedReported) {
          isReservedReported = true;
          logger?.warn(
            { ...meta, word: token.value },
            `${token.value} on line ${token.line} is not read: save frames and global blocks are not supported, and the tags inside them are read as their block's own.`,
          );
        }
        break;
      case 'value':
        logger?.error(
          meta,
          `The value "${token.value}" on line ${token.line} belongs to no tag; it was dropped.`,
        );
        break;
      // no default
    }
  }
  return blocks;
}

/**
 * Read one `loop_`: its tags, then its values row by row.
 * @param tokens - Every token.
 * @param start - Index of the token after `loop_`.
 * @param block - The block the loop belongs to.
 * @param line - The line of `loop_`.
 * @param logger - Where a dropped row or an empty loop is reported.
 * @returns Index of the first token after the loop.
 */
function readLoop(
  tokens: readonly Token[],
  start: number,
  block: CifBlock,
  line: number,
  logger?: LightLogger,
): number {
  let index = start;
  const tags: string[] = [];
  for (
    let token = tokens[index];
    token?.kind === 'tag';
    token = tokens[index]
  ) {
    tags.push(token.value);
    index++;
  }
  if (tags.length === 0) {
    logger?.error(
      { block: block.name, line },
      `The loop_ on line ${line} has no tags; it was dropped.`,
    );
    return index;
  }

  const values: string[] = [];
  for (
    let token = tokens[index];
    token?.kind === 'value';
    token = tokens[index]
  ) {
    values.push(token.value);
    index++;
  }

  const width = tags.length;
  const key = commonPrefix(tags).replace(/[_.]$/, '');
  const rows: CifRow[] = [];
  for (let offset = 0; offset + width <= values.length; offset += width) {
    const row: CifRow = {};
    for (let column = 0; column < width; column++) {
      row[tags[column] as string] = values[offset + column] as string;
    }
    rows.push(row);
  }
  const rest = values.length % width;
  if (rest > 0) {
    logger?.error(
      { block: block.name, line, loop: key },
      `The loop ${key} on line ${line} ends on a row of ${rest} values for ${width} tags; that row was dropped.`,
    );
  }
  setEntry(block, key, rows, line, logger);
  return index;
}

/**
 * Store an entry of a block, saying so when it replaces one.
 * @param block - The block.
 * @param key - The tag, or the loop's prefix.
 * @param value - What to store.
 * @param line - The line it comes from.
 * @param logger - Where a repeated key is reported.
 */
function setEntry(
  block: CifBlock,
  key: string,
  value: string | CifRow[],
  line: number,
  logger?: LightLogger,
): void {
  if (Object.hasOwn(block.data, key)) {
    logger?.warn(
      { block: block.name, line, key },
      `${key} appears again on line ${line}; this last one is kept.`,
    );
  }
  block.data[key] = value;
}

/**
 * The longest prefix every string starts with.
 * @param strings - At least one string.
 * @returns The prefix.
 */
function commonPrefix(strings: readonly string[]): string {
  const first = strings[0] ?? '';
  let length = first.length;
  for (let index = 1; index < strings.length; index++) {
    const other = strings[index] as string;
    let same = 0;
    while (same < length && other[same] === first[same]) same++;
    length = same;
  }
  return first.slice(0, length);
}
