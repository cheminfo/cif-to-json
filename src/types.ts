import type { LightLogger } from 'cheminfo-types';

/**
 * One row of a `loop_`, keyed on the full tag of each column.
 */
export type CifRow = Record<string, string>;

/**
 * One data block: each scalar tag under its own name, and each `loop_` under
 * the prefix its tags share (a trailing `_` or `.` dropped). Every value is a
 * string, and the missing-value markers `.` and `?` are `''`.
 */
export type CifJson = Record<string, string | CifRow[]>;

/**
 * One `data_` block of a CIF.
 */
export interface CifBlock {
  /**
   * The text after `data_`; `''` for tags written before any block header.
   */
  name: string;
  /**
   * Its tags and loops.
   */
  data: CifJson;
}

/**
 * Options of `cifParser` and `parseCifBlocks`.
 */
export interface CifParserOptions {
  /**
   * Where the parser reports what it had to drop or guess: a loop row cut
   * short, a tag with no value, an unclosed quote, a file with several blocks.
   * Any `cheminfo-types` `LightLogger` fits, `console` and a `FifoLogger`
   * included.
   * @default undefined
   */
  logger?: LightLogger;
}
