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


    // Tests: Ignored
    // -------------------------------------------------------------------------
    it('ignores invalid nodes (must be <link> or <style>)', function(done) {
        const styleCss = fixtures['style1.css'];

        createElmsWrap('<div>Test</div>', { appendTo: 'body' });
        createElmsWrap(`<style>${styleCss}</style>`);

        getCss({
            include: '[data-test]',
            onComplete(cssText, cssArray, nodeArray) {
                expect(cssText).to.equal(styleCss);
                done();
            }
        });
    });


    // Tests: <style> CSS
    // -------------------------------------------------------------------------
    describe('<style> nodes', function() {
        it('returns CSS from single <style> node', function(done) {
            const styleCss = fixtures['style1.css'];

            createElmsWrap(`<style>${styleCss}</style>`);

            getCss({
                include: '[data-test]',
                onComplete(cssText, cssArray, nodeArray) {
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
                include: '[data-test]',
                onComplete(cssText, cssArray, nodeArray) {
                    expect(cssText).to.equal(expected);
                    done();
                }
            });
        });

        it('returns CSS from multiple <style> nodes with single @import in same directory', function(done) {
            const styleCss = '@import "/base/tests/fixtures/style2.css";';
            const styleElms = createElmsWrap(`<style>${styleCss}</style>`.repeat(2));
            const expected = fixtures['style2.out.css'].repeat(styleElms.length);

            getCss({
                include: '[data-test]',
                onComplete(cssText, cssArray, nodeArray) {
                    expect(cssText).to.equal(expected);
                    done();
                }
            });
        });

        it('returns CSS from multiple <style> nodes with chained @imports in same directory', function(done) {
            const styleCss  = '@import "/base/tests/fixtures/style3.css";';
            const styleElms = createElmsWrap(`<style>${styleCss}</style>`.repeat(2));
            const expected  = fixtures['style3.out.css'].repeat(styleElms.length);

            getCss({
                include: '[data-test]',
                onComplete(cssText, cssArray, nodeArray) {
                    expect(cssText).to.equal(expected);
                    done();
                }
            });
        });

        it('returns CSS from multiple <style> nodes with chained @imports in different directories', function(done) {
            const styleCss = '@import "/base/tests/fixtures/a/import.css";';
            const expected = fixtures['style1.css'].repeat(6);

            createElmsWrap(`<style>${styleCss}</style>`.repeat(2));

            getCss({
                include: '[data-test]',
                onComplete(cssText, cssArray, nodeArray) {
                    cssText = cssText.replace(/\n/g, '');
                    expect(cssText).to.equal(expected);
                    done();
                }
            });
        });
    });


    // Tests: <link> CSS
    // -------------------------------------------------------------------------
    describe('<link> nodes', function() {
        it('returns CSS from single <link> node', function(done) {
            const linkUrl  = '/base/tests/fixtures/style1.css';
            const expected = fixtures['style1.css'];

            createElmsWrap(`<link rel="stylesheet" href="${linkUrl}">`);

            getCss({
                include: '[data-test]',
                onComplete(cssText, cssArray, nodeArray) {
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
                        include: '[data-test]',
                        onComplete(cssText, cssArray, nodeArray) {
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
                include: '[data-test]',
                onComplete(cssText, cssArray, nodeArray) {
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
                include: '[data-test]',
                onComplete(cssText, cssArray, nodeArray) {
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
                include: '[data-test]',
                onComplete(cssText, cssArray, nodeArray) {
                    expect(cssText).to.equal(expected);
                    done();
                }
            });
        });
    });


    // Tests: <link> & <style> CSS
    // -------------------------------------------------------------------------
    it('returns CSS From multile <link> and <style> nodes in <head> and <body>', function(done) {
        const linkUrl   = '/base/tests/fixtures/style1.css';
        const styleCss  = fixtures['style1.css'];
        const elms      = createElmsWrap([
            { tag: 'link', attr: { rel: 'stylesheet', href: linkUrl }},
            { tag: 'link', attr: { rel: 'stylesheet', href: linkUrl }, appendTo: 'body' },
            { tag: 'style', text: styleCss },
            { tag: 'style', text: styleCss, appendTo: 'body' }
        ]);
        const expected  = styleCss.repeat(elms.length);

        getCss({
            onComplete(cssText, cssArray, nodeArray) {
                expect(cssText).to.equal(expected);
                done();
            }
        });
    });


    // Tests: Options
    // -------------------------------------------------------------------------
    describe('Options', function() {
        it('options.exclude', function(done) {
            const linkUrl  = '/base/tests/fixtures/style1.css';
            const styleCss = fixtures['style1.css'];

            createElmsWrap(`<link rel="stylesheet" href="${linkUrl}">`);
            createElmsWrap(`<style>${styleCss}</style>`);

            getCss({
                include: '[data-test]',
                exclude: 'link',
                onComplete(cssText, cssArray, nodeArray) {
                    expect(cssText).to.equal(styleCss);
                    done();
                }
            });
        });

        it('options.filter', function(done) {
            const linkUrl  = '/base/tests/fixtures/style1.css';
            const styleCss = '.keepme { color: red; }';

            createElmsWrap(`<link rel="stylesheet" href="${linkUrl}">`);
            createElmsWrap(`<style>${styleCss}</style>`);

            getCss({
                include: '[data-test]',
                filter : /keepme/,
                onComplete(cssText, cssArray, nodeArray) {
                    expect(cssText).to.equal(styleCss);
                    done();
                }
            });
        });

        it('options.parseRuntime', function(done) {
            const styleCss = fixtures['style1.css'];
            const styleElm = createElmsWrap({ tag: 'style' })[0];

            getCss({
                include: '[data-test]',
                parseRuntime: false,
                onComplete(cssText, cssArray, nodeArray) {
                    expect(cssText, 'Before insertRule()').to.equal('');
                }
            });

            styleElm.sheet.insertRule(styleCss, 0);

            getCss({
                include: '[data-test]',
                parseRuntime: true,
                onComplete(cssText, cssArray, nodeArray) {
                    expect(cssText, 'After insertRule()').to.equal(styleCss);
                    done();
                }
            });
        });
    });


    // Tests: Callbacks
    // -------------------------------------------------------------------------
    describe('Callbacks', function() {
        it('triggers onBeforeSend callback for each @import', function(done) {
            let onBeforeSendCount = 0;

            createElmsWrap({
                tag : 'style',
                text: '@import "/base/tests/fixtures/style1.css";@import "/base/tests/fixtures/style2.css";'
            });

            getCss({
                include: '[data-test]',
                onBeforeSend(xhr, node, url) {
                    onBeforeSendCount++;
                },
                onComplete(cssText, cssArray, nodeArray) {
                    expect(onBeforeSendCount, '<link> count').to.equal(3);
                    done();
                }
            });
        });

        it('triggers onBeforeSend callback for each <link> node', function(done) {
            let onBeforeSendCount = 0;

            createElmsWrap({
                tag : 'link',
                attr: { rel: 'stylesheet', href: '/base/tests/fixtures/style1.css' }
            });

            getCss({
                include: '[data-test]',
                onBeforeSend(xhr, node, url) {
                    onBeforeSendCount++;
                },
                onComplete(cssText, cssArray, nodeArray) {
                    expect(onBeforeSendCount, '<link> count').to.equal(1);
                    done();
                }
            });
        });

        it('triggers onSuccess callback for each <style> node', function(done) {
            const styleCss  = fixtures['style1.css'];
            const styleElms = createElmsWrap(`<style>${styleCss}</style>`.repeat(2));

            let onSuccessCount = 0;

            getCss({
                include: '[data-test]',
                onSuccess(cssText, node, url) {
                    onSuccessCount++;

                    return '!';
                },
                onComplete(cssText, cssArray, nodeArray) {
                    expect(cssText, 'return value').to.equal('!'.repeat(styleElms.length));
                    expect(onSuccessCount, 'onSuccess count').to.equal(styleElms.length);
                    done();
                }
            });
        });

        it('triggers onSuccess callback for each <link> node', function(done) {
            const linkUrl  = '/base/tests/fixtures/style1.css';
            const linkElms = createElmsWrap(`<link rel="stylesheet" href="${linkUrl}">`.repeat(2));

            let onSuccessCount = 0;

            getCss({
                include: '[data-test]',
                onSuccess(cssText, node, url) {
                    onSuccessCount++;

                    return '!';
                },
                onComplete(cssText, cssArray, nodeArray) {
                    expect(cssText, 'return value').to.equal('!'.repeat(linkElms.length));
                    expect(onSuccessCount, 'onSuccess count').to.equal(linkElms.length);
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
                onSuccess(cssText, node, url) {
                    return false;
                },
                onComplete(cssText, cssArray, nodeArray) {
                    expect(cssText).to.equal('');
                    done();
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
                onSuccess(cssText, node, url) {
                    return modifiedCss;
                },
                onComplete(cssText, cssArray, nodeArray) {
                    expect(cssText).to.equal(modifiedCss.repeat(2));
                    done();
                }
            });
        });

        it('triggers onError callback for each <style> node', function(done) {
            const styleCss = '@import "fail.css";';
            const styleElms = createElmsWrap(`<style>${styleCss}</style>`.repeat(3));

            let onErrorCount = 0;

            getCss({
                include: '[data-test]',
                onError(xhr, node, url) {
                    onErrorCount++;
                },
                onComplete(cssText, cssArray, nodeArray) {
                    expect(onErrorCount).to.equal(styleElms.length);
                    done();
                }
            });
        });

        it('triggers onError callback for each <link> node', function(done) {
            const linkUrl  = 'fail.css';
            const linkElms = createElmsWrap(`<link rel="stylesheet" href="${linkUrl}">`.repeat(2));

            let onErrorCount = 0;

            getCss({
                include: '[data-test]',
                onError(xhr, node, url) {
                    onErrorCount++;
                },
                onComplete(cssText, cssArray, nodeArray) {
                    expect(onErrorCount).to.equal(linkElms.length);
                    done();
                }
            });
        });

        it('triggers onComplete callback with no matching <style> or <link> nodes', function(done) {
            const testSelector = '[fail]';
            const testElms     = document.querySelectorAll(testSelector);

            getCss({
                include: testSelector,
                onComplete(cssText, cssArray, nodeArray) {
                    expect(testElms.length).to.equal(0);
                    done();
                }
            });
        });
    });
});
