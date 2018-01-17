/*!
 * get-css-data
 * v1.0.0
 * https://github.com/jhildenbiddle/get-css-data
 * (c) 2018 John Hildenbiddle <http://hildenbiddle.com>
 * MIT license
 */
!function(e, t) {
    "object" == typeof exports && "undefined" != typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define(t) : e.getCssData = t();
}(this, function() {
    "use strict";
    function e(e) {
        var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {}, o = {
            mimeType: t.mimeType || null,
            onComplete: t.onComplete || Function.prototype,
            onError: t.onError || Function.prototype,
            onSuccess: t.onSuccess || Function.prototype
        }, n = Array.isArray(e) ? e : [ e ], r = Array.apply(null, Array(n.length)).map(function(e) {
            return null;
        });
        function c(e, t) {
            o.onError(e, n[t], t);
        }
        function i(e, t) {
            r[t] = e, o.onSuccess(e, n[t], t), -1 === r.indexOf(null) && o.onComplete(r);
        }
        n.forEach(function(e, t) {
            var n = document.createElement("a");
            n.setAttribute("href", e), n.href = n.href;
            var r = n.host !== location.host, l = n.protocol === location.protocol;
            if (r && "undefined" != typeof XDomainRequest) if (l) {
                var s = new XDomainRequest();
                s.open("GET", e), s.timeout = 0, s.onprogress = Function.prototype, s.ontimeout = Function.prototype, 
                s.onload = function() {
                    i(s.responseText, t);
                }, s.onerror = function(e) {
                    c(s, t);
                }, setTimeout(function() {
                    s.send();
                }, 0);
            } else console.log("Internet Explorer 9 Cross-Origin (CORS) requests must use the same protocol"), 
            c(null, t); else {
                var u = new XMLHttpRequest();
                u.open("GET", e), o.mimeType && u.overrideMimeType && u.overrideMimeType(o.mimeType), 
                u.onreadystatechange = function() {
                    4 === u.readyState && (200 === u.status ? i(u.responseText, t) : c(u, t));
                }, u.send();
            }
        });
    }
    function t(e) {
        var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : location.href, o = document.implementation.createHTMLDocument(""), n = o.createElement("base"), r = o.createElement("a");
        return o.head.appendChild(n), o.body.appendChild(r), n.href = t, r.href = e, r.href;
    }
    return function(o) {
        var n = {
            cssComments: /\/\*[\s\S]+?\*\//gm,
            cssImports: /(?:@import\s*)(?:url\(\s*)?(?:['"])([\w\-./ ]*)(?:['"])(?:\s*\))?(?:[^;]*;)/gim
        }, r = {
            include: o.include || 'style,link[rel="stylesheet"]',
            exclude: o.exclude || null,
            filter: o.filter || null,
            onComplete: o.onComplete || Function.prototype,
            onError: o.onError || Function.prototype,
            onSuccess: o.onSuccess || Function.prototype
        }, c = Array.apply(null, document.querySelectorAll(r.include)).filter(function(e) {
            return t = e, o = r.exclude, !(t.matches || t.matchesSelector || t.webkitMatchesSelector || t.mozMatchesSelector || t.msMatchesSelector || t.oMatchesSelector).call(t, o);
            var t, o;
        }), i = Array.apply(null, Array(c.length)).map(function(e) {
            return null;
        });
        function l() {
            if (-1 === i.indexOf(null)) {
                var e = i.join("");
                r.onComplete(e, i);
            }
        }
        function s(e, t, o, n) {
            i[o] = "", r.onError(e, n, t), l();
        }
        function u(o, c, a, p, f) {
            if (!r.filter || r.filter.test(o)) {
                var m = r.onSuccess(o, a, f || p), d = (o = !1 === m ? "" : m || o).replace(n.cssComments, "").match(n.cssImports);
                if (d) {
                    var y = d.map(function(e) {
                        return e.replace(n.cssImports, "$1");
                    });
                    e(y = y.map(function(e) {
                        return t(e, p);
                    }), {
                        onError: function(e, t, o) {
                            s(e, t, c, a);
                        },
                        onSuccess: function(e, t, n) {
                            var r = d[n], i = y[n];
                            u(o.replace(r, e), c, a, t, i);
                        }
                    });
                } else i[c] = o, l();
            } else i[c] = "", l();
        }
        c.forEach(function(o, n) {
            var r = o.getAttribute("href"), c = o.getAttribute("rel"), a = "LINK" === o.nodeName && r && c && "stylesheet" === c.toLowerCase(), p = "STYLE" === o.nodeName;
            a ? e(r, {
                mimeType: "text/css",
                onError: function(e, t, r) {
                    s(e, t, n, o);
                },
                onSuccess: function(e, c, i) {
                    var l = t(r, location.href);
                    u(e, n, o, l);
                }
            }) : p ? u(o.textContent, n, o, location.href) : (i[n] = "", l());
        });
    };
});
//# sourceMappingURL=get-css-data.js.map
