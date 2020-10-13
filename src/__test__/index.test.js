import { readFileSync } from 'fs';

import { cifParser } from '..';

describe('cif-parser test', function () {
  let cif = readFileSync(`${__dirname}/test.cif`).toString();
  let parsed = cifParser(cif);
  it('Test some fields', function () {
    expect(parsed._cell_angle_gamma).toStrictEqual('90');
    expect(parsed._journal_paper_doi).toBe('10.1021/om0102302');
    expect(parsed._atom_site).toHaveLength(143);
    expect(parsed._publ_author_name).toHaveLength(4);
  });
});
