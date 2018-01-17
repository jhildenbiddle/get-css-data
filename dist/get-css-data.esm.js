/*!
 * get-css-data
 * v1.0.0
 * https://github.com/jhildenbiddle/get-css-data
 * (c) 2018 John Hildenbiddle <http://hildenbiddle.com>
 * MIT license
 */
function getUrls(urls) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var settings = {
        mimeType: options.mimeType || null,
        onComplete: options.onComplete || Function.prototype,
        onError: options.onError || Function.prototype,
        onSuccess: options.onSuccess || Function.prototype
    };
    var urlArray = Array.isArray(urls) ? urls : [ urls ];
    var urlQueue = Array.apply(null, Array(urlArray.length)).map(function(x) {
        return null;
    });
    function onError(xhr, urlIndex) {
        settings.onError(xhr, urlArray[urlIndex], urlIndex);
    }
    function onSuccess(responseText, urlIndex) {
        urlQueue[urlIndex] = responseText;
        settings.onSuccess(responseText, urlArray[urlIndex], urlIndex);
        if (urlQueue.indexOf(null) === -1) {
            settings.onComplete(urlQueue);
        }
    }
    urlArray.forEach(function(url, i) {
        var parser = document.createElement("a");
        parser.setAttribute("href", url);
        parser.href = parser.href;
        var isCrossDomain = parser.host !== location.host;
        var isSameProtocol = parser.protocol === location.protocol;
        if (isCrossDomain && typeof XDomainRequest !== "undefined") {
            if (isSameProtocol) {
                var xdr = new XDomainRequest();
                xdr.open("GET", url);
                xdr.timeout = 0;
                xdr.onprogress = Function.prototype;
                xdr.ontimeout = Function.prototype;
                xdr.onload = function() {
                    onSuccess(xdr.responseText, i);
                };
                xdr.onerror = function(err) {
                    onError(xdr, i);
                };
                setTimeout(function() {
                    xdr.send();
                }, 0);
            } else {
                console.log("Internet Explorer 9 Cross-Origin (CORS) requests must use the same protocol");
                onError(null, i);
            }
        } else {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url);
            if (settings.mimeType && xhr.overrideMimeType) {
                xhr.overrideMimeType(settings.mimeType);
            }
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        onSuccess(xhr.responseText, i);
                    } else {
                        onError(xhr, i);
                    }
                }
            };
            xhr.send();
        }
    });
}

/**
 * Gets CSS data from <style> and <link> nodes (including @imports), then
 * returns data in order processed by DOM. Allows specifying nodes to
 * include/exclude and filtering CSS data using RegEx.
 *
 * @preserve
 * @param {object} [options={}] - The options object
 * @param {string} options.include - CSS selector matching <link> and <style>
 * nodes to include
 * @param {string} options.exclude - CSS selector matching <link> and <style>
 * nodes to exclude
 * @param {object} options.filter - Regular expression used to filter node CSS
 * data. Each block of CSS data is tested against the filter, and only matching
 * data is included.
 * @param {function} options.onComplete - Callback after all nodes have been
 * processed. Passes concatenated CSS text and array of CSS text in DOM order as
 * arguments.
 * @param {function} options.onError - Callback on each error. Passes the XHR
 * object for inspection, soure node reference, and the source URL that failed
 * (either a <link> href or an @import) as arguments
 * @param {function} options.onSuccess - Callback on each CSS node read. Passes
 * CSS text, source node reference, and the source URL (either a <link> href or
 * an import) as arguments.
 * @example
 *
 *   getCssData({
 *     include: 'style,link[rel="stylesheet"]', // default
 *     exclude: '[href="skip.css"]',
 *     filter : /red/,
 *     onComplete(cssText, cssArray) {
 *       // ...
 *     },
 *     onError(xhr, node, url) {
 *       // ...
 *     },
 *     onSuccess(cssText, node, url) {
 *       // ...
 *     }
 *   });
 */ function getCssData(options) {
    var regex = {
        cssComments: /\/\*[\s\S]+?\*\//g,
        cssImports: /(?:@import\s*)(?:url\(\s*)?(?:['"])([^'"]*)(?:['"])(?:\s*\))?(?:[^;]*;)/g
    };
    var settings = {
        include: options.include || 'style,link[rel="stylesheet"]',
        exclude: options.exclude || null,
        filter: options.filter || null,
        onComplete: options.onComplete || Function.prototype,
        onError: options.onError || Function.prototype,
        onSuccess: options.onSuccess || Function.prototype
    };
    var sourceNodes = Array.apply(null, document.querySelectorAll(settings.include)).filter(function(node) {
        return !matchesSelector(node, settings.exclude);
    });
    var cssQueue = Array.apply(null, Array(sourceNodes.length)).map(function(x) {
        return null;
    });
    function handleComplete() {
        var isComplete = cssQueue.indexOf(null) === -1;
        if (isComplete) {
            var cssText = cssQueue.join("");
            settings.onComplete(cssText, cssQueue);
        }
    }
    function handleError(xhr, url, cssIndex, node) {
        cssQueue[cssIndex] = "";
        settings.onError(xhr, node, url);
        handleComplete();
    }
    function handleSuccess(cssText, cssIndex, node, sourceUrl, importUrl) {
        if (!settings.filter || settings.filter.test(cssText)) {
            var returnVal = settings.onSuccess(cssText, node, importUrl || sourceUrl);
            cssText = returnVal === false ? "" : returnVal || cssText;
            var importRules = cssText.replace(regex.cssComments, "").match(regex.cssImports);
            if (importRules) {
                var importUrls = importRules.map(function(decl) {
                    return decl.replace(regex.cssImports, "$1");
                });
                importUrls = importUrls.map(function(url) {
                    return getFullUrl(url, sourceUrl);
                });
                getUrls(importUrls, {
                    onError: function onError(xhr, url, urlIndex) {
                        handleError(xhr, url, cssIndex, node);
                    },
                    onSuccess: function onSuccess(importText, url, urlIndex) {
                        var importDecl = importRules[urlIndex];
                        var importUrl = importUrls[urlIndex];
                        var newCssText = cssText.replace(importDecl, importText);
                        handleSuccess(newCssText, cssIndex, node, url, importUrl);
                    }
                });
            } else {
                cssQueue[cssIndex] = cssText;
                handleComplete();
            }
        } else {
            cssQueue[cssIndex] = "";
            handleComplete();
        }
    }
    sourceNodes.forEach(function(node, i) {
        var linkHref = node.getAttribute("href");
        var linkRel = node.getAttribute("rel");
        var isLink = node.nodeName === "LINK" && linkHref && linkRel && linkRel.toLowerCase() === "stylesheet";
        var isStyle = node.nodeName === "STYLE";
        if (isLink) {
            getUrls(linkHref, {
                mimeType: "text/css",
                onError: function onError(xhr, url, urlIndex) {
                    handleError(xhr, url, i, node);
                },
                onSuccess: function onSuccess(cssText, url, urlIndex) {
                    var sourceUrl = getFullUrl(linkHref, location.href);
                    handleSuccess(cssText, i, node, sourceUrl);
                }
            });
        } else if (isStyle) {
            handleSuccess(node.textContent, i, node, location.href);
        } else {
            cssQueue[i] = "";
            handleComplete();
        }
    });
}

function getFullUrl(url) {
    var base = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : location.href;
    var d = document.implementation.createHTMLDocument("");
    var b = d.createElement("base");
    var a = d.createElement("a");
    d.head.appendChild(b);
    d.body.appendChild(a);
    b.href = base;
    a.href = url;
    return a.href;
}

function matchesSelector(elm, selector) {
    var matches = elm.matches || elm.matchesSelector || elm.webkitMatchesSelector || elm.mozMatchesSelector || elm.msMatchesSelector || elm.oMatchesSelector;
    return matches.call(elm, selector);
}

export default getCssData;
//# sourceMappingURL=get-css-data.esm.js.map