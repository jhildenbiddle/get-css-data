// Dependencies
// =============================================================================
import axios          from 'axios';
import createTestElms from './helpers/create-test-elms';
import getCss         from '../src/get-css';
import { expect }     from 'chai';


// Constants & Variables
// =============================================================================
const isIElte9 = document.all && !window.atob;


// Suite
// =============================================================================
describe('get-css', function() {
    const fixtures = window.__FIXTURES__;

    // Hooks
    // -------------------------------------------------------------------------
    // Conditionally include web component+polyfill to avoid errors in IE < 11
    before(function() {
        const hasWebComponentSupport = () => 'customElements' in window;
        const isNotIELessThan11      = navigator.appVersion.indexOf('MSIE') === -1;

        if (!hasWebComponentSupport() && isNotIELessThan11) {
            console.log('*** Injected: Web Component Polyfill ***');

            require('@webcomponents/webcomponentsjs/webcomponents-bundle.js');
        }

        if (hasWebComponentSupport()) {
            console.log('*** Injected: Web Component ***');

            require('./helpers/inject-test-component.js')();
        }
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

        createTestElms('<div>Test</div>', { appendTo: 'body' });
        createTestElms(`<style>${styleCss}</style>`);

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

            createTestElms(`<style>${styleCss}</style>`);

            getCss({
                include: '[data-test]',
                onComplete(cssText, cssArray, nodeArray) {
                    expect(cssText).to.equal(styleCss);
                    done();
                }
            });
        });

        it('returns CSS from single SVG <style> node', function(done) {
            const styleCss = 'circle { stroke: green; }';

            createTestElms(`
                <svg width="50" height="50" version="1.1" xmlns="http://www.w3.org/2000/svg">
                    <style>${ styleCss }</style>
                    <circle cx="25" cy="25" r="20" fill="yellow" stroke-width="5"/>
                </svg>
            `);

            getCss({
                include: 'svg style',
                onComplete(cssText, cssArray, nodeArray) {
                    expect(cssText).to.equal(styleCss);
                    done();
                }
            });
        });

        it('returns CSS from multiple <style> nodes', function(done) {
            const styleCss  = fixtures['style1.css'];
            const styleElms = createTestElms(`<style>${styleCss}</style>`.repeat(2));
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
            const styleElms = createTestElms(`<style>${styleCss}</style>`.repeat(2));
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
            const styleElms = createTestElms(`<style>${styleCss}</style>`.repeat(2));
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

            createTestElms(`<style>${styleCss}</style>`.repeat(2));

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

            createTestElms(`<link rel="stylesheet" href="${linkUrl}">`);

            getCss({
                include: '[data-test]',
                onComplete(cssText, cssArray, nodeArray) {
                    expect(cssText).to.equal(expected);
                    done();
                }
            });
        });

        it('returns CSS from single <link> node with data URI scheme', function(done) {
            const encodedCSS = encodeURIComponent(fixtures['style1.css']);
            const URIScheme  = `data:text/css;charset=UTF-8,${encodedCSS}`;
            const expected = fixtures['style1.css'];

            createTestElms(`<link rel="stylesheet" href="${URIScheme}" />`);

            getCss({
                include: '[data-test]',
                onComplete(cssText, cssArray, nodeArray) {
                    expect(cssText).to.equal(expected);
                    done();
                }
            });
        });

        it('returns CSS from single <link> node via CORS', function(done) {
            const linkProtocol = 'https:';
            const linkUrl      = `${linkProtocol}//cdn.jsdelivr.net/npm/get-css-data@1.0.0/tests/fixtures/style1.css`;

            createTestElms(`<link rel="stylesheet" href="${linkUrl}">`);

            // IE9 does not support CORS requests with different protocol
            if (isIElte9 & location.protocol !== linkProtocol) {
                getCss({
                    include: '[data-test]',
                    onError(xhr, node, url) {
                        done();
                    }
                });
            }
            else {
                axios.get(linkUrl)
                    .then(response => response.data)
                    .then(expected => {
                        getCss({
                            include: '[data-test]',
                            onComplete(cssText, cssArray, nodeArray) {
                                expect(cssText).to.equal(expected);
                                done();
                            }
                        });
                    });
            }
        });

        it('returns CSS from multiple <link> nodes', function(done) {
            const linkUrl  = '/base/tests/fixtures/style1.css';
            const linkElms = createTestElms(`<link rel="stylesheet" href="${linkUrl}">`.repeat(2));
            const expected = fixtures['style1.css'].repeat(linkElms.length);

            getCss({
                include: '[data-test]',
                onComplete(cssText, cssArray, nodeArray) {
                    expect(cssText).to.equal(expected);
                    done();
                }
            });
        });

        it('returns CSS from multiple <link> nodes with data URI scheme', function(done) {
            const encodedCSS = encodeURIComponent(fixtures['style1.css']);
            const URIScheme  = `data:text/css;charset=UTF-8,${encodedCSS}`;
            const linkElms = createTestElms(`<link rel="stylesheet" href="${URIScheme}">`.repeat(2));
            const expected = fixtures['style1.css'].repeat(linkElms.length);

            getCss({
                include: '[data-test]',
                onComplete(cssText, cssArray, nodeArray) {
                    expect(cssText).to.equal(expected);
                    done();
                }
            });
        });

        it('returns empty string from single <link> node w/ empty stylesheet', function(done) {
            const linkUrl  = '/base/tests/fixtures/style-empty.css';
            const expected = fixtures['style-empty.css'];

            createTestElms(`<link rel="stylesheet" href="${linkUrl}">`);

            getCss({
                include: '[data-test]',
                onError(xhr, node, url) {
                    console.log('Error', node, url);
                },
                onComplete(cssText, cssArray, nodeArray) {
                    expect(cssText).to.equal(expected);
                    done();
                }
            });
        });

        it('returns CSS from multiple <link> nodes with flat @import', function(done) {
            const linkUrl  = '/base/tests/fixtures/style2.css';
            const linkElms = createTestElms(`<link rel="stylesheet" href="${linkUrl}">`.repeat(2));
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
            const linkElms = createTestElms(`<link rel="stylesheet" href="${linkUrl}">`.repeat(2));
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
    it('returns CSS From multiple <link> and <style> nodes in <head> and <body>', function(done) {
        const linkUrl   = '/base/tests/fixtures/style1.css';
        const styleCss  = fixtures['style1.css'];
        const elms      = createTestElms([
            { tag: 'link', attr: { rel: 'stylesheet', href: linkUrl }},
            { tag: 'link', attr: { rel: 'stylesheet', href: linkUrl }, appendTo: 'body' },
            { tag: 'style', text: styleCss },
            { tag: 'style', text: styleCss, appendTo: 'body' }
        ]);
        const expected  = styleCss.repeat(elms.length);

        getCss({
            include: '[data-test]',
            onComplete(cssText, cssArray, nodeArray) {
                expect(cssText).to.equal(expected);
                done();
            }
        });
    });


    // Tests: Options
    // -------------------------------------------------------------------------
    describe('Options', function() {
        if (window.customElements) {
            it('options.rootElement', function(done) {
                const customElm      = createTestElms({ tag: 'test-component', attr: { 'data-text': 'Custom Element' } })[0];
                const shadowRoot     = customElm.shadowRoot;
                const shadowStyleCss = shadowRoot.querySelector('style').textContent;

                getCss({
                    rootElement: shadowRoot,
                    onComplete(cssText, cssArray, nodeArray) {
                        expect(cssText).to.equal(shadowStyleCss);
                        done();
                    }
                });
            });
        }

        it('options.exclude', function(done) {
            const linkUrl  = '/base/tests/fixtures/style1.css';
            const styleCss = fixtures['style1.css'];

            createTestElms(`<link rel="stylesheet" href="${linkUrl}">`);
            createTestElms(`<style>${styleCss}</style>`);

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

            createTestElms(`<link rel="stylesheet" href="${linkUrl}">`);
            createTestElms(`<style>${styleCss}</style>`);

            getCss({
                include: '[data-test]',
                filter : /keepme/,
                onComplete(cssText, cssArray, nodeArray) {
                    expect(cssText).to.equal(styleCss);
                    done();
                }
            });
        });

        it('options.skipDisabled', function(done) {
            const linkUrl  = '/base/tests/fixtures/style1.css';
            const styleCss = fixtures['style1.css'];

            const testElms = createTestElms([
                `<link rel="stylesheet" href="${linkUrl}" disabled>`,
                `<style>${styleCss}</style>`
            ]);

            for (const sheet of document.styleSheets) {
                sheet.disabled = true;
            }

            function step1() {
                getCss({
                    include     : '[data-test]',
                    skipDisabled: true,
                    onComplete(cssText, cssArray, nodeArray) {
                        expect(nodeArray.length, '1:nodeArray').to.equal(0);
                        expect(cssArray.length, '1:cssArray').to.equal(0);
                        expect(cssText, '1:cssText').to.equal('');

                        // Enable <style> sheet
                        testElms[1].sheet.disabled = false;

                        step2();
                    }
                });
            }

            function step2() {
                getCss({
                    include     : '[data-test]',
                    skipDisabled: true,
                    onComplete(cssText, cssArray, nodeArray) {
                        expect(nodeArray.length, '2:nodeArray').to.equal(1);
                        expect(cssArray.length, '2:cssArray').to.equal(1);
                        expect(cssText, '2:cssText').to.equal(styleCss);
                        step3();
                    }
                });
            }

            function step3() {
                getCss({
                    include     : '[data-test]',
                    skipDisabled: false,
                    onComplete(cssText, cssArray, nodeArray) {
                        expect(nodeArray.length, '3:nodeArray').to.equal(2);
                        expect(cssArray.length, '3:cssArray').to.equal(2);
                        expect(cssText, '3:cssText').to.equal(styleCss.repeat(2));
                        done();
                    }
                });
            }

            step1();
        });

        it('options.useCSSOM with <style>', function(done) {
            const styleCss = fixtures['style1.css'];
            const styleElm = createTestElms({ tag: 'style' })[0];

            getCss({
                include: '[data-test]',
                useCSSOM: false,
                onComplete(cssText, cssArray, nodeArray) {
                    expect(cssText, 'Before insertRule()').to.equal('');
                }
            });

            styleElm.sheet.insertRule(styleCss, 0);

            getCss({
                include: '[data-test]',
                useCSSOM: true,
                onComplete(cssText, cssArray, nodeArray) {
                    expect(cssText, 'After insertRule()').to.equal(styleCss);
                    done();
                }
            });
        });

        it('options.useCSSOM with data URI scheme', function(done) {
            const encodedCSS = encodeURIComponent(fixtures['style1.css']);
            const URIScheme  = `data:text/css;charset=UTF-8,${encodedCSS}`;
            const styleCss = fixtures['style1.css'];
            const styleElm = createTestElms(`<link rel="stylesheet" href="${URIScheme}" />`)[0];

            // Skip if unable to read cssRules to avoid failures due to CORS
            try {
                styleElm.sheet.cssRules;

                getCss({
                    include: '[data-test]',
                    useCSSOM: true,
                    onComplete(cssText, cssArray, nodeArray) {
                        expect(cssText).to.equal(styleCss);
                        done();
                    }
                });
            }
            catch(e) {
                this.skip();
            }
        });
    });


    // Tests: Callbacks
    // -------------------------------------------------------------------------
    describe('Callbacks', function() {
        it('triggers onBeforeSend callback for each @import', function(done) {
            let onBeforeSendCount = 0;

            createTestElms({
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

            createTestElms({
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
            const styleElms = createTestElms(`<style>${styleCss}</style>`.repeat(2));

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
            const linkElms = createTestElms(`<link rel="stylesheet" href="${linkUrl}">`.repeat(2));

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

        it('filters CSS and nodes based on onSuccess() return value', function(done) {
            const testElms = createTestElms([
                '<style>.one { color: red; }</style>',
                '<style>.two { color: green; }</style>',
                '<style>.three { color: blue; }</style>',
                '<style>.four { color: black; }</style>'
            ]);

            getCss({
                include: '[data-test]',
                onSuccess(cssText, node, url) {
                    const returnVals = [false, null, 0, ''];
                    const nodeIndex  = testElms.indexOf(node);

                    if (nodeIndex > -1) {
                        return returnVals[nodeIndex];
                    }
                },
                onComplete(cssText, cssArray, nodeArray) {
                    expect(cssText).to.equal('');
                    expect(cssArray.length).to.equal(0);
                    expect(nodeArray.length).to.equal(0);
                    done();
                }
            });
        });

        it('modifies CSS text based on onSuccess() value', function(done) {
            const linkUrl     = '/base/tests/fixtures/style1.css';
            const styleCss    = fixtures['style1.css'];
            const modifiedCss = '.modified { color: red; }';

            createTestElms(`<link rel="stylesheet" href="${linkUrl}">`);
            createTestElms(`<style>${styleCss}</style>`);

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

        it('triggers onError callback for each @import 404 error', function(done) {
            const styleCss = '@import "fail.css";';
            const styleElms = createTestElms(`<style>${styleCss}</style>`.repeat(3));

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

        it('triggers onError callback for each <link> 404 error', function(done) {
            const linkUrl  = 'fail.css';
            const linkElms = createTestElms(`<link rel="stylesheet" href="${linkUrl}">`.repeat(2));

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

        it('triggers onError callback for each invalid <link> XMLHttpRequest.responseText', function(done) {
            const linkUrl  = '/base/tests/fixtures/404.html';
            const linkElms = createTestElms(`<link rel="stylesheet" href="${linkUrl}">`.repeat(2));

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
