'use strict';

const cifParser = require('..');
const FS = require('fs');


describe('cif-parser test', function () {

    let cif = FS.readFileSync(__dirname + '/test.cif').toString();
    let parsed = cifParser.parse(cif);
    it('Something to test', function () {
        parsed._cell_angle_gamma.should.be.equal('90');
    });
});
