/*!
 * get-css-data
 * v1.9.1
 * https://github.com/jhildenbiddle/get-css-data
 * (c) 2018-2020 John Hildenbiddle <http://hildenbiddle.com>
 * MIT license
 */
(function(global, factory) {
    typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, 
    global.getCssData = factory());
})(this, (function() {
    "use strict";
    function getUrls(urls) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var settings = {
            mimeType: options.mimeType || null,
            onBeforeSend: options.onBeforeSend || Function.prototype,
            onSuccess: options.onSuccess || Function.prototype,
            onError: options.onError || Function.prototype,
            onComplete: options.onComplete || Function.prototype
        };
        var urlArray = Array.isArray(urls) ? urls : [ urls ];
        var urlQueue = Array.apply(null, Array(urlArray.length)).map((function(x) {
            return null;
        }));
        function isValidCss(cssText) {
            var isHTML = cssText && cssText.trim().charAt(0) === "<";
            return cssText && !isHTML;
        }
        function onError(xhr, urlIndex) {
            settings.onError(xhr, urlArray[urlIndex], urlIndex);
        }
        function onSuccess(responseText, urlIndex) {
            var returnVal = settings.onSuccess(responseText, urlArray[urlIndex], urlIndex);
            responseText = returnVal === false ? "" : returnVal || responseText;
            urlQueue[urlIndex] = responseText;
            if (urlQueue.indexOf(null) === -1) {
                settings.onComplete(urlQueue);
            }
        }
        var parser = document.createElement("a");
        urlArray.forEach((function(url, i) {
            parser.setAttribute("href", url);
            parser.href = String(parser.href);
            var isIElte9 = Boolean(document.all && !window.atob);
            var isIElte9CORS = isIElte9 && parser.host.split(":")[0] !== location.host.split(":")[0];
            if (isIElte9CORS) {
                var isSameProtocol = parser.protocol === location.protocol;
                if (isSameProtocol) {
                    var xdr = new XDomainRequest;
                    xdr.open("GET", url);
                    xdr.timeout = 0;
                    xdr.onprogress = Function.prototype;
                    xdr.ontimeout = Function.prototype;
                    xdr.onload = function() {
                        if (isValidCss(xdr.responseText)) {
                            onSuccess(xdr.responseText, i);
                        } else {
                            onError(xdr, i);
                        }
                    };
                    xdr.onerror = function(err) {
                        onError(xdr, i);
                    };
                    setTimeout((function() {
                        xdr.send();
                    }), 0);
                } else {
                    console.warn("Internet Explorer 9 Cross-Origin (CORS) requests must use the same protocol (".concat(url, ")"));
                    onError(null, i);
                }
            } else {
                var xhr = new XMLHttpRequest;
                xhr.open("GET", url);
                if (settings.mimeType && xhr.overrideMimeType) {
                    xhr.overrideMimeType(settings.mimeType);
                }
                settings.onBeforeSend(xhr, url, i);
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200 && isValidCss(xhr.responseText)) {
                            onSuccess(xhr.responseText, i);
                        } else if (xhr.status === 0 && isValidCss(xhr.responseText)) {
                            onSuccess(xhr.responseText, i);
                        } else {
                            onError(xhr, i);
                        }
                    }
                };
                xhr.send();
            }
        }));
    }
    /**
     * Gets CSS data from <style> and <link> nodes (including @imports), then
     * returns data in order processed by DOM. Allows specifying nodes to
     * include/exclude and filtering CSS data using RegEx.
     *
     * @preserve
     * @param {object}   [options] The options object
     * @param {object}   [options.rootElement=document] Root element to traverse for
     *                   <link> and <style> nodes.
     * @param {string}   [options.include] CSS selector matching <link> and <style>
     *                   nodes to include
     * @param {string}   [options.exclude] CSS selector matching <link> and <style>
     *                   nodes to exclude
     * @param {object}   [options.filter] Regular expression used to filter node CSS
     *                   data. Each block of CSS data is tested against the filter,
     *                   and only matching data is included.
     * @param {boolean}  [options.skipDisabled=true] Determines if disabled
     *                   stylesheets will be skipped while collecting CSS data.
     * @param {boolean}  [options.useCSSOM=false] Determines if CSS data will be
     *                   collected from a stylesheet's runtime values instead of its
     *                   text content. This is required to get accurate CSS data
     *                   when a stylesheet has been modified using the deleteRule()
     *                   or insertRule() methods because these modifications will
     *                   not be reflected in the stylesheet's text content.
     * @param {function} [options.onBeforeSend] Callback before XHR is sent. Passes
     *                   1) the XHR object, 2) source node reference, and 3) the
     *                   source URL as arguments.
     * @param {function} [options.onSuccess] Callback on each CSS node read. Passes
     *                   1) CSS text, 2) source node reference, and 3) the source
     *                   URL as arguments.
     * @param {function} [options.onError] Callback on each error. Passes 1) the XHR
     *                   object for inspection, 2) soure node reference, and 3) the
     *                   source URL that failed (either a <link> href or an @import)
     *                   as arguments
     * @param {function} [options.onComplete] Callback after all nodes have been
     *                   processed. Passes 1) concatenated CSS text, 2) an array of
     *                   CSS text in DOM order, and 3) an array of nodes in DOM
     *                   order as arguments.
     *
     * @example
     *
     *   getCssData({
     *     rootElement : document,
     *     include     : 'style,link[rel="stylesheet"]',
     *     exclude     : '[href="skip.css"]',
     *     filter      : /red/,
     *     skipDisabled: true,
     *     useCSSOM    : false,
     *     onBeforeSend(xhr, node, url) {
     *       // ...
     *     }
     *     onSuccess(cssText, node, url) {
     *       // ...
     *     }
     *     onError(xhr, node, url) {
     *       // ...
     *     },
     *     onComplete(cssText, cssArray, nodeArray) {
     *       // ...
     *     }
     *   });
     */    function getCssData(options) {
        var regex = {
            cssComments: /\/\*[\s\S]+?\*\//g,
            cssImports: /(?:@import\s*)(?:url\(\s*)?(?:['"])([^'"]*)(?:['"])(?:\s*\))?(?:[^;]*;)/g
        };
        var settings = {
            rootElement: options.rootElement || document,
            include: options.include || 'style,link[rel="stylesheet"]',
            exclude: options.exclude || null,
            filter: options.filter || null,
            skipDisabled: options.skipDisabled !== false,
            useCSSOM: options.useCSSOM || false,
            onBeforeSend: options.onBeforeSend || Function.prototype,
            onSuccess: options.onSuccess || Function.prototype,
            onError: options.onError || Function.prototype,
            onComplete: options.onComplete || Function.prototype
        };
        var sourceNodes = Array.apply(null, settings.rootElement.querySelectorAll(settings.include)).filter((function(node) {
            return !matchesSelector(node, settings.exclude);
        }));
        var cssArray = Array.apply(null, Array(sourceNodes.length)).map((function(x) {
            return null;
        }));
        function handleComplete() {
            var isComplete = cssArray.indexOf(null) === -1;
            if (isComplete) {
                var cssText = cssArray.join("");
                settings.onComplete(cssText, cssArray, sourceNodes);
            }
        }
        function handleSuccess(cssText, cssIndex, node, sourceUrl) {
            var returnVal = settings.onSuccess(cssText, node, sourceUrl);
            cssText = returnVal !== undefined && Boolean(returnVal) === false ? "" : returnVal || cssText;
            resolveImports(cssText, node, sourceUrl, (function(resolvedCssText, errorData) {
                if (cssArray[cssIndex] === null) {
                    errorData.forEach((function(data) {
                        return settings.onError(data.xhr, node, data.url);
                    }));
                    if (!settings.filter || settings.filter.test(resolvedCssText)) {
                        cssArray[cssIndex] = resolvedCssText;
                    } else {
                        cssArray[cssIndex] = "";
                    }
                    handleComplete();
                }
            }));
        }
        function parseImportData(cssText, baseUrl) {
            var ignoreRules = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
            var importData = {};
            importData.rules = (cssText.replace(regex.cssComments, "").match(regex.cssImports) || []).filter((function(rule) {
                return ignoreRules.indexOf(rule) === -1;
            }));
            importData.urls = importData.rules.map((function(rule) {
                return rule.replace(regex.cssImports, "$1");
            }));
            importData.absoluteUrls = importData.urls.map((function(url) {
                return getFullUrl(url, baseUrl);
            }));
            importData.absoluteRules = importData.rules.map((function(rule, i) {
                var oldUrl = importData.urls[i];
                var newUrl = getFullUrl(importData.absoluteUrls[i], baseUrl);
                return rule.replace(oldUrl, newUrl);
            }));
            return importData;
        }
        function resolveImports(cssText, node, baseUrl, callbackFn) {
            var __errorData = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : [];
            var __errorRules = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : [];
            var importData = parseImportData(cssText, baseUrl, __errorRules);
            if (importData.rules.length) {
                getUrls(importData.absoluteUrls, {
                    onBeforeSend: function onBeforeSend(xhr, url, urlIndex) {
                        settings.onBeforeSend(xhr, node, url);
                    },
                    onSuccess: function onSuccess(cssText, url, urlIndex) {
                        var returnVal = settings.onSuccess(cssText, node, url);
                        cssText = returnVal === false ? "" : returnVal || cssText;
                        var responseImportData = parseImportData(cssText, url, __errorRules);
                        responseImportData.rules.forEach((function(rule, i) {
                            cssText = cssText.replace(rule, responseImportData.absoluteRules[i]);
                        }));
                        return cssText;
                    },
                    onError: function onError(xhr, url, urlIndex) {
                        __errorData.push({
                            xhr: xhr,
                            url: url
                        });
                        __errorRules.push(importData.rules[urlIndex]);
                        resolveImports(cssText, node, baseUrl, callbackFn, __errorData, __errorRules);
                    },
                    onComplete: function onComplete(responseArray) {
                        responseArray.forEach((function(importText, i) {
                            cssText = cssText.replace(importData.rules[i], importText);
                        }));
                        resolveImports(cssText, node, baseUrl, callbackFn, __errorData, __errorRules);
                    }
                });
            } else {
                callbackFn(cssText, __errorData);
            }
        }
        if (sourceNodes.length) {
            sourceNodes.forEach((function(node, i) {
                var linkHref = node.getAttribute("href");
                var linkRel = node.getAttribute("rel");
                var isLink = node.nodeName.toLowerCase() === "link" && linkHref && linkRel && linkRel.toLowerCase().indexOf("stylesheet") !== -1;
                var isSkip = settings.skipDisabled === false ? false : node.disabled;
                var isStyle = node.nodeName.toLowerCase() === "style";
                if (isLink && !isSkip) {
                    getUrls(linkHref, {
                        mimeType: "text/css",
                        onBeforeSend: function onBeforeSend(xhr, url, urlIndex) {
                            settings.onBeforeSend(xhr, node, url);
                        },
                        onSuccess: function onSuccess(cssText, url, urlIndex) {
                            var sourceUrl = getFullUrl(linkHref);
                            handleSuccess(cssText, i, node, sourceUrl);
                        },
                        onError: function onError(xhr, url, urlIndex) {
                            cssArray[i] = "";
                            settings.onError(xhr, node, url);
                            handleComplete();
                        }
                    });
                } else if (isStyle && !isSkip) {
                    var cssText = node.textContent;
                    if (settings.useCSSOM) {
                        cssText = Array.apply(null, node.sheet.cssRules).map((function(rule) {
                            return rule.cssText;
                        })).join("");
                    }
                    handleSuccess(cssText, i, node, location.href);
                } else {
                    cssArray[i] = "";
                    handleComplete();
                }
            }));
        } else {
            settings.onComplete("", []);
        }
    }
    function getFullUrl(url, base) {
        var d = document.implementation.createHTMLDocument("");
        var b = d.createElement("base");
        var a = d.createElement("a");
        d.head.appendChild(b);
        d.body.appendChild(a);
        b.href = base || document.baseURI || (document.querySelector("base") || {}).href || location.href;
        a.href = url;
        return a.href;
    }
    function matchesSelector(elm, selector) {
        var matches = elm.matches || elm.matchesSelector || elm.webkitMatchesSelector || elm.mozMatchesSelector || elm.msMatchesSelector || elm.oMatchesSelector;
        return matches.call(elm, selector);
    }
    return getCssData;
}));
//# sourceMappingURL=get-css-data.js.map
