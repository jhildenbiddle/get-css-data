# Change Log

## 1.0.0 - 2018-01-16

**Added**

- Initial release

## 1.0.1 - 2018-01-17

**Fixed**

- RegEx detection of @import URLs. Previous RegEx did not account for all valid
  URL characters. New RegEx captures all @import URL characters between single
  or double quotes.
- Unminified /dist files now include JSDOC comments from /src. This allows
  documentation to be displayed in IDEs.

## 1.0.2 - 2018-01-17

**Fixed**

- onComplete callback now fires when zero elements are matched by 'include'.
