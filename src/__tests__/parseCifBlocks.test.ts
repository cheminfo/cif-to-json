import { FifoLogger } from 'fifo-logger';
import { expect, test } from 'vitest';

import { cifParser, parseCifBlocks } from '../cifParser.ts';

const TWO_BLOCKS = `data_quartz
_cell.length_a 4.913
loop_
_atom.label
_atom.symbol
Si1 Si
O1 O
data_calcite
_cell.length_a 4.990
`;

/**
 * What a logger received, without the ids and times.
 * @param logger - The logger.
 * @returns Each entry's level, message and meta.
 */
function entries(logger: FifoLogger) {
  return logger.getLogs().map(({ levelLabel, message, meta }) => ({
    levelLabel,
    message,
    meta,
  }));
}

test('every block is read apart, under its name', () => {
  const blocks = parseCifBlocks(TWO_BLOCKS);

  expect(blocks).toStrictEqual([
    {
      name: 'quartz',
      data: {
        '_cell.length_a': '4.913',
        _atom: [
          { '_atom.label': 'Si1', '_atom.symbol': 'Si' },
          { '_atom.label': 'O1', '_atom.symbol': 'O' },
        ],
      },
    },
    { name: 'calcite', data: { '_cell.length_a': '4.990' } },
  ]);
});

test('cifParser reads the first block only, and says so', () => {
  const logger = new FifoLogger();
  const data = cifParser(TWO_BLOCKS, { logger });

  expect(data['_cell.length_a']).toBe('4.913');
  expect(data._atom).toHaveLength(2);
  expect(entries(logger)).toStrictEqual([
    {
      levelLabel: 'warn',
      message:
        'The file holds 2 data blocks; only the first, "quartz", was read. Read them all with parseCifBlocks.',
      meta: { blocks: 2 },
    },
  ]);
});

test('tags before any header form a block with no name', () => {
  expect(parseCifBlocks('_a 1\n_b 2')).toStrictEqual([
    { name: '', data: { _a: '1', _b: '2' } },
  ]);
  expect(parseCifBlocks('# only a comment\n')).toStrictEqual([]);
  expect(cifParser('')).toStrictEqual({});
});

test('a single block logs nothing', () => {
  const logger = new FifoLogger();
  cifParser('data_x\n_a 1', { logger });

  expect(logger.getLogs()).toStrictEqual([]);
});

test('what had to be dropped is logged as an error, with its line', () => {
  const logger = new FifoLogger();
  const data = cifParser(
    `data_x
loop_
_atom.label
_atom.symbol
Si1 Si
O1
_cell.volume
loop_
_symmetry.operation
`,
    { logger },
  );

  expect(data).toStrictEqual({
    _atom: [{ '_atom.label': 'Si1', '_atom.symbol': 'Si' }],
    '_symmetry.operation': [],
  });
  expect(entries(logger)).toStrictEqual([
    {
      levelLabel: 'error',
      message:
        'The loop _atom on line 2 ends on a row of 1 values for 2 tags; that row was dropped.',
      meta: { block: 'x', line: 2, loop: '_atom' },
    },
    {
      levelLabel: 'error',
      message: '_cell.volume on line 7 has no value; it was dropped.',
      meta: { block: 'x', line: 7, tag: '_cell.volume' },
    },
  ]);
});

test('a value with no tag and a loop with no tags are dropped', () => {
  const logger = new FifoLogger();
  const data = cifParser('data_x\n_a 1\nstray\nloop_', { logger });

  expect(data).toStrictEqual({ _a: '1' });
  expect(entries(logger)).toStrictEqual([
    {
      levelLabel: 'error',
      message: 'The value "stray" on line 3 belongs to no tag; it was dropped.',
      meta: { block: 'x', line: 3 },
    },
    {
      levelLabel: 'error',
      message: 'The loop_ on line 4 has no tags; it was dropped.',
      meta: { block: 'x', line: 4 },
    },
  ]);
});

test('unclosed quotes and text fields are read to their end, with a warning', () => {
  const logger = new FifoLogger();
  const data = cifParser("data_x\n_a 'open\n_b\n;never\nclosed", { logger });

  expect(data).toStrictEqual({ _a: 'open', _b: 'never\nclosed' });
  expect(entries(logger).map(({ message }) => message)).toStrictEqual([
    'The quoted value on line 2 is not closed; it runs to the end of the line.',
    'The text field opened on line 4 is not closed; it runs to the end of the file.',
  ]);
});

test('a repeated tag keeps its last value, with a warning', () => {
  const logger = new FifoLogger();
  const data = cifParser('data_x\n_a 1\n_a 2', { logger });

  expect(data).toStrictEqual({ _a: '2' });
  expect(entries(logger)).toStrictEqual([
    {
      levelLabel: 'warn',
      message: '_a appears again on line 3; this last one is kept.',
      meta: { block: 'x', line: 3, key: '_a' },
    },
  ]);
});

test('save frames are not read, and that is said once', () => {
  const logger = new FifoLogger();
  const data = cifParser('data_x\nsave_one\n_a 1\nsave_\nsave_two\nsave_', {
    logger,
  });

  expect(data).toStrictEqual({ _a: '1' });
  expect(entries(logger)).toStrictEqual([
    {
      levelLabel: 'warn',
      message:
        "save_one on line 2 is not read: save frames and global blocks are not supported, and the tags inside them are read as their block's own.",
      meta: { block: 'x', line: 2, word: 'save_one' },
    },
  ]);
});
