// Dependencies
// =============================================================================
import getUrls from './get-urls';


// Functions (Public)
// =============================================================================
/**
 * Gets CSS data from <style> and <link> nodes (including @imports), then
 * returns data in order processed by DOM. Allows specifying nodes to
 * include/exclude and filtering CSS data using RegEx.
 *
 * @preserve
 * @param {object}   [options] The options object
 * @param {string}   [options.include] CSS selector matching <link> and <style>
 *                   nodes to include
 * @param {string}   [options.exclude] CSS selector matching <link> and <style>
 *                   nodes to exclude
 * @param {object}   [options.filter] Regular expression used to filter node CSS
 *                   data. Each block of CSS data is tested against the filter,
 *                   and only matching data is included.
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
 *     include: 'style,link[rel="stylesheet"]', // default
 *     exclude: '[href="skip.css"]',
 *     filter : /red/,
 *     onSuccess(cssText, node, url) {
 *       // ...
 *     }
 *     onError(xhr, node, url) {
 *       // ...
 *     },
 *     onComplete(cssText, cssArray) {
 *       // ...
 *     },
 *   });
 */
function getCssData(options) {
    const regex = {
        // CSS comments
        cssComments: /\/\*[\s\S]+?\*\//g,
        // CSS @import rules ($1: url)
        cssImports : /(?:@import\s*)(?:url\(\s*)?(?:['"])([^'"]*)(?:['"])(?:\s*\))?(?:[^;]*;)/g
    };
    const settings = {
        include   : options.include    || 'style,link[rel="stylesheet"]',
        exclude   : options.exclude    || null,
        filter    : options.filter     || null,
        onComplete: options.onComplete || Function.prototype,
        onError   : options.onError    || Function.prototype,
        onSuccess : options.onSuccess  || Function.prototype
    };
    const sourceNodes = Array.apply(null, document.querySelectorAll(settings.include)).filter(node => !matchesSelector(node, settings.exclude));
    const cssArray    = Array.apply(null, Array(sourceNodes.length)).map(x => null);

    /**
     * Handles the onComplete() callback after verifying that all CSS has been
     * processed.
     */
    function handleComplete() {
        const isComplete = cssArray.indexOf(null) === -1;

        if (isComplete) {
            const cssText = cssArray.join('');

            settings.onComplete(cssText, cssArray, sourceNodes);
        }
    }

    /**
     * Processes CSS text, updates cssArray, and triggers handleComplete()
     * 1. Passes CSS to resolveImports
     * 2. Triggers onError() callback for each @import error
     * 3. Tests resolved CSS against (optional) RegEx filter
     * 4. Triggers onSuccess() callback and accepts modified cssText as return
     * 5. Inserts final CSS into cssArray
     * 6. Triggers handleComplete() after processing is complete
     *
     * @param {string} cssText - CSS text to be processed
     * @param {number} cssIndex - cssArray index to store final CSS
     * @param {object} node - CSS source <link> or <style> node
     * @param {string} sourceUrl - The URL containing the source node
     */
    function handleSuccess(cssText, cssIndex, node, sourceUrl) {
        resolveImports(cssText, sourceUrl, function(resolvedCssText, errorData) {
            if (cssArray[cssIndex] === null) {
                // Trigger onError for each error item
                errorData.forEach(data => settings.onError(data.xhr, node, data.url));

                // Filter: Pass
                if (!settings.filter || settings.filter.test(resolvedCssText)) {
                    // Store return value of the onSuccess callback. This allows
                    // modifying resolvedCssText before adding to cssArray.
                    const returnVal = settings.onSuccess(resolvedCssText, node, sourceUrl);

                    // Store return value (if provided) or resolvedCssText
                    cssArray[cssIndex] = returnVal === false ? '' : returnVal || resolvedCssText;
                }
                // Filter: Fail
                else {
                    cssArray[cssIndex] = '';
                }

                handleComplete();
            }
        });
    }

    /**
     * Recursively parses CSS for @import rules, fetches data for each import
     * URL, replaces the @rule the fetched data, then returns the resolved CSS
     * via a callback function.
     *
     * @param {string} cssText - CSS text to be processed
     * @param {string} baseUrl - Base URL used to resolve relative @import URLs
     * @param {function} callbackFn - Callback function to trigger on complete.
     * Passes 1) the resolves CSS and 2) an array of error objects as arguments.
     */
    function resolveImports(cssText, baseUrl, callbackFn, __errorData = [], __errorRules = []) {
        let importRules = cssText
            // Remove comments to avoid processing @import in comments
            .replace(regex.cssComments, '')
            // Find all @import rules
            .match(regex.cssImports);

        // Remove rules found in __errorRules array
        importRules = (importRules || []).filter(rule => __errorRules.indexOf(rule) === -1);

        // Has @imports
        if (importRules.length) {
            const importUrls = importRules
                // Get URLs from @import rules
                .map(decl => decl.replace(regex.cssImports, '$1'))
                // Convert to absolute urls
                .map(url => getFullUrl(url, baseUrl));

            getUrls(importUrls, {
                onError(xhr, url, urlIndex) {
                    __errorData.push({ xhr, url });
                    __errorRules.push(importRules[urlIndex]);

                    resolveImports(cssText, baseUrl, callbackFn, __errorData, __errorRules);
                },
                onSuccess(importText, url, urlIndex) {
                    const importDecl = importRules[urlIndex];
                    const newCssText = cssText.replace(importDecl, importText);

                    resolveImports(newCssText, url, callbackFn, __errorData, __errorRules);
                }
            });
        }
        // No @imports
        else {
            callbackFn(cssText, __errorData);
        }
    }

    // Main
    // -------------------------------------------------------------------------
    if (sourceNodes.length) {
        sourceNodes.forEach((node, i) => {
            const linkHref = node.getAttribute('href');
            const linkRel  = node.getAttribute('rel');
            const isLink   = node.nodeName === 'LINK' && linkHref && linkRel && linkRel.toLowerCase() === 'stylesheet';
            const isStyle  = node.nodeName === 'STYLE';

            if (isLink) {
                getUrls(linkHref, {
                    mimeType: 'text/css',
                    onError(xhr, url, urlIndex) {
                        cssArray[i] = '';
                        settings.onError(xhr, node, url);
                        handleComplete();
                    },
                    onSuccess(cssText, url, urlIndex) {
                        // Convert relative linkHref to absolute url
                        const sourceUrl = getFullUrl(linkHref, location.href);

                        handleSuccess(cssText, i, node, sourceUrl);
                    }
                });
            }
            else if (isStyle) {
                handleSuccess(node.textContent, i, node, location.href);
            }
            else {
                cssArray[i] = '';
                handleComplete();
            }
        });
    }
    else {
        settings.onComplete('', []);
    }
}


// Functions (Private)
// =============================================================================
/**
 * Returns fully qualified URL from relative URL and (optional) base URL
 *
 * @param {any} url
 * @param {any} [base=location.href]
 * @returns
 */
function getFullUrl(url, base = location.href) {
    const d = document.implementation.createHTMLDocument('');
    const b = d.createElement('base');
    const a = d.createElement('a');

    d.head.appendChild(b);
    d.body.appendChild(a);
    b.href = base;
    a.href = url;

    return a.href;
}

/**
 * Ponyfill for native Element.matches method
 *
 * @param {object} elm - The element to test
 * @param {string} selector - The CSS selector to test against
 * @returns {boolean}
 */
function matchesSelector(elm, selector) {
    /* istanbul ignore next */
    const matches = elm.matches || elm.matchesSelector || elm.webkitMatchesSelector || elm.mozMatchesSelector || elm.msMatchesSelector || elm.oMatchesSelector;

    return matches.call(elm, selector);
}


// Export
// =============================================================================
export default getCssData;
