# Change Log

## 1.3.2

*2018-05-17*

- Fixed `options.onSuccess` bug that resulted in a return value not being processed instead of the original `cssText`

- Fixed `options.onSuccess` behavior so that it is triggered for each `@import` (was only being triggered for `<link>` nodes)

## 1.3.1

*2018-05-16*

- Added `options.onBeforeSend` callback

- Fixed `@import` bug that caused duplicate requests to be sent when fetching
  multiple imports in the same file

- Fixed `@import` bug that caused requests to fail when fetching multiple
  imports from different directories in the same file

## 1.2.0

*2018-04-23*

- Fixed bug that caused callbacks to be triggered for each `@import` statement
  in each `<link>` or `<style>` node.

## 1.1.4/1.1.5

*2018-04-21*

- Updated README

## 1.1.3

*2018-04-21*

- Updated dev dependencies

- Updated rollup configuration

- Updated README

## 1.1.2

*2018-01-31*

- Updated dev dependencies

- Updated rollup configuration

- Updated README

## 1.1.1

*2018-01-20*

- Updated README

## 1.1.0

*2018-01-18*

- Fixed: style and link nodes that triggered an onError callback due to a failed
  @import would result in an empty string being added to the cssText and
  cssArray arguments of the options.onComplete callback. The original css text
  (with the unresolved @import statement) is now added as expected.

- Updated: An array of nodes is now passed to options.onComplete as the third
  argument. The CSS text for each node is available at the same cssArray index
  (the second argument).

## 1.0.2

*2018-01-17*

- Fixed: onComplete callback now fires when zero elements are matched by
  `options.include`.

## 1.0.1

*2018-01-17*

- Fixed: RegEx detection of @import URLs. Previous RegEx did not account for all
  valid URL characters. New RegEx captures all @import URL characters between
  single or double quotes.

- Updated: unminified dist files now include JSDOC comments. This allows
  documentation to be displayed in IDEs.

## 1.0.0

*2018-01-16*

- Initial release
