// Dependencies
// =============================================================================
import axios      from 'axios';
import createElms from 'create-elms';
import getCss     from '../src/get-css';
import { expect } from 'chai';


// Helpers
// =============================================================================
function createElmsWrap(elmData, sharedOptions = {}) {
    sharedOptions = Object.assign({}, {
        attr    : Object.assign({ 'data-test': true }, sharedOptions.attr || {}),
        appendTo: 'head'
    }, sharedOptions);

    return createElms(elmData, sharedOptions);
}


// Suite
// =============================================================================
describe('get-css', function() {
    const fixtures = {};


    // Hooks
    // -------------------------------------------------------------------------
    before(async function() {
        const fixtureBaseUrl = '/base/tests/fixtures/';
        const fixtureUrls    = [
            'style1.css',
            'style2.css',
            'style2.out.css',
            'style3.css',
            'style3.out.css'
        ];

        // Load Fixtures
        await axios.all(fixtureUrls.map(url => axios.get(`${fixtureBaseUrl}${url}`)))
            .then(axios.spread(function (...responseArr) {
                responseArr.forEach((response, i) => {
                    const key = fixtureUrls[i];
                    const val = response.data;

                    fixtures[key] = val;
                });
            }));
    });

    // Remove <link> and <style> elements added for each test
    beforeEach(function() {
        const testNodes = document.querySelectorAll('[data-test]');

        for (let i = 0; i < testNodes.length; i++) {
            testNodes[i].parentNode.removeChild(testNodes[i]);
        }
    });


    // Tests: <style> CSS
    // -------------------------------------------------------------------------
    it('returns CSS from single <style> node', function(done) {
        const styleCss = fixtures['style1.css'];

        createElmsWrap(`<style>${styleCss}</style>`);

        getCss({
            include: 'style[data-test]',
            onComplete(cssText, cssQueue) {
                expect(cssText).to.equal(styleCss);
                done();
            }
        });
    });

    it('returns CSS from multiple <style> nodes', function(done) {
        const styleCss  = fixtures['style1.css'];
        const styleElms = createElmsWrap(`<style>${styleCss}</style>`.repeat(2));
        const expected  = styleCss.repeat(styleElms.length);

        getCss({
            include: 'style[data-test]',
            onComplete(cssText, cssQueue) {
                expect(cssText).to.equal(expected);
                done();
            }
        });
    });

    it('returns CSS from multiple <style> nodes with flat @import', function(done) {
        const styleCss = '@import "/base/tests/fixtures/style2.css";';
        const styleElms = createElmsWrap(`<style>${styleCss}</style>`.repeat(2));
        const expected = fixtures['style2.out.css'].repeat(styleElms.length);

        getCss({
            include: 'style[data-test]',
            onComplete(cssText, cssQueue) {
                expect(cssText).to.equal(expected);
                done();
            }
        });
    });

    it('returns CSS from multiple <style> nodes with nested @import', function(done) {
        const styleCss  = '@import "/base/tests/fixtures/style3.css";';
        const styleElms = createElmsWrap(`<style>${styleCss}</style>`.repeat(2));
        const expected  = fixtures['style3.out.css'].repeat(styleElms.length);

        getCss({
            include: 'style[data-test]',
            onComplete(cssText, cssQueue) {
                expect(cssText).to.equal(expected);
                done();
            }
        });
    });


    // Tests: <link> CSS
    // -------------------------------------------------------------------------
    it('returns CSS from single <link> node', function(done) {
        const linkUrl  = '/base/tests/fixtures/style1.css';
        const expected = fixtures['style1.css'];

        createElmsWrap(`<link rel="stylesheet" href="${linkUrl}">`);

        getCss({
            include: 'link[data-test]',
            onComplete(cssText, cssQueue) {
                expect(cssText).to.equal(expected);
                done();
            }
        });
    });

    it('returns CSS from single <link> node via CORS', function(done) {
        // Must be CORS-enabled link using same protocol (http://) for IE9
        const linkUrl = 'http://cdn.jsdelivr.net/npm/get-css-data@1.0.0/tests/fixtures/style1.css';

        axios.get(linkUrl)
            .then(response => response.data)
            .then(expected => {
                createElmsWrap(`<link rel="stylesheet" href="${linkUrl}">`);

                getCss({
                    include: 'link[data-test]',
                    onComplete(cssText, cssQueue) {
                        expect(cssText).to.equal(expected);
                        done();
                    }
                });
            });
    });

    it('returns CSS from multiple <link> nodes', function(done) {
        const linkUrl  = '/base/tests/fixtures/style1.css';
        const linkElms = createElmsWrap(`<link rel="stylesheet" href="${linkUrl}">`.repeat(2));
        const expected = fixtures['style1.css'].repeat(linkElms.length);

        getCss({
            include: 'link[data-test]',
            onComplete(cssText, cssQueue) {
                expect(cssText).to.equal(expected);
                done();
            }
        });
    });

    it('returns CSS from multiple <link> nodes with flat @import', function(done) {
        const linkUrl  = '/base/tests/fixtures/style2.css';
        const linkElms = createElmsWrap(`<link rel="stylesheet" href="${linkUrl}">`.repeat(2));
        const expected = fixtures['style2.out.css'].repeat(linkElms.length);

        getCss({
            include: 'link[data-test]',
            onComplete(cssText, cssQueue) {
                expect(cssText).to.equal(expected);
                done();
            }
        });
    });

    it('returns CSS from multiple <link> nodes with nested @import', function(done) {
        const linkUrl  = '/base/tests/fixtures/style3.css';
        const linkElms = createElmsWrap(`<link rel="stylesheet" href="${linkUrl}">`.repeat(2));
        const expected = fixtures['style3.out.css'].repeat(linkElms.length);

        getCss({
            include: 'link[data-test]',
            onComplete(cssText, cssQueue) {
                expect(cssText).to.equal(expected);
                done();
            }
        });
    });


    // Tests: Callbacks
    // -------------------------------------------------------------------------
    it('triggers onError callback for each <style> node', function(done) {
        const styleCss = '@import "fail.css";';
        const styleElms = createElmsWrap(`<style>${styleCss}</style>`.repeat(2));

        let onErrorCount = 0;

        getCss({
            include: 'style[data-test]',
            onComplete(cssText) {
                expect(onErrorCount).to.equal(styleElms.length);
                done();
            },
            onError(xhr, node, url) {
                onErrorCount++;
            }
        });
    });

    it('triggers onSuccess callback for each <style> node', function(done) {
        const styleCss  = fixtures['style1.css'];
        const styleElms = createElmsWrap(`<style>${styleCss}</style>`.repeat(2));

        let onSuccessCount = 0;

        getCss({
            include: 'style[data-test]',
            onComplete(cssText) {
                expect(onSuccessCount).to.equal(styleElms.length);
                done();
            },
            onSuccess(cssText, node, url) {
                onSuccessCount++;
            }
        });
    });


    it('triggers onError callback for each <link> node', function(done) {
        const linkUrl  = 'fail.css';
        const linkElms = createElmsWrap(`<link rel="stylesheet" href="${linkUrl}">`.repeat(2));

        let onErrorCount = 0;

        getCss({
            include: 'link[data-test]',
            onComplete(cssText) {
                expect(onErrorCount).to.equal(linkElms.length);
                done();
            },
            onError(xhr, node, url) {
                onErrorCount++;
            }
        });
    });

    it('triggers onSuccess callback for each <link> node', function(done) {
        const linkUrl  = '/base/tests/fixtures/style1.css';
        const linkElms = createElmsWrap(`<link rel="stylesheet" href="${linkUrl}">`.repeat(2));

        let onSuccessCount = 0;

        getCss({
            include: 'link[data-test]',
            onComplete(cssText) {
                expect(onSuccessCount).to.equal(linkElms.length);
                done();
            },
            onSuccess(cssText, node, url) {
                onSuccessCount++;
            }
        });
    });


    // Tests: Filters
    // -------------------------------------------------------------------------
    it('detects all <link rel="stylesheet"> and <style> nodes by default', function(done) {
        const linkUrl   = '/base/tests/fixtures/style1.css';
        const styleCss  = fixtures['style1.css'];
        const elms = Array.prototype.concat(
            createElmsWrap(`<link rel="stylesheet" href="${linkUrl}">`),
            createElmsWrap(`<link rel="stylesheet" href="${linkUrl}">`, { appendTo: 'body' }),
            createElmsWrap(`<style>${styleCss}</style>`),
            createElmsWrap(`<style>${styleCss}</style>`, { appendTo: 'body' })
        );
        const expected = styleCss.repeat(elms.length);

        getCss({
            onComplete(cssText) {
                expect(cssText).to.equal(expected);
                done();
            }
        });
    });

    it('filters CSS nodes based on options.exclude', function(done) {
        const linkUrl  = '/base/tests/fixtures/style1.css';
        const styleCss = fixtures['style1.css'];

        createElmsWrap(`<link rel="stylesheet" href="${linkUrl}">`);
        createElmsWrap(`<style>${styleCss}</style>`);

        getCss({
            include: '[data-test]',
            exclude: 'link',
            onComplete(cssText) {
                expect(cssText).to.equal(styleCss);
                done();
            }
        });
    });

    it('filters CSS text based on options.filter', function(done) {
        const linkUrl  = '/base/tests/fixtures/style1.css';
        const styleCss = '.keepme { color: red; }';

        createElmsWrap(`<link rel="stylesheet" href="${linkUrl}">`);
        createElmsWrap(`<style>${styleCss}</style>`);

        getCss({
            include: '[data-test]',
            filter : /keepme/,
            onComplete(cssText) {
                expect(cssText).to.equal(styleCss);
                done();
            }
        });
    });

    it('filters CSS text based on onSuccess() value', function(done) {
        const linkUrl  = '/base/tests/fixtures/style1.css';
        const styleCss = fixtures['style1.css'];

        createElmsWrap(`<link rel="stylesheet" href="${linkUrl}">`);
        createElmsWrap(`<style>${styleCss}</style>`);

        getCss({
            include: '[data-test]',
            onComplete(cssText) {
                expect(cssText).to.equal('');
                done();
            },
            onSuccess(cssText, node, url) {
                return false;
            }
        });
    });

    it('modifies CSS text based on onSuccess() value', function(done) {
        const linkUrl     = '/base/tests/fixtures/style1.css';
        const styleCss    = fixtures['style1.css'];
        const modifiedCss = '.modified { color: red; }';

        createElmsWrap(`<link rel="stylesheet" href="${linkUrl}">`);
        createElmsWrap(`<style>${styleCss}</style>`);

        getCss({
            include: '[data-test]',
            onComplete(cssText) {
                expect(cssText).to.equal(modifiedCss.repeat(2));
                done();
            },
            onSuccess(cssText, node, url) {
                return modifiedCss;
            }
        });
    });

    it('ignores invalid nodes (must be <link> or <style>)', function(done) {
        const styleCss = fixtures['style1.css'];

        createElmsWrap('<div>Test</div>', { appendTo: 'body' });
        createElmsWrap(`<style>${styleCss}</style>`);

        getCss({
            include: '[data-test]',
            onComplete(cssText) {
                expect(cssText).to.equal(styleCss);
                done();
            }
        });
    });
});
