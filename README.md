# get-css-data [![Tweet](https://img.shields.io/twitter/url/http/shields.io.svg?style=social)](https://twitter.com/intent/tweet?text=A%20micro-library%20for%20collecting%20stylesheet%20data%20from%20link%20and%20style%20nodes&url=https%3A%2F%2Fgithub.com%2Fjhildenbiddle%2Fget-css-data&via=jhildenbiddle&hashtags=css,developers,frontend,javascript)

[![NPM](https://img.shields.io/npm/v/get-css-data.svg?style=flat-square)](https://www.npmjs.com/package/get-css-data)
[![Build Status](https://img.shields.io/travis/jhildenbiddle/get-css-data.svg?style=flat-square)](https://travis-ci.org/jhildenbiddle/get-css-data)
[![Codacy grade](https://img.shields.io/codacy/grade/57eb5b1190054035bbc78ba24868742e.svg?style=flat-square)](https://www.codacy.com/app/jhildenbiddle/get-css-data?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=jhildenbiddle/get-css-data&amp;utm_campaign=Badge_Grade)
[![Codecov](https://img.shields.io/codecov/c/github/jhildenbiddle/get-css-data.svg?style=flat-square)](https://codecov.io/gh/jhildenbiddle/get-css-data)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://github.com/jhildenbiddle/get-css-data/blob/master/LICENSE)

A micro-library for collecting stylesheet data from link and style nodes.

## Features

- Collect CSS data for all `<link>` and `<style>` nodes or only those specified
- Handles absolute and relative `@import` rules
- Inspect, modify and/or filter CSS data from each node
- Access CSS data as concatenated string or an array of per-node data in DOM order
- UMD and ES6 modules available
- Compatible with modern and legacy browsers (IE9+)
- Lightweight (less than 1.5k min+gzip) and dependency-free

## Installation

NPM:

```shell
npm install get-css-data
```

Git:

```shell
git clone https://github.com/jhildenbiddle/get-css-data.git
```

CDN ([unpkg.com](https://unpkg.com/) shown, also on [jsdelivr.net](https://www.jsdelivr.com/)):

```html
<!-- ES5 in file.html (latest v1.x.x) -->
<script src="https://unpkg.com/get-css-data@1"></script>
<script>
  getCssData({
    // options...
  });
</script>
```

```html
<!-- ES6 module in file.html (latest v1.x.x) -->
<script type="module">
  import getCssData from 'https://unpkg.com/get-css-data@1/dist/get-css-data.esm.min.js';
  getCssData({
    // options...
  });
</script>
```

```javascript
// ES6 module in file.js (latest v1.x.x)
import getCssData from 'https://unpkg.com/get-css-data@1/dist/get-css-data.esm.min.js';
getCssData({
  // options...
});
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

JavaScript (see [Options](#options) for details)

```javascript
getCss({
  onComplete(cssText, cssArray, nodeArray) {
    console.log(cssText); // 1
    console.log(cssArray); // 2
    console.log(nodeArray); // 3
  }
});

// 1 => 'p { color: red; } p { color: green; } p { color: blue; }'
// 2 => ['p { color: red; }', 'p { color: green; } p { color: blue; }']
// 3 => [<linkElement>, <styleElement>]
```

## Options

**Example**

```javascript
// Default values shown
getCssData({
  include: 'link[rel=stylesheet],style',
  exclude: '',
  filter : '',
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

- Type: `string`
- Default: `"link[rel=stylesheet],style"`

CSS selector matching `<link rel="stylesheet">` and `<style>` nodes to collect data from. The default value includes all style and link nodes.

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

- Type: `string`

CSS selector matching `<link rel="stylesheet">` and `<style>` nodes to exclude from those matched by [options.include](#optionsinclude).

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

- Type: `object`

Regular expression used to filter node CSS data. Each block of CSS data is tested against the filter, and only matching data is processed.

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

- Type: `function`
- Arguments:
  1. **cssText**: A `string` of CSS text from `node` and `url`
  2. **node**: The source node `object` reference
  3. **url**: The source URL `string` (`<link>` href, `@import` url, or page url for `<style>` data)

Callback after CSS data has been collected from each node. Allows modifying the CSS data before it is added to the final output by returning any `string` value (or `false` to skip).

Note that the order in which CSS data is "successfully" collected (thereby triggering this callback) is not guaranteed when `<link>`  nodes or `@import`  rules are being processed as this data is collected asynchronously. To access CSS data in DOM order, use [options.oncomplete](#optionsoncomplete).

**Example**

```javascript
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

- Type: `function`
- Arguments:
  1. **xhr**: The XHR `object` containing details of the failed request
  2. **node**: The source node `object` reference
  3. **url**: The source URL `string` (`<link>` href or `@import` url)

Callback after `<link>` or `@import` request has failed.

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

- Type: `function`
- Arguments:
  1. **cssText**: A `string` of concatenated CSS text from all nodes in DOM order.
  2. **cssArray**: An `array` of per-node CSS text in DOM order. The node containing each CSS text block is available at the same **nodeArray** index.
  3. **nodeArray**: An `array` of processed `<style>` and `<link>` nodes in DOM order. The CSS text for each node is available at the same **cssArray** index.

Callback after CSS data has been collected from all nodes.

**Example**

```javascript
getCss({
  onComplete(cssText, cssArray, nodeArray) {
    // ...
  }
});
```

## Contact

- Create a [Github issue](https://github.com/jhildenbiddle/get-css-data/issues) for bug reports, feature requests, or questions
- Follow [@jhildenbiddle](https://twitter.com/jhildenbiddle) for announcements
- Add a [star on GitHub](https://github.com/jhildenbiddle/get-css-data) or [tweet](https%3A%2F%2Ftwitter.com%2Fintent%2Ftweet%3Ftext%3DA%20micro-library%20for%20collecting%20stylesheet%20data%20from%20link%20and%20style%20nodes%26url%3Dhttps%3A%2F%2Fgithub.com%2Fjhildenbiddle%2Fget-css-data%26hashtags%3Dcss%2Cdevelopers%2Cfrontend%2Cjavascript) to support the project!

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/jhildenbiddle/get-css-data/blob/master/LICENSE) for details.

Copyright (c) 2018 John Hildenbiddle ([@jhildenbiddle](https://twitter.com/jhildenbiddle))