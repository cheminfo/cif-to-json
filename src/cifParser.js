/**
 * Parse a CIF (Crystallographic Information File) string into a JSON object.
 * Supports single-quoted, double-quoted, and semicolon-delimited text fields.
 * Handles both classic crystallographic CIF and mmCIF / CCD format (dotted tags
 * like `_chem_comp_atom.atom_id`).
 * @param {string} input - CIF file content as a string.
 * @returns {object} Parsed CIF data. Scalar fields are top-level keys; loop
 *   sections become arrays keyed on the common tag prefix (trailing `_` or `.`
 *   stripped). Each array row uses the full tag name as its property key.
 */
export function cifParser(input) {
  return buildJson(tokenize(input));
}

/**
 * Tokenize CIF content into a flat array of typed tokens.
 * @param {string} input - Raw CIF text to tokenize.
 * @returns {Array<{type: 'data'|'loop'|'tag'|'value', value?: string|null}>} Flat token stream.
 */
function tokenize(input) {
  const tokens = [];
  const lines = input.split(/\r?\n/);

  let inSemicolon = false;
  let semicolonLines = [];

  for (const rawLine of lines) {
    // --- Semicolon-delimited text block ---
    if (inSemicolon) {
      if (rawLine.startsWith(';')) {
        // Closing semicolon: emit the accumulated text
        tokens.push({ type: 'value', value: semicolonLines.join('\n') });
        inSemicolon = false;
        semicolonLines = [];
      } else {
        semicolonLines.push(rawLine);
      }
      continue;
    }

    const line = rawLine.trimEnd();

    if (!line.trim()) continue;
    if (line.trimStart().startsWith('#')) continue;

    // Opening semicolon (must be the very first character of the line)
    if (line.startsWith(';')) {
      inSemicolon = true;
      // Text may start on the same line as the opening semicolon;
      // if the semicolon is alone on its line the remainder is empty — skip it.
      const afterSemi = line.slice(1);
      semicolonLines = afterSemi ? [afterSemi] : [];
      continue;
    }

    // Inline tokenization
    let i = 0;
    while (i < line.length) {
      // Skip whitespace
      while (i < line.length && (line[i] === ' ' || line[i] === '\t')) i++;
      if (i >= line.length) break;

      const ch = line[i];

      // Inline comment
      if (ch === '#') break;

      // Quoted string (single or double)
      if (ch === '"' || ch === "'") {
        const closeIdx = line.indexOf(ch, i + 1);
        if (closeIdx === -1) {
          // Unclosed quote — consume rest of line
          tokens.push({ type: 'value', value: line.slice(i + 1) });
          break;
        }
        tokens.push({ type: 'value', value: line.slice(i + 1, closeIdx) });
        i = closeIdx + 1;
        continue;
      }

      // Unquoted token — read until whitespace or comment
      let end = i;
      while (
        end < line.length &&
        line[end] !== ' ' &&
        line[end] !== '\t' &&
        line[end] !== '#'
      ) {
        end++;
      }
      const token = line.slice(i, end);
      i = end;

      if (/^loop_$/i.test(token)) {
        tokens.push({ type: 'loop' });
      } else if (token.startsWith('data_')) {
        tokens.push({ type: 'data', value: token.slice(5) });
      } else if (token.startsWith('_')) {
        tokens.push({ type: 'tag', value: token });
      } else if (token === '.' || token === '?') {
        // CIF missing / unknown value → empty string (backward-compatible)
        tokens.push({ type: 'value', value: '' });
      } else {
        tokens.push({ type: 'value', value: token });
      }
    }
  }

  // Unclosed semicolon block (malformed CIF) — emit what we have
  if (inSemicolon && semicolonLines.length > 0) {
    tokens.push({ type: 'value', value: semicolonLines.join('\n') });
  }

  return tokens;
}

/**
 * Build a plain JSON object from the token stream.
 * @param {Array<{type: string, value?: string|null}>} tokens - Flat token stream from {@link tokenize}.
 * @returns {object} Parsed CIF data as a plain object.
 */
function buildJson(tokens) {
  const result = {};
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    // data_ header — skip (block name is not surfaced as a key)
    if (token.type === 'data') {
      i++;
      continue;
    }

    if (token.type === 'loop') {
      i++;

      // Collect column headers
      const headers = [];
      while (i < tokens.length && tokens[i].type === 'tag') {
        headers.push(tokens[i].value);
        i++;
      }

      if (headers.length === 0) continue;

      // Determine the shared prefix, stripping a trailing `_` or `.`
      const common = getCommonBeginning(headers).replace(/[_.]$/, '');

      // Collect data rows
      const rows = [];
      while (i < tokens.length && tokens[i].type === 'value') {
        const row = {};
        for (let h = 0; h < headers.length; h++) {
          if (i >= tokens.length || tokens[i].type !== 'value') break;
          row[headers[h]] = tokens[i].value;
          i++;
        }
        if (Object.keys(row).length === headers.length) {
          rows.push(row);
        }
      }

      result[common] = rows;
      continue;
    }

    if (token.type === 'tag') {
      const tag = token.value;
      i++;
      if (i < tokens.length && tokens[i].type === 'value') {
        result[tag] = tokens[i].value;
        i++;
      }
      continue;
    }

    // Stray value token (should not happen in well-formed CIF)
    i++;
  }

  return result;
}

/**
 * Return the longest common prefix shared by all strings.
 * @param {string[]} strings - Array of strings to compare.
 * @returns {string} Longest common prefix.
 */
function getCommonBeginning(strings) {
  if (strings.length === 0) return '';
  let common = '';
  for (let pos = 0; pos < strings[0].length; pos++) {
    const ch = strings[0][pos];
    for (let k = 1; k < strings.length; k++) {
      if (strings[k][pos] !== ch) return common;
    }
    common += ch;
  }
  return common;
}
