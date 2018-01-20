# get-css-data

[![NPM](https://img.shields.io/npm/v/get-css-data.svg?style=flat-square)](https://www.npmjs.com/package/get-css-data)
[![Build Status](https://img.shields.io/travis/jhildenbiddle/get-css-data.svg?style=flat-square)](https://travis-ci.org/jhildenbiddle/get-css-data)
[![Codacy grade](https://img.shields.io/codacy/grade/57eb5b1190054035bbc78ba24868742e.svg?style=flat-square)](https://www.codacy.com/app/jhildenbiddle/get-css-data?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=jhildenbiddle/get-css-data&amp;utm_campaign=Badge_Grade)
[![Codecov](https://img.shields.io/codecov/c/github/jhildenbiddle/get-css-data.svg?style=flat-square)](https://codecov.io/gh/jhildenbiddle/get-css-data)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://github.com/jhildenbiddle/get-css-data/blob/master/LICENSE)

A small (< 1.5k min+gzip), dependency-free micro-library for collecting stylesheet data.

## Features

- Collect CSS data for all `<link>` and `<style>` nodes or only those specified
- Handles absolute and relative CSS `@import` rules
- Inspect, modify and/or filter individual node CSS data
- Access CSS data as concatenated string or an array of per-node data in DOM order
- UMD and ES6 module available
- Compatible with modern and legacy browsers (IE9+)

## Installation

NPM:

```shell
npm install get-css-data
```

Git:

```shell
git clone https://github.com/jhildenbiddle/get-css-data.git
```

CDN ([unpkg.com](https://unpkg.com/)):

```html
<!-- ES5 in file.html (latest v1.x.x) -->
<script src="https://unpkg.com/get-css-data@1"></script>
<script>
  getCssData(...);
</script>
```

```html
<!-- ES6 module in file.html (latest v1.x.x) -->
<script type="module">
  import getCssData from 'https://unpkg.com/get-css-data@1/dist/get-css-data.esm.min.js';
  getCssData(...);
</script>
```

```javascript
// ES6 module in file.js (latest v1.x.x)
import getCssData from 'https://unpkg.com/get-css-data@1/dist/get-css-data.esm.min.js';
getCssData(...);
```

## Example

HTML:

```html
<!-- file.html -->
<head>
  <link rel="stylesheet" href="style1.css">
  <style>
    @import "style2.css";
    p { color: blue; }
  </style>
</head>
```

CSS:

```css
/* style1.css */
p { color: red; }
```

```css
/* style2.css */
p { color: green; }
```

JavaScript (see [Usage](#usage) for additional options and details)

```javascript
getCss({
  // Triggered when a node or @import is processed
  onSuccess(cssText, node, url) {
    // * Asynchronous, so order is not guaranteed
    // 1: <style> before @import resolved
    // 2: <link>
    // 3: <style> after @import resolved
    console.log(cssText);
  },
  // Triggered for each XHR error
  onError(xhr, node, url) {
    // ...
  },
  // Triggered when all nodes have been processed
  onComplete(cssText, cssArray, nodeArray) {
    console.log(cssText); // 4
    console.log(cssArray); // 5 (in DOM order)
    console.log(nodeArray); // 6 (in DOM order)
  }
});

// 1 => '@import "style2.css";p { color: blue; }"
// 2 => 'p { color: red; }'
// 3 => 'p { color: green; }p { color: blue; }"
// 4 => 'p { color: red; }p { color: green; }p { color: blue; }'
// 5 => ['p { color: red; }', 'p { color: green; }p { color: blue; }']
// 6 => [<linkElement>, <styleElement>]
```

## Usage

```javascript
getCssData(options);
```

### options

The options object.

- Type: `object`

Example

```javascript
getCssData({
  include: ... ,
  exclude: ... ,
  filter : ... ,
  onSuccess(cssText, node, url) {
    // ...
  },
  onError(xhr, node, url) {
    // ...
  },
  onComplete(cssText, cssArray, nodeArray) {
    // ...
  }
});
```

### options.include

CSS selector matching `<style>` and  `<link rel="stylesheet">` nodes to process. The default value includes all style and link tags.

- Type: `string`
- Default: `"style,link[rel=stylesheet]"`

**Example**

```javascript
getCssData({
  // Include only <link rel="stylesheet"> nodes
  // with an href that does not contains "bootstrap"
  include: 'link[rel=stylesheet]:not([href*=bootstrap])',
  ...
});
```

### options.exclude

CSS selector matching `<link>` and `<style>` nodes to exclude from those matched by [options.include](#optionsinclude).

- Type: `string`

**Example**

```javascript
getCssData({
  // Of matched `include` nodes, exclude any node
  // with an href that contains "bootstrap"
  exclude: '[href*=bootstrap]',
  ...
});
```

### options.filter

Regular expression used to filter node CSS data. Each block of CSS data is tested against the filter, and only matching data is processed.

- Type: `object`

**Example**

```javascript
getCssData({
  // Test each block of CSS for the existence
  // of ".myclass". If found, process the CSS.
  // If not, ignore the CSS.
  filter: /\.myclass/,
  ...
});
```

### options.onSuccess

Callback after CSS data has been collected from each node. Allows modifying the CSS data before it is added to the final output by returning any `string` value (or `false` to skip).

Note that the order in which CSS data is "successfully" collected (thereby triggering this callback) is not guaranteed when `<link>`  nodes or `@import`  rules are being processed as this data is collected asynchronously. To access CSS data in DOM order, use [options.oncomplete](#optionsoncomplete).

- Type: `function`
- Arguments:
  1. **cssText**: A `string` of CSS text from `node` and `url`
  2. **node**: The source node `object` reference
  3. **url**: The source URL `string` (`<link>` href, `@import` url, or page url for `<style>` data)

**Example**

```javascript
getCss({
  onSuccess(cssText, node, url) {
    // ...
  }
});

// Inspecting and modifying CSS data
getCss({
  onSuccess(cssText, node, url) {
    // Skip any data not from this domain
    if (url.indexOf(location.hostname) === -1) {
      return false;
    }
    // Otherwise modify the CSS data
    else {
      const newCssText = cssText.replace(/color:\s*red\s;/g, 'color: blue;');
      return newCssText
    }
  }
});
```

### options.onError

Callback after `<link>` or `@import` request has failed.

- Type: `function`
- Arguments:
  1. **xhr**: The XHR `object` containing details of the failed request
  2. **node**: The source node `object` reference
  3. **url**: The source URL `string` (`<link>` href or `@import` url)

**Example**

```javascript
getCss({
  onError(xhr, node, url) {
    console.log(xhr.status); // 1
    console.log(xhr.statusText); // 2
  }
});

// 1 => '404'
// 2 => 'Not Found'
```

### options.onComplete

Callback after CSS data has been collected from all nodes.

- Type: `function`
- Arguments:
  1. **cssText**: A `string` of concatenated CSS text from all nodes in DOM order.
  2. **cssArray**: An `array` of per-node CSS text in DOM order. The node containing each CSS text block is available at the same **nodeArray** index.
  3. **nodeArray**: An `array` of processed `<style>` and `<link>` nodes in DOM order. The CSS text for each node is available at the same **cssArray** index.

**Example**

```javascript
getCss({
  onComplete(cssText, cssArray, nodeArray) {
    // ...
  }
});
```

## License

[MIT License](https://github.com/jhildenbiddle/get-css-data/blob/master/LICENSE)
