import type { LightLogger } from 'cheminfo-types';

/**
 * What a token is.
 */
export type TokenKind = 'data' | 'loop' | 'reserved' | 'tag' | 'value';

/**
 * One word of a CIF, with the line it starts on.
 */
export interface Token {
  kind: TokenKind;
  /**
   * The block name, the tag, the value, or the reserved word itself.
   */
  value: string;
  /**
   * The line it starts on, from 1.
   */
  line: number;
}

/**
 * Split a CIF into tokens by the CIF 1.1 rules: a quote closes a value only
 * when whitespace or the end of the line follows it, a `#` opens a comment
 * only where a token could start, and a text field runs between two lines
 * starting with `;`.
 * @param input - CIF file content.
 * @param logger - Where an unclosed quote or text field is reported.
 * @returns The tokens, in file order.
 */
export function tokenize(input: string, logger?: LightLogger): Token[] {
  const tokens: Token[] = [];
  const lines = input.split(/\r?\n/);
  let field: string[] | null = null;
  let fieldLine = 0;

  for (let index = 0; index < lines.length; index++) {
    const rawLine = lines[index] ?? '';
    if (field !== null) {
      if (rawLine.startsWith(';')) {
        tokens.push({
          kind: 'value',
          value: field.join('\n'),
          line: fieldLine,
        });
        field = null;
      } else {
        field.push(rawLine);
      }
      continue;
    }
    const lineNumber = index + 1;
    if (rawLine.startsWith(';')) {
      // Text may start on the opening line itself.
      const first = rawLine.slice(1).trimEnd();
      field = first ? [first] : [];
      fieldLine = lineNumber;
      continue;
    }
    readLine(rawLine.trimEnd(), lineNumber, tokens, logger);
  }

  if (field !== null) {
    logger?.warn(
      { line: fieldLine },
      `The text field opened on line ${fieldLine} is not closed; it runs to the end of the file.`,
    );
    tokens.push({ kind: 'value', value: field.join('\n'), line: fieldLine });
  }
  return tokens;
}

/**
 * Read the tokens of one line outside any text field.
 * @param line - The line, without trailing whitespace.
 * @param lineNumber - Its number, from 1.
 * @param tokens - Where the tokens go.
 * @param logger - Where an unclosed quote is reported.
 */
function readLine(
  line: string,
  lineNumber: number,
  tokens: Token[],
  logger?: LightLogger,
): void {
  let index = 0;
  while (index < line.length) {
    while (isBlank(line[index])) index++;
    if (index >= line.length) return;
    const char = line[index];
    if (char === '#') return;

    if (char === '"' || char === "'") {
      const close = closingQuote(line, index);
      if (close === -1) {
        logger?.warn(
          { line: lineNumber },
          `The quoted value on line ${lineNumber} is not closed; it runs to the end of the line.`,
        );
        tokens.push({
          kind: 'value',
          value: line.slice(index + 1),
          line: lineNumber,
        });
        return;
      }
      tokens.push({
        kind: 'value',
        value: line.slice(index + 1, close),
        line: lineNumber,
      });
      index = close + 1;
      continue;
    }

    let end = index;
    while (end < line.length && !isBlank(line[end])) end++;
    tokens.push(classify(line.slice(index, end), lineNumber));
    index = end;
  }
}

/**
 * Tell what an unquoted word is.
 * @param word - The word.
 * @param line - The line it is on.
 * @returns Its token.
 */
function classify(word: string, line: number): Token {
  if (/^loop_$/i.test(word)) return { kind: 'loop', value: word, line };
  if (/^data_/i.test(word)) return { kind: 'data', value: word.slice(5), line };
  if (/^(?:save_.*|global_|stop_)$/i.test(word)) {
    return { kind: 'reserved', value: word, line };
  }
  if (word.startsWith('_')) return { kind: 'tag', value: word, line };
  if (word === '.' || word === '?') return { kind: 'value', value: '', line };
  return { kind: 'value', value: word, line };
}

/**
 * Find where a quoted value ends: at a quote followed by whitespace or the end
 * of the line, so `'O'Daniel, H'` and `'Bour\'ee, F.'` are one value each.
 * @param line - The line, without trailing whitespace.
 * @param start - Index of the opening quote.
 * @returns Index of the closing quote, or -1 when the value is unclosed.
 */
function closingQuote(line: string, start: number): number {
  const quote = line[start];
  for (let index = start + 1; index < line.length; index++) {
    if (
      line[index] === quote &&
      (index + 1 === line.length || isBlank(line[index + 1]))
    ) {
      return index;
    }
  }
  return -1;
}

/**
 * Whether a character separates tokens.
 * @param char - The character, or `undefined` past the end of the line.
 * @returns `true` for a space or a tab.
 */
function isBlank(char: string | undefined): boolean {
  return char === ' ' || char === '\t';
}
