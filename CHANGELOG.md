# Changelog

## [3.0.0] - 2019-11-04

### Changed

- Move repository from [**@mafintosh**](https://github.com/mafintosh) to [**@Level**](https://github.com/Level) ([`45b257c`](https://github.com/Level/multileveldown/commit/45b257c)) ([**@mafintosh**](https://github.com/mafintosh), [**@vweevers**](https://github.com/vweevers))
- **Breaking:** upgrade to latest Level modules ([#15](https://github.com/Level/multileveldown/issues/15)) ([**@vweevers**](https://github.com/vweevers)):
  - Mainly to support node 10, 12 and future. Also includes latest `memdown` (a devDependency) which now internally stores keys & values as Buffers, making it more reliable as a `leveldown` replacement in tests
  - Support an input `db` that isn't `level` (may or may not have `levelup`, `encoding-down`, `deferred-leveldown` layers, and may have additional layers)
  - Expose all methods that `level-party` needs on the `multileveldown` client, so that `level-party` doesn't have to reach down (e.g. `db.db`)
  - Support `subleveldown` on `level-party`
  - Support `subleveldown` on `multileveldown` client (i.e. for client-side sublevels)
  - Support `multileveldown` server on `subleveldown` (i.e. to expose only a sublevel to client)

### Added

- Add `CHANGELOG.md`, `CONTRIBUTORS.md`, `hallmark` ([`7ded891`](https://github.com/Level/multileveldown/commit/7ded891)) ([**@vweevers**](https://github.com/vweevers))
- Add test tools and `engines.node` ([`d50a9a5`](https://github.com/Level/multileveldown/commit/d50a9a5)) ([**@vweevers**](https://github.com/vweevers))

### Removed

- **Breaking:** drop node &lt; 8
- **Breaking:** drop support of (at least) `deferred-leveldown` &lt; 2.0.0, `levelup` &lt; 2.0.0

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

[3.0.0]: https://github.com/Level/multileveldown/compare/v2.3.1...v3.0.0

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
