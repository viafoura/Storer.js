/**
 * Executes callback on DOMReady/DOMContentLoaded/readyState/onload or immediately if already loaded
 * @param {Function} callback
 * @author Shahyar G <github.com/shahyar>
 * @license CC-BY 3.0 <creativecommons.org/licenses/by/3.0>: Keep @author intact.
 */
var domReady = (function () {
    var _isReady, fn,
        t = 20,
        callbacks = [],
        sZT = typeof setZeroTimeout === 'function';

    /**
     * Triggers callback immediately
     * @param {Function} callback
     */
    function _readyReady(callback) {
        sZT ? setZeroTimeout(callback, 0) : callback();
    }

    // Already ready?
    if (document.readyState === 'complete' || ((document.readyState === 'interactive' && navigator.appName.indexOf('Microsoft') === -1) || document.readyState === 'complete')) { /* Fast HTML5 */
        return _readyReady;
    }

    /**
     * Calls all callbacks in setZeroTimeout, or synchronous
     */
    function _doCallbacks() {
        domReady = _readyReady;
        _isReady = 1;
        for (var i = 0; i < callbacks.length; i++) {
            sZT ? setZeroTimeout(callbacks[i], 0) : callbacks[i]();
        }
        callbacks.length = 0;

        function _untilDom() {
            if (typeof publish === 'function') {
                publish('domReady');
            } else {
                setTimeout(_untilDom, 50);
            }
        }
        _untilDom();
    }

    /**
     * Adds callback to the array
     * @param {Function} callback
     */
    function _addCallback(callback) {
        if (!_isReady) {
            callbacks.push(callback);
        } else {
            sZT ? setZeroTimeout(callback, 0) : callback();
        }
    }

    if (document.addEventListener) { /* W3C */
        fn = function () {
            if (!_isReady) {
                _doCallbacks();
            }
            document.removeEventListener('DOMContentLoaded', fn, false);
        };
        document.addEventListener('DOMContentLoaded', fn, false);
    } else if (document.attachEvent && document.documentElement.doScroll && window == top) { /* Internet Explorer */
        if (window.frameElement) { /* IE in a frame */
            fn = function () {
                if (document.readyState === "complete") {
                    if (!_isReady) {
                        _doCallbacks();
                    }
                    document.detachEvent('onreadystatechange', fn);
                }
            }
            document.attachEvent("onreadystatechange", fn);
        } else { /* IE normal */
            fn = function () {
                if (!_isReady) {
                    try {
                        document.documentElement.doScroll("left");
                    } catch (e) {
                        setTimeout(fn, t);
                        return;
                    }
                    _doCallbacks();
                }
            };
            fn();
        }
    } else if (document.readyState !== undefined) { /* WebKit, KHTML */
        fn = function () {
            if (document.readyState === 'complete') {
                if (!_isReady) {
                    _doCallbacks();
                }
            } else {
                setTimeout(fn, t);
            }
        };
        fn();
    } else {
        window.onload = (function (last) {
            return function () {
                last && last();
                _doCallbacks();
            };
        }(window.onload));
    }

    return _addCallback;
}());
