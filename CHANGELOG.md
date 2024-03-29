# Changelog

## [5.0.1] - 2021-10-02

### Fixed

- Bump `levelup` to fix API parity with `abstract-leveldown` ([`77f8f4c`](https://github.com/Level/multileveldown/commit/77f8f4c)) (Vincent Weevers).

## [5.0.0] - 2021-10-01

_If you are upgrading: please see [`UPGRADING.md`](UPGRADING.md)._

### Changed

- **Breaking:** bump `abstract-leveldown` from 6.x to 7.x ([`e36c7dd`](https://github.com/Level/multileveldown/commit/e36c7dd)) (Vincent Weevers)
- **Breaking:** bump `encoding-down` from 6.x to 7.x ([#28](https://github.com/Level/multileveldown/issues/28)) ([`0c1d5d1`](https://github.com/Level/multileveldown/commit/0c1d5d1)) (Vincent Weevers)
- **Breaking:** bump `levelup` from 4.x to 5.x ([#31](https://github.com/Level/multileveldown/issues/31)) ([`7057901`](https://github.com/Level/multileveldown/commit/7057901)) (Vincent Weevers)
- Bump `level-compose` from 0.0.2 to 1.x ([#27](https://github.com/Level/multileveldown/issues/27)) ([`6bc5a9f`](https://github.com/Level/multileveldown/commit/6bc5a9f)) (Vincent Weevers)
- Enable strict mode ([`8e103fa`](https://github.com/Level/multileveldown/commit/8e103fa)) (Vincent Weevers)

### Added

- Add `db.getMany(keys)` ([`ff1ba48`](https://github.com/Level/multileveldown/commit/ff1ba48)) (Vincent Weevers)
- Add manifest ([`b331481`](https://github.com/Level/multileveldown/commit/b331481)) (Vincent Weevers)

### Fixed

- Fix `for await...of db.iterator()` ([`fc3f3d5`](https://github.com/Level/multileveldown/commit/fc3f3d5)) (Vincent Weevers)
- Optimize `db.clear()` ([`47e0137`](https://github.com/Level/multileveldown/commit/47e0137)) (Vincent Weevers).

## [4.0.0] - 2021-04-03

### Changed

- **Breaking:** drop support of node 8 ([`5988dcc`](https://github.com/Level/multileveldown/commit/5988dcc)) (Vincent Weevers)
- **Breaking:** modernize syntax ([#22](https://github.com/Level/multileveldown/issues/22)) ([`e7c67e2`](https://github.com/Level/multileveldown/commit/e7c67e2)) (Robert Nagy). Drops support of old browsers that don't support `const` and `let`.

### Added

- Allow passing proxy to `createRpcStream()` ([#24](https://github.com/Level/multileveldown/issues/24)) ([`77849a7`](https://github.com/Level/multileveldown/commit/77849a7)) ([Level/party#29](https://github.com/Level/party/issues/29)) (Robert Nagy)
- Include `abstract-leveldown` tests ([#17](https://github.com/Level/multileveldown/issues/17)) ([`82511ed`](https://github.com/Level/multileveldown/commit/82511ed)) (Vincent Weevers).

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

## [1.0.0] - 2015-04-24

:seedling: Initial release.

[5.0.1]: https://github.com/Level/multileveldown/releases/tag/v5.0.1

[5.0.0]: https://github.com/Level/multileveldown/releases/tag/v5.0.0

[4.0.0]: https://github.com/Level/multileveldown/releases/tag/v4.0.0

[3.0.0]: https://github.com/Level/multileveldown/releases/tag/v3.0.0

[2.3.1]: https://github.com/Level/multileveldown/releases/tag/v2.3.1

[2.3.0]: https://github.com/Level/multileveldown/releases/tag/v2.3.0

[2.2.0]: https://github.com/Level/multileveldown/releases/tag/v2.2.0

[2.1.1]: https://github.com/Level/multileveldown/releases/tag/v2.1.1

[2.1.0]: https://github.com/Level/multileveldown/releases/tag/v2.1.0

[2.0.1]: https://github.com/Level/multileveldown/releases/tag/v2.0.1

[2.0.0]: https://github.com/Level/multileveldown/releases/tag/v2.0.0

[1.1.2]: https://github.com/Level/multileveldown/releases/tag/v1.1.2

[1.1.1]: https://github.com/Level/multileveldown/releases/tag/v1.1.1

[1.1.0]: https://github.com/Level/multileveldown/releases/tag/v1.1.0

[1.0.3]: https://github.com/Level/multileveldown/releases/tag/v1.0.3

[1.0.2]: https://github.com/Level/multileveldown/releases/tag/v1.0.2

[1.0.1]: https://github.com/Level/multileveldown/releases/tag/v1.0.1

[1.0.0]: https://github.com/Level/multileveldown/releases/tag/v1.0.0
