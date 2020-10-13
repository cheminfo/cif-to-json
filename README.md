# cif-parser

[![NPM version][npm-image]][npm-url]
[![build status][ci-image]][ci-url]
[![npm download][download-image]][download-url]

Parse CIF files.

## Installation

`$ npm install cif-parser`

## [API Documentation](https://cheminfo.github.io/cif-parser/)

## Example

```js
import { cifParser } from 'cif-parser';

result = cifParser(cifString);
```

The `result` will be an object in which

- the loops (`loop_`) are lists of objects. The main loop `_atom_site` might look like

```javascript
 {
  _atom_site_label: 'In1',
  _atom_site_type_symbol: 'In',
  _atom_site_fract_x: '0.30475(3)',
  _atom_site_fract_y: '0.21073(1)',
  _atom_site_fract_z: '0.21076(2)'
},
```

- all headers are in the output with the original tag, from the CIF, e.g.,

```javascript
{
  _cell_volume: '2999.477';
}
```

## License

[MIT](./LICENSE)

[npm-image]: https://img.shields.io/npm/v/cif-parser.svg
[npm-url]: https://www.npmjs.com/package/cif-parser
[ci-image]: https://github.com/cheminfo/cif-parser/workflows/Node.js%20CI/badge.svg?branch=master
[ci-url]: https://github.com/cheminfo/cif-parser/actions?query=workflow%3A%22Node.js+CI%22
[download-image]: https://img.shields.io/npm/dm/cif-parser.svg
[download-url]: https://www.npmjs.com/package/cif-parser
