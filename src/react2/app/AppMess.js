// raf polyfill
// apear
// velocity animations

'use strict';

var AppMess = {


    init: function() {

        (function() {
            //raf polyfill
            'use strict';if(!Date.now)Date.now=function(){return(new Date).getTime()};(function(){var n=['webkit','moz'];for(var e=0;e<n.length&&!window.requestAnimationFrame;++e){var i=n[e];window.requestAnimationFrame=window[i+'RequestAnimationFrame'];window.cancelAnimationFrame=window[i+'CancelAnimationFrame']||window[i+'CancelRequestAnimationFrame']}if(/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent)||!window.requestAnimationFrame||!window.cancelAnimationFrame){var a=0;window.requestAnimationFrame=function(n){var e=Date.now();var i=Math.max(a+16,e);return setTimeout(function(){n(a=i)},i-e)};window.cancelAnimationFrame=clearTimeout}})();
        })();

        /* appear.min.js 0.0.14 */
        appear = function() {
            'use strict';
            function e() {
                var e = window.scrollY || window.pageYOffset;null != n && (o.velocity = e - n, o.delta = o.velocity >= 0 ? o.velocity : -1 * o.velocity), n = e, i && clearTimeout(i), i = setTimeout(function() {
                    n = null
                }, 30)
            }
            function t(e, t) {
                var n = e.getBoundingClientRect();return n.top + n.height >= 0 && n.left + n.width >= 0 && n.bottom - n.height <= (window.innerHeight || document.documentElement.clientHeight) + t && n.right - n.width <= (window.innerWidth || document.documentElement.clientWidth) + t
            }
            var n = null,
                i = 0,
                o = {};
            return addEventListener('scroll', e), function(e) {
                    return function() {
                        function e(e, t) {
                            return function() {
                                var n = this,
                                    i = arguments;
                                clearTimeout(c), c = setTimeout(function() {
                                    e.apply(n, i)
                                }, t)
                            }
                        }
                        function n() {
                            o.delta < w.delta.speed && (l || (l = !0, u(), setTimeout(function() {
                                l = !1
                            }, w.delta.timeout))), e(function() {
                                u()
                            }, w.debounce)()
                        }
                        function i() {
                            u(), addEventListener('scroll', n), addEventListener('resize', n)
                        }
                        function r() {
                            m = [], c && clearTimeout(c), a()
                        }
                        function a() {
                            removeEventListener('scroll', n), removeEventListener('resize', n)
                        }
                        function u() {
                            s || (m.forEach(function(e, n) {
                                e && t(e, w.bounds) ? v[n] && (v[n] = !1, h++, w.appear && w.appear(e), w.disappear || w.reappear || (m[n] = null)) : (v[n] === !1 && (w.disappear && w.disappear(e), g++, w.reappear || (m[n] = null)), v[n] = !0)
                            }), w.reappear || w.appear && (!w.appear || h !== p) || w.disappear && (!w.disappear || g !== p) || (s = !0, a(), w.done && w.done()))
                        }
                        function d() {
                            if (!f) {
                                f = !0, w.init && w.init();
                                var e;
                                if (e = 'function' == typeof w.elements ? w.elements() : w.elements) {
                                    p = e.length;
                                    for (var t = 0; p > t; t += 1) {
                                        m.push(e[t]), v.push(!0);
                                    }
                                    i()
                                }
                            }
                        }
                        var p, c, l, s,
                            f = !1,
                            m = [],
                            v = [],
                            h = 0,
                            g = 0,
                            w = {};
                        return function(e) {
                            return e = e || {}, w = {
                                    init: e.init,
                                    elements: e.elements,
                                    appear: e.appear,
                                    disappear: e.disappear,
                                    done: e.done,
                                    reappear: e.reappear,
                                    bounds: e.bounds || 0,
                                    debounce: e.debounce || 50,
                                    delta: {
                                        speed: e.deltaSpeed || 50,
                                        timeout: e.deltaTimeout || 500
                                    }
                                }, addEventListener('DOMContentLoaded', d), 'complete' === document.readyState && d(), {
                                    trigger: function() {
                                        u()
                                    },
                                    pause: function() {
                                        a()
                                    },
                                    resume: function() {
                                        i()
                                    },
                                    destroy: function() {
                                        r()
                                    }
                            }
                        }
                    }()(e)
            }
        }();

        (function() {

            Velocity.RegisterEffect('callout.pulse6', {
                defaultDuration: 300,
                calls: [
                    [ { scaleX: 1.3 }, 0.20 ],
                    [ { scaleX: 1 }, 0.20 ]
                ]
            });

            Velocity.RegisterEffect('callout.pulseSide', {
                defaultDuration: 300,
                calls: [
                    [ { scaleX: 0.1 }, 0.20 ],
                    [ { scaleX: 1.05 }, 0.20 ],
                    [ { scaleX: 1 }, 0.20 ]
                ]
            });

            Velocity.RegisterEffect('callout.pulseDown', {
                defaultDuration: 300,
                calls: [
                    [ { scaleY: 0.1 }, 0.20 ],
                    [ { scaleY: 1.05 }, 0.20 ],
                    [ { scaleY: 1 }, 0.20 ]
                ]
            });

            Velocity.RegisterEffect('callout.settings', {
                defaultDuration: 300,
                calls: [
                    [ { scaleY: 0.1 }, 0.20 ],
                    [ { scaleY: 1.05 }, 0.20 ],
                    [ { scaleY: 1 }, 0.20 ]
                ]
            });


            Velocity.RegisterEffect('callout.top', {
                defaultDuration: 100,
                calls: [
                    [ { top: '10px', colorRed: '50%' }, 0.20 ],
                    [ { colorRed: '50%' }, 0.20 ]
                ]
            });

            Velocity.RegisterEffect('callout.settings8', {
                defaultDuration: 200,
                calls: [
                    //[ { width: '99%' }, 0.20 ],
                    [ { scaleX: 1.15, scaleY: 1.15 }, 0.20 ],
                    [ { scaleX: 1, scaleY: 1 }, 0.20 ]
                ]
            });

        })();

    }

};

module.exports = AppMess;
