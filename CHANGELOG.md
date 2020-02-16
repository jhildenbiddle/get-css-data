# Change Log

## 1.7.1

*2020-02-15*

- Restored babel transpilation for ES modules (removed in 1.7.0)

## 1.7.0

*2020-02-12*

- Added support for HTML `<base>` tag (#3)
- Removed babel transpilation for ES modules

## 1.6.3

*2019-01-30*

- Fixed IE9 CORS check

## 1.6.2

*2019-01-09*

- Updated preferred CDN link to jsdelivr.

## 1.6.1

*2018-11-14*

- Fixed bug that prevented IE10 from fetching `<link>` CSS data from external
  domains.

## 1.6.0

*2018-11-12*

- Updated `options.onSuccess` callback to better handle falsey return values
  (e.g. `false`, `null`, `0`, `""`).

## 1.5.0

*2018-11-11*

- Added check to prevent HTML returned from stylesheet 404 redirects from being
  processed as CSS.

## 1.4.0

*2018-09-28*

- Added `options.rootElement` for specifying the root element to traverse for
  `<link>` and `<style>` nodes.

- Added `options.useCSSOM` to determine if CSS data should be collected from
  CSSRule.cssText or Node.textContent values.

## 1.3.2

*2018-05-17*

- Fixed `options.onSuccess` bug that resulted in a return value not being
  processed instead of the original `cssText`.

- Fixed `options.onSuccess` behavior so that it is triggered for each `@import`
  (was only being triggered for `<link>` nodes).

## 1.3.1

*2018-05-16*

- Added `options.onBeforeSend` callback.

- Fixed `@import` bug that caused duplicate requests to be sent when fetching
  multiple imports in the same file.

- Fixed `@import` bug that caused requests to fail when fetching multiple
  imports from different directories in the same file.

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
