import { readFileSync } from 'fs';

import { cifParser } from '..';

describe('cif-to-json test', () => {
  let cif = readFileSync(`${__dirname}/test.cif`).toString();
  let parsed = cifParser(cif);
  it('Test some fields', () => {
    expect(parsed._cell_angle_gamma).toStrictEqual('90');
    expect(parsed._journal_paper_doi).toBe('10.1021/om0102302');
    expect(parsed._atom_site).toHaveLength(143);
    expect(parsed._publ_author_name).toHaveLength(4);
  });
});
