# Change Log

## 2.1.0

*2022-04-21*

- Add support for `<link>` elements using data URIs

## 2.0.2

*2021-03-16*

- Fix empty `<link>` stylesheet triggering `onError()` callback

## 2.0.1

*2021-01-30*

- Update version number in CDN URLs

## 2.0.0

*2021-01-30*

- Remove nodes skipped during `onSuccess()` from `onComplete()` arguments
- Support XHR status < 400 for `file://` URLs
- Remove distributable files from version control

## 1.9.1

*2020-11-20*

- Fix detection of SVG `<style>` nodes

## 1.9.0

*2020-10-30*

- Add support for `file://` URLs from local files on supporting browsers

## 1.8.0

*2020-04-26*

- Add `options.skipDisabled` which determines if disabled stylesheets will be
  skipped while collecting CSS data.

## 1.7.1

*2020-02-15*

- Restore babel transpilation for ES modules (removed in 1.7.0)

## 1.7.0

*2020-02-12*

- Add support for HTML `<base>` tag (#3)
- Remove babel transpilation for ES modules

## 1.6.3

*2019-01-30*

- Fix IE9 CORS check

## 1.6.2

*2019-01-09*

- Update preferred CDN link to jsdelivr.

## 1.6.1

*2018-11-14*

- Fix bug that prevented IE10 from fetching `<link>` CSS data from external
  domains.

## 1.6.0

*2018-11-12*

- Update `options.onSuccess` callback to better handle falsey return values
  (e.g. `false`, `null`, `0`, `""`).

## 1.5.0

*2018-11-11*

- Add check to prevent HTML returned from stylesheet 404 redirects from being
  processed as CSS.

## 1.4.0

*2018-09-28*

- Add `options.rootElement` for specifying the root element to traverse for
  `<link>` and `<style>` nodes.

- Add `options.useCSSOM` to determine if CSS data should be collected from
  CSSRule.cssText or Node.textContent values.

## 1.3.2

*2018-05-17*

- Fix `options.onSuccess` bug that resulted in a return value not being
  processed instead of the original `cssText`.

- Fix `options.onSuccess` behavior so that it is triggered for each `@import`
  (was only being triggered for `<link>` nodes).

## 1.3.1

*2018-05-16*

- Add `options.onBeforeSend` callback.

- Fix `@import` bug that caused duplicate requests to be sent when fetching
  multiple imports in the same file.

- Fix `@import` bug that caused requests to fail when fetching multiple
  imports from different directories in the same file.

## 1.2.0

*2018-04-23*

- Fix bug that caused callbacks to be triggered for each `@import` statement
  in each `<link>` or `<style>` node.

## 1.1.4/1.1.5

*2018-04-21*

- Update README

## 1.1.3

*2018-04-21*

- Update dev dependencies

- Update rollup configuration

- Update README

## 1.1.2

*2018-01-31*

- Update dev dependencies

- Update rollup configuration

- Update README

## 1.1.1

*2018-01-20*

- Update README

## 1.1.0

*2018-01-18*

- Fix: style and link nodes that triggered an onError callback due to a failed
  @import would result in an empty string being added to the cssText and
  cssArray arguments of the options.onComplete callback. The original css text
  (with the unresolved @import statement) is now added as expected.

- Update: An array of nodes is now passed to options.onComplete as the third
  argument. The CSS text for each node is available at the same cssArray index
  (the second argument).

## 1.0.2

*2018-01-17*

- Fix: onComplete callback now fires when zero elements are matched by
  `options.include`.

## 1.0.1

*2018-01-17*

- Fix: RegEx detection of @import URLs. Previous RegEx did not account for all
  valid URL characters. New RegEx captures all @import URL characters between
  single or double quotes.

- Update: unminified dist files now include JSDOC comments. This allows
  documentation to be displayed in IDEs.

## 1.0.0

*2018-01-16*

- Initial release
