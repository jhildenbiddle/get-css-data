// Dependencies
// =============================================================================
import getUrls  from './get-urls';


// Functions
// =============================================================================
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
    const cssQueue    = Array.apply(null, Array(sourceNodes.length)).map(x => null);

    // Functions (Private)
    // -------------------------------------------------------------------------
    /**
     * Handles the onComplete() callback after verifying that all CSS has been
     * processed.
     */
    function handleComplete() {
        const isComplete = cssQueue.indexOf(null) === -1;

        if (isComplete) {
            const cssText = cssQueue.join('');

            settings.onComplete(cssText, cssQueue);
        }
    }

    /**
     * Handles the onError callback for failed XMLHttpRequests
     *
     * @param {object} xhr
     * @param {string} url
     * @param {number} cssIndex
     * @param {object} node
     */
    function handleError(xhr, url, cssIndex, node) {
        cssQueue[cssIndex] = '';

        settings.onError(xhr, node, url);

        handleComplete();
    }

    /**
     * Processes CSS text, updates cssQueue, and triggers handleComplete()
     * 1. Tests CSS against (optional) RegEx filter
     * 2. Triggers onSuccess() callback and accepts modified cssText as return
     * 3. Detects and resolves @import rules
     * 4. Inserts final CSS into cssQueue
     * 5. Triggers handleComplete() after processing is complete
     *
     * @param {string} cssText - CSS text to be processed
     * @param {number} cssIndex - cssQueue index to store final CSS
     * @param {object} node - CSS source <link> or <style> node
     * @param {string} sourceUrl - The base URL for resolving relative @imports
     * @param {string} importUrl - The @import source URL (if applicable)
     */
    function handleSuccess(cssText, cssIndex, node, sourceUrl, importUrl) {
        // Filter: Pass
        if (!settings.filter || settings.filter.test(cssText)) {
            // Store the return value of the onSuccess callback. This allows
            // modifying cssText before adding to cssQueue.
            const returnVal = settings.onSuccess(cssText, node, importUrl || sourceUrl);

            // Set cssText to return value (if provided)
            cssText = returnVal === false ? '' : returnVal || cssText;

            // Get @import rules from cssText. CSS comments are removed
            // to avoid @import statements in comments from being processed.
            const importRules = cssText.replace(regex.cssComments, '').match(regex.cssImports);

            // Has @imports
            if (importRules) {
                let importUrls = importRules.map(decl => decl.replace(regex.cssImports, '$1'));

                // Convert relative importUrls to absolute urls using
                // sourceUrl as base.
                importUrls = importUrls.map(url => getFullUrl(url, sourceUrl));

                getUrls(importUrls, {
                    onError(xhr, url, urlIndex) {
                        handleError(xhr, url, cssIndex, node);
                    },
                    onSuccess(importText, url, urlIndex) {
                        const importDecl = importRules[urlIndex];
                        const importUrl  = importUrls[urlIndex];
                        const newCssText = cssText.replace(importDecl, importText);

                        handleSuccess(newCssText, cssIndex, node, url, importUrl);
                    }
                });
            }
            // No @imports
            else {
                cssQueue[cssIndex] = cssText;
                handleComplete();
            }
        }
        // Filter: Fail
        else {
            cssQueue[cssIndex] = '';
            handleComplete();
        }
    }


    // Main
    // -------------------------------------------------------------------------
    sourceNodes.forEach((node, i) => {
        const linkHref = node.getAttribute('href');
        const linkRel  = node.getAttribute('rel');
        const isLink   = node.nodeName === 'LINK' && linkHref && linkRel && linkRel.toLowerCase() === 'stylesheet';
        const isStyle  = node.nodeName === 'STYLE';

        if (isLink) {
            getUrls(linkHref, {
                mimeType: 'text/css',
                onError(xhr, url, urlIndex) {
                    handleError(xhr, url, i, node);
                },
                onSuccess(cssText, url, urlIndex) {
                    // Convert relative linkHref to absolute url to use as
                    // the base URL for @import statements.
                    // const sourceUrl = new URLParse(linkHref, location.href).href;
                    const sourceUrl = getFullUrl(linkHref, location.href);

                    handleSuccess(cssText, i, node, sourceUrl);
                }
            });
        }
        else if (isStyle) {
            handleSuccess(node.textContent, i, node, location.href);
        }
        else {
            cssQueue[i] = '';
            handleComplete();
        }
    });
}

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
