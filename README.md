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

[npm-image]: https://img.shields.io/npm/v/cif-to-json.svg
[npm-url]: https://www.npmjs.com/package/cif-to-json
[ci-image]: https://github.com/cheminfo/cif-to-json/workflows/Node.js%20CI/badge.svg?branch=master
[ci-url]: https://github.com/cheminfo/cif-to-json/actions?query=workflow%3A%22Node.js+CI%22
[download-image]: https://img.shields.io/npm/dm/cif-to-json.svg
[download-url]: https://www.npmjs.com/package/cif-to-json
