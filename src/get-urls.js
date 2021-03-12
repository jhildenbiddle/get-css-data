/*global XDomainRequest*/

// Functions
// =============================================================================
/**
 * Requests one-or-more URLs and returns array of data in order specified.
 * Provides callbacks error and success callbacks for each XMLHttpRequest.
 *
 * @param {array|string} url Single URL or array of URLs to request
 * @param {object}      [options] Options object
 * @param {string}      [options.mimeType] Overrides MIME type returned by
 *                      server
 * @param {function}    [options.onBeforeSend] Callback before each request is
 *                      sent. Passes 1) the xhr object, 2) the URL, and 3) the
 *                      URL index as arguments.
 * @param {function}    [options.onSuccess] Callback on xhr success. Passes 1)
 *                      xhr response text, 2) the URL, and 3) the URL index as
 *                      arguments.
 * @param {function}    [options.onError] Callback on xhr error. Passes 1) the
 *                      xhr object, 2) the URL, 3) the URL index as arguments.
 * @param {function}    [options.onComplete] Callback after all requests have
 *                      completed. Passes 1) an array of response text for each
 *                      URL in order provided as an argument.
 */
function getUrls(urls, options = {}) {
    const settings = {
        mimeType    : options.mimeType     || null,
        onBeforeSend: options.onBeforeSend || Function.prototype,
        onSuccess   : options.onSuccess    || Function.prototype,
        onError     : options.onError      || Function.prototype,
        onComplete  : options.onComplete   || Function.prototype
    };
    const urlArray = Array.isArray(urls) ? urls : [urls];
    const urlQueue = Array.apply(null, Array(urlArray.length)).map(x => null);

    // Functions (Private)
    // -------------------------------------------------------------------------
    function isValidCss(text) {
        const isString = typeof text === 'string';
        const isHTML = isString && text.trim().charAt(0) === '<';

        return isString && !isHTML;
    }

    function onError(xhr, urlIndex) {
        settings.onError(xhr, urlArray[urlIndex], urlIndex);
    }

    function onSuccess(responseText, urlIndex) {
        const returnVal = settings.onSuccess(responseText, urlArray[urlIndex], urlIndex);

        responseText = returnVal === false ? '' : returnVal || responseText;
        urlQueue[urlIndex] = responseText;

        // Complete
        if (urlQueue.indexOf(null) === -1) {
            settings.onComplete(urlQueue);
        }
    }

    // Main
    // -------------------------------------------------------------------------
    const parser = document.createElement('a');

    urlArray.forEach((url, i) => {
        parser.setAttribute('href', url);
        parser.href = String(parser.href);

        const isIElte9     = Boolean(document.all && !window.atob);
        const isIElte9CORS = isIElte9 && parser.host.split(':')[0] !== location.host.split(':')[0];

        // IE 9 CORS
        if (isIElte9CORS) {
            const isSameProtocol = parser.protocol === location.protocol;

            if (isSameProtocol) {
                const xdr = new XDomainRequest();

                // Event handlers must be assigned AFTER xdr.open
                xdr.open('GET', url);

                xdr.timeout = 0; // Prevent aborts/timeouts
                xdr.onprogress = Function.prototype; // Prevent aborts/timeouts
                xdr.ontimeout = Function.prototype; // Prevent aborts/timeouts
                xdr.onload = function() {
                    const text = xdr.responseText;

                    if (isValidCss(text)) {
                        onSuccess(text, i);
                    }
                    else {
                        onError(xdr, i);
                    }
                };
                xdr.onerror = function(err) {
                    onError(xdr, i);
                };

                // Wrap in setTimeout to fix known issues with XDomainRequest
                // when sending multiple requests
                setTimeout(function() {
                    xdr.send();
                }, 0);
            }
            else {
                // eslint-disable-next-line
                console.warn(`Internet Explorer 9 Cross-Origin (CORS) requests must use the same protocol (${url})`);
                onError(null, i);
            }
        }
        // Other
        else {
            const xhr = new XMLHttpRequest();

            xhr.open('GET', url);

            // overrideMimeType method not available in all browsers
            if (settings.mimeType && xhr.overrideMimeType) {
                xhr.overrideMimeType(settings.mimeType);
            }

            settings.onBeforeSend(xhr, url, i);

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    const text = xhr.responseText;

                    // Success
                    if (xhr.status < 400 && isValidCss(text)) {
                        onSuccess(text, i);
                    }
                    // Success via file protocol (file://)
                    else if (xhr.status === 0 && isValidCss(text)) {
                        onSuccess(text, i);
                    }
                    // Error
                    else {
                        onError(xhr, i);
                    }
                }
            };

            xhr.send();
        }
    });
}


// Export
// =============================================================================
export default getUrls;
