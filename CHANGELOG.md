# Change Log

## 1.1.4/5

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

- Updated: An array of nodes is now passed to options.onComplete as the third
  argument. The CSS text for each node is available at the same cssArray index
  (the second argument).

- Fixed: style and link nodes that triggered an onError callback due to a failed
  @import would result in an empty string being added to the cssText and
  cssArray arguments of the options.onComplete callback. The original css text
  (with the unresolved @import statement) is now added as expected.

## 1.0.2

*2018-01-17*

- Fixed: onComplete callback now fire when zero elements are matched by
  `options.include`.

## 1.0.1

*2018-01-17*

- Updated: unminified dist files now include JSDOC comments. This allows
  documentation to be displayed in IDEs.

- Fixed: RegEx detection of @import URLs. Previous RegEx did not account for all
  valid URL characters. New RegEx captures all @import URL characters between
  single or double quotes.

## 1.0.0

*2018-01-16*

- Initial release
