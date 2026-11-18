# Changelog

## [2.1.0](https://github.com/cheminfo/cif-to-json/compare/v2.0.0...v2.1.0) (2026-11-18)


### Features

* migrate to TypeScript, read data blocks apart and log what is dropped ([1810105](https://github.com/cheminfo/cif-to-json/commit/1810105f1b3e2fcd20e86d871a1bda8b5cef4f89))


### Bug Fixes

* close a quoted value only at a quote followed by whitespace ([fb698e4](https://github.com/cheminfo/cif-to-json/commit/fb698e4c56e3a9f58437ad119a9d2c75c0a16d73))

## [2.0.0](https://github.com/cheminfo/cif-to-json/compare/v1.0.1...v2.0.0) (2026-05-18)


### ⚠ BREAKING CHANGES

* package is now ESM-only; consumers using require() must migrate to import, or run Node.js >= 20.19, >= 22.12, or any 24.x or later.

### Features

* add moleculeFromCif and moleculeFromCifJson with stereochemistry support ([dcd8048](https://github.com/cheminfo/cif-to-json/commit/dcd8048c065bfe5b054f207381c21d681d139fad))
* migrate to ESM, vitest, ESLint 9, and split cifParser module ([b307686](https://github.com/cheminfo/cif-to-json/commit/b307686f93ef0002206d12e24ce2dc60e532dce8))
* set version to 0.1.0 ([931d52f](https://github.com/cheminfo/cif-to-json/commit/931d52fcb3c1b86a179825b8d5af2b249d25a2f3))
* set version to 0.2.0 ([dc3b396](https://github.com/cheminfo/cif-to-json/commit/dc3b396a08081ce8011f23083411309e63a8f2fd))


### Bug Fixes

* export module in package.json ([9a3b747](https://github.com/cheminfo/cif-to-json/commit/9a3b747d2f2500b75c9f1048ba75ebcfd769a88c))
* workflow was release isoterm-analysis ([d40d7b3](https://github.com/cheminfo/cif-to-json/commit/d40d7b349dc2116542092196e9a545372e41bc73))

## 1.0.0 (2020-10-13)


### Features

* set version to 0.1.0 ([931d52f](https://www.github.com/cheminfo/cif-to-json/commit/931d52fcb3c1b86a179825b8d5af2b249d25a2f3))
* set version to 0.2.0 ([dc3b396](https://www.github.com/cheminfo/cif-to-json/commit/dc3b396a08081ce8011f23083411309e63a8f2fd))


### Bug Fixes

* export module in package.json ([9a3b747](https://www.github.com/cheminfo/cif-to-json/commit/9a3b747d2f2500b75c9f1048ba75ebcfd769a88c))
