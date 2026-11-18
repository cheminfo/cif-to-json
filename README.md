# cif-to-json

[![NPM version][npm-image]][npm-url]
[![build status][ci-image]][ci-url]
[![npm download][download-image]][download-url]

Parse CIF (Crystallographic Information File) files.

## Installation

`$ npm install cif-to-json`

## [API Documentation](https://cheminfo.github.io/cif-to-json/)

## Example

```js
import { cifParser } from 'cif-to-json';

const result = cifParser(cifString);
```

`cifParser` reads the file's first data block. Each loop (`loop_`) is an array
of rows under the prefix its tags share, every row keyed on the full tags. The
main loop `_atom_site` holds rows such as:

```js
const row = {
  _atom_site_label: 'In1',
  _atom_site_type_symbol: 'In',
  _atom_site_fract_x: '0.30475(3)',
  _atom_site_fract_y: '0.21073(1)',
  _atom_site_fract_z: '0.21076(2)',
};
```

Every other tag is a key of its own, with its value as a string:
`result._cell_volume` is `'2999.477'`.

Values are read by the CIF 1.1 rules: a quoted value ends only at a quote
followed by whitespace, so `'O'Daniel, H'` reads as `O'Daniel, H`, and a `#`
opens a comment only where a value could start, so `C#N` stays one value. The
missing-value markers `.` and `?` become empty strings.

### Several data blocks

`parseCifBlocks` reads every block, each apart:

```js
import { parseCifBlocks } from 'cif-to-json';

for (const { name, data } of parseCifBlocks(cifString)) {
  console.log(name, data._cell_volume);
}
```

### What the parser had to drop

Both functions take a `logger`, any `LightLogger` from `cheminfo-types`
(`console`, a `FifoLogger`). It hears, with the line each comes from, what was
dropped (a loop row cut short, a tag with no value) as an error, and what
changes how the result reads (a file with several blocks, an unclosed quote, a
repeated tag, a save frame) as a warning.

```js
import { FifoLogger } from 'fifo-logger';

const logger = new FifoLogger();
const result = cifParser(cifString, { logger });
console.log(logger.getLogs());
```

### Chemical components

`moleculeFromCif(cifText, Molecule)` builds an OpenChemLib molecule from one
block of the wwPDB Chemical Component Dictionary, with its ideal coordinates,
so the stereochemistry is in the molecule's ID code. `moleculeFromCifJson`
does the same from one parsed block, so every entry of `components.cif` is
read with `parseCifBlocks`. Both return `null` for an entry that is not a small
molecule, and say why to the `logger` of their third argument. `openchemlib` is
an optional peer dependency.

```js
import { Molecule } from 'openchemlib';
import { moleculeFromCifJson, parseCifBlocks } from 'cif-to-json';

for (const { data } of parseCifBlocks(componentsCif)) {
  const component = moleculeFromCifJson(data, Molecule);
  if (component) console.log(component.code, component.molecule.getIDCode());
}
```

## License

[MIT](./LICENSE)

[npm-image]: https://img.shields.io/npm/v/cif-to-json.svg
[npm-url]: https://www.npmjs.com/package/cif-to-json
[ci-image]: https://github.com/cheminfo/cif-to-json/workflows/Node.js%20CI/badge.svg?branch=main
[ci-url]: https://github.com/cheminfo/cif-to-json/actions?query=workflow%3A%22Node.js+CI%22
[download-image]: https://img.shields.io/npm/dm/cif-to-json.svg
[download-url]: https://www.npmjs.com/package/cif-to-json
