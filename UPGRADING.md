# Upgrade Guide

This document describes breaking changes and how to upgrade. For a complete list of changes including minor and patch releases, please refer to the [changelog](CHANGELOG.md).

## 5.0.0

This release drops support of legacy runtime environments ([Level/community#98](https://github.com/Level/community/issues/98)):

- Internet Explorer 11
- Safari 9-11
- Stock Android browser (AOSP).

In browsers, the [`immediate`](https://github.com/calvinmetcalf/immediate) shim for `process.nextTick()` has been replaced with the smaller [`queue-microtask`](https://github.com/feross/queue-microtask), except in streams.
