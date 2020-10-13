import { readFileSync } from 'fs';

import { cifParser } from '..';

describe('cif-parser test', function () {
  let cif = readFileSync(`${__dirname}/test.cif`).toString();
  let parsed = cifParser(cif);
  it('Something to test', function () {
    expect(parsed._cell_angle_gamma).toStrictEqual('90');
  });
});
