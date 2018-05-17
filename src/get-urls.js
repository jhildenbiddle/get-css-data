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
    urlArray.forEach((url, i) => {
        const parser = document.createElement('a');

        parser.setAttribute('href', url);
        parser.href = parser.href;

        const isCrossDomain  = parser.host !== location.host;
        const isSameProtocol = parser.protocol === location.protocol;

        // IE 9 CORS
        if (isCrossDomain && typeof XDomainRequest !== 'undefined') {
            if (isSameProtocol) {
                const xdr = new XDomainRequest();

                // Event handlers must be assigned AFTER xdr.open
                xdr.open('GET', url);

                xdr.timeout = 0; // Prevent aborts/timeouts
                xdr.onprogress = Function.prototype; // Prevent aborts/timeouts
                xdr.ontimeout = Function.prototype; // Prevent aborts/timeouts
                xdr.onload = function() {
                    onSuccess(xdr.responseText, i);
                };
                xdr.onerror = function(err) {
                    onError(xdr, i);
                };

                // Wrap in setTimeout to fix known issues wtih XDomainRequest
                // when sending multiple requests
                setTimeout(function() {
                    xdr.send();
                }, 0);
            }
            else {
                // eslint-disable-next-line
                console.log('Internet Explorer 9 Cross-Origin (CORS) requests must use the same protocol');
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
                    // Success
                    if (xhr.status === 200) {
                        onSuccess(xhr.responseText, i);
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
