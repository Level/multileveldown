# Changelog

## [2.3.1] - 2018-01-31

### Fixed

- Bump protobuf ([`6fb4fdd`](https://github.com/Level/multileveldown/commit/6fb4fdd)) ([**@mafintosh**](https://github.com/mafintosh))

## [2.3.0] - 2017-02-03

### Added

- Support `preput`, `predel`, `prebatch` ([`0012276`](https://github.com/Level/multileveldown/commit/0012276)) ([**@mafintosh**](https://github.com/mafintosh))

## [2.2.0] - 2016-06-02

### Added

- Add `opts.readonly` ([`6792190`](https://github.com/Level/multileveldown/commit/6792190)) ([**@mafintosh**](https://github.com/mafintosh))

### Fixed

- Fix reconnect example ([#7](https://github.com/Level/multileveldown/issues/7)) ([**@jameskyburz**](https://github.com/jameskyburz))

## [2.1.1] - 2016-01-10

### Fixed

- Fix iterator forward ([`111f37c`](https://github.com/Level/multileveldown/commit/111f37c)) ([**@mafintosh**](https://github.com/mafintosh))

## [2.1.0] - 2016-01-10

### Added

- Add forwarding API to fix `level-party` edge-case ([`ae32a1f`](https://github.com/Level/multileveldown/commit/ae32a1f)) ([**@mafintosh**](https://github.com/mafintosh))

## [2.0.1] - 2016-01-09

### Fixed

- Always check flush ([`f7188c1`](https://github.com/Level/multileveldown/commit/f7188c1)) ([**@mafintosh**](https://github.com/mafintosh))

## [2.0.0] - 2016-01-09

### Changed

- Rewrite using `length-prefixed-stream` ([`d51b50d`](https://github.com/Level/multileveldown/commit/d51b50d)) ([**@mafintosh**](https://github.com/mafintosh))

## [1.1.2] - 2015-06-10

### Fixed

- Add correct condition in iterator end on server ([#3](https://github.com/Level/multileveldown/issues/3)) ([**@jcrugzz**](https://github.com/jcrugzz))

## [1.1.1] - 2015-05-21

### Fixed

- Bump `pbs` ([`6e30a3a`](https://github.com/Level/multileveldown/commit/6e30a3a)) ([**@mafintosh**](https://github.com/mafintosh))

## [1.1.0] - 2015-05-04

### Added

- Add `ref` option to rpc to dereference socket from event loop ([`3fdca68`](https://github.com/Level/multileveldown/commit/3fdca68)) ([**@mafintosh**](https://github.com/mafintosh))

## [1.0.3] - 2015-05-04

### Fixed

- Add reverse and nexttick iterator end ([`46f4924`](https://github.com/Level/multileveldown/commit/46f4924)) ([**@mafintosh**](https://github.com/mafintosh))

## [1.0.2] - 2015-04-25

### Fixed

- Cleanup iterators on client stream end ([`79bccdb`](https://github.com/Level/multileveldown/commit/79bccdb)) ([**@mafintosh**](https://github.com/mafintosh))
- Behave as regular `leveldown` on close ([`d1978c5`](https://github.com/Level/multileveldown/commit/d1978c5)) ([**@mafintosh**](https://github.com/mafintosh))

## [1.0.1] - 2015-04-25

### Fixed

- Destroy encoder on close ([`23e6ab2`](https://github.com/Level/multileveldown/commit/23e6ab2)) ([**@mafintosh**](https://github.com/mafintosh))

## 1.0.0 - 2015-04-24

:seedling: Initial release.

[2.3.1]: https://github.com/Level/multileveldown/compare/v2.3.0...v2.3.1

[2.3.0]: https://github.com/Level/multileveldown/compare/v2.2.0...v2.3.0

[2.2.0]: https://github.com/Level/multileveldown/compare/v2.1.1...v2.2.0

[2.1.1]: https://github.com/Level/multileveldown/compare/v2.1.0...v2.1.1

[2.1.0]: https://github.com/Level/multileveldown/compare/v2.0.1...v2.1.0

[2.0.1]: https://github.com/Level/multileveldown/compare/v2.0.0...v2.0.1

[2.0.0]: https://github.com/Level/multileveldown/compare/v1.1.2...v2.0.0

[1.1.2]: https://github.com/Level/multileveldown/compare/v1.1.1...v1.1.2

[1.1.1]: https://github.com/Level/multileveldown/compare/v1.1.0...v1.1.1

[1.1.0]: https://github.com/Level/multileveldown/compare/v1.0.3...v1.1.0

[1.0.3]: https://github.com/Level/multileveldown/compare/v1.0.2...v1.0.3

[1.0.2]: https://github.com/Level/multileveldown/compare/v1.0.1...v1.0.2

[1.0.1]: https://github.com/Level/multileveldown/compare/v1.0.0...v1.0.1
