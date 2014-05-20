/** Storer.js (light)
NaN * @copyright Viafoura, Inc. <viafoura.com>
 * @author Shahyar G <github.com/shahyar> for <github.com/viafoura>
 * @license CC-BY 3.0 <creativecommons.org/licenses/by/3.0>: Keep @copyright, @author intact.
 */

/**
 * This will return an object with each of the storage types.
 * The callback will fire when all of the necessary types have been created, although it's really only necessary
 * for Internet Explorer's userData storage, which requires domReady to begin.
 *
 * @author Shahyar G <github.com/shahyar> of Viafoura, Inc. <viafoura.com>
 * @param {Function} [callback]
 * @param {Object} [params]
 *                 {String}  [prefix='']                 automatic key prefix for sessionStorage and localStorage
 *                 {String}  [default_domain='']         default domain for cookies
 *                 {String}  [default_path='']           default path for cookies
 *                 {Boolean} [no_cookie_fallback=false]  If true, do not use cookies as fallback for localStorage
 * @return {Object} cookieStorage, localStorage, memoryStorage, sessionStorage
 */
window.initStorer = function (callback, params) {
    var _TESTID            = '__SG__',
        top                = window,
        PREFIX             = (params = Object.prototype.toString.call(callback) === "[object Object]" ? callback : (params || {})).prefix || '',
        NO_COOKIE_FALLBACK = params.no_cookie_fallback || false,
        _callbackNow       = true,
        cookieStorage, localStorage, memoryStorage, sessionStorage;

    // Allow passing params without callback
    if (params === callback) {
        callback = null;
    }

    // get top within cross-domain limit if we're in an iframe
    try { while (top !== top.top) { top = top.top; } } catch (e) {}

    /**
     * A hack for Safari's inability to extend a class with Storage.
     * @param {String} name
     * @param {Storage} StoreRef
     * @return {Object}
     */
    function _createReferencedStorage(name, StoreRef) {
        var store = {
            STORE_TYPE: 'ref' + name,
            key: function (key) {
                return StoreRef.key(key);
            },
            getItem: function (key) {
                return StoreRef.getItem(key);
            },
            setItem: function (key, value) {
                return StoreRef.setItem(key, value);
            },
            removeItem: function (key) {
                return StoreRef.removeItem(key);
            },
            clear: function () {
                return StoreRef.clear();
            }
        };
        Object.defineProperty(store, "length", { get: function () { return StoreRef.length; } });
        return store;
    }

    /**
     * A hack for IE8's inability to extend a class with Storage. We use a DOM property getter to apply length.
     * @param {String} name
     * @param {Storage} StoreRef
     * @return {Object}
     */
    function _createDOMStorage(name, StoreRef) {
        var store = document.createElement('div');
        store.STORE_TYPE    = 'DOM' + name;
        store.key           = StoreRef.key;
        store.getItem       = StoreRef.getItem;
        store.setItem       = StoreRef.setItem;
        store.removeItem    = StoreRef.removeItem;
        store.clear         = StoreRef.clear;
        Object.defineProperty(store, "length", { get: function () { return StoreRef.length; } });
        return store;
    }

    /**
     * Returns memoryStorage on failure
     * @param {String} [cookie_prefix] An additional prefix, useful for isolating fallbacks for local/sessionStorage.
     * @return {cookieStorage|memoryStorage}
     */
    function _createCookieStorage(cookie_prefix) {
        cookie_prefix        = (cookie_prefix || '') + PREFIX;
        var _cookiergx       = new RegExp("(?:^|;)\\s*" + cookie_prefix + "[^=]+\\s*=[^;]*", "g"),
            _nameclean       = new RegExp("^;?\\s*" + cookie_prefix),
            _cookiergxGlobal = new RegExp("(?:^|;)\\s*[^=]+\\s*=[^;]*", "g"),
            _namecleanGlobal = new RegExp("^;?\\s*"),
            _expire          = (new Date(1979)).toGMTString(),
            _cookieStorage   = {
            STORE_TYPE: 'cookieStorage',
            /** Default domain to use in cookieStorage.setItem
             * @const String */
            DEFAULT_DOMAIN: escape(params.default_domain || ''),
            /** Default path to use in cookieStorage.setItem
             * @const String */
            DEFAULT_PATH: escape(params.default_path || ''),

            // @todo property {int} length
            // @todo method {Function} key

            /**
             * Returns an Array of Objects of key-value pairs, or an Object with properties-values plus length.
             * @param {Boolean} [as_object=true]
             * @param {Boolean} [global=false] Omits prefix.
             * @return {Array|Object}
             */
            getAll: function (as_object, global) {
                var cleaner = global ? _namecleanGlobal : _nameclean,
                    matches = document.cookie.match(global ? _cookiergxGlobal : _cookiergx) || [],
                    i = matches.length, _cache;

                if (as_object === true) { // object of properties/values
                    for (_cache = {length: i}; i--;) {
                        _cache[unescape((matches[i] = matches[i].split('='))[0].replace(cleaner, ''))] = matches[i][1];
                    }
                } else { // array of key/value objects
                    for (_cache = []; i--;) {
                        _cache.push({ key: unescape((matches[i] = matches[i].split('='))[0].replace(cleaner, '')), value: matches[i][1] });
                    }
                }
                return _cache;
            },

            /**
             * Get a cookie by name
             * @param {String} key
             * @param {Boolean} [global=false] Omits prefix.
             * @return {String}
             */
            getItem: function (key, global) {
                if (!key || !this.hasItem(key, global)) {
                    return null;
                }
                return ((global = document.cookie.match(new RegExp('(?:^|;) *' + escape((global ? '' : cookie_prefix) + key) + '=([^;]*)(?:;|$)'))), global && global[0] ? unescape(global[1]) : null);
            },

            /**
             * cookieStorage.setItem(key, value, end, path, domain, is_secure);
             * @param {String} key name of the cookie
             * @param {String} value value of the cookie;
             * @param {Number|String|Date} [end] max-age in seconds (e.g., 31536e3 for a year) or the
             *  expires date in GMTString format or in Date Object format; if not specified it will expire at the end of session;
             * @param {String} [path] e.g., "/", "/mydir"; if not specified, defaults to the current path of the current document location;
             * @param {String} [domain] e.g., "example.com", ".example.com" (includes all subdomains) or "subdomain.example.com"; if not
             * specified, defaults to the host portion of the current document location;
             * @param {Boolean} [is_secure=false] cookie will be transmitted only over secure protocol as https;
             * @param {Boolean} [global=false] Omits prefix.
             * @return {Boolean}
             **/
            setItem: function (key, value, end, path, domain, is_secure, global) {
                if (!key || key === 'expires' || key === 'max-age' || key === 'path' || key === 'domain' || key === 'secure') {
                    return false;
                }
                var sExpires = "";
                if (end) {
                    switch (typeof end) {
                        case "number":
                            sExpires = "; max-age=" + end;
                            break;
                        case "string":
                            sExpires = "; expires=" + end;
                            break;
                        case "object":
                            if (end.hasOwnProperty("toGMTString")) {
                                sExpires = "; expires=" + end.toGMTString();
                            }
                            break;
                    }
                }
                if (value !== undefined && value !== null) {
                    domain = (domain = typeof domain === 'string' ? escape(domain) : _cookieStorage.DEFAULT_DOMAIN) ? '; domain=' + domain : '';
                    path   = (path   = typeof path   === 'string' ? escape(path)   : _cookieStorage.DEFAULT_PATH)   ? '; path=' + path : '';
                    document.cookie = escape((global ? '' : cookie_prefix) + key) + '=' + escape(value) + sExpires + domain + path + (is_secure ? '; secure' : '');
                    return true;
                }
                return _cookieStorage.removeItem(key, domain, path, is_secure, global);
            },

            /**
             * Get a cookie by name
             * @param {String} key
             * @param {String} [path]
             * @param {String} [domain]
             * @param {Boolean} [is_secure]
             * @param {Boolean} [global=false] Omits prefix.
             * @return {Boolean}
             */
            removeItem: function (key, domain, path, is_secure, global) {
                if (!key || !this.hasItem(key, global)) {
                    return false;
                }
                domain = (domain = typeof domain === 'string' ? escape(domain) : _cookieStorage.DEFAULT_DOMAIN) ? '; domain=' + domain : '';
                path   = (path   = typeof path   === 'string' ? escape(path)   : _cookieStorage.DEFAULT_PATH)   ? '; path=' + path : '';
                document.cookie = escape((global ? '' : cookie_prefix) + key) + '=; expires=' + _expire + domain + path + (is_secure ? '; secure' : '');
                return true;
            },

            /**
             * Returns true if a cookie with that name was found, false otherwise
             * @param {String} key
             * @param {Boolean} [global=false] Omits prefix.
             * @param {Boolean}
             */
            hasItem: function (key, global) {
                return (new RegExp('(?:^|;) *' + escape((global ? '' : cookie_prefix) + key) + '=')).test(document.cookie);
            }
        };

        _cookieStorage.setItem(_TESTID, 4);
        if (_cookieStorage.getItem(_TESTID) == 4) {
            _cookieStorage.removeItem(_TESTID);
            return _cookieStorage;
        }
        return _createMemoryStorage();
    }

    /**
     * Returns a memoryStorage object. This is a constructor to be reused as a fallback on sessionStorage & localStorage
     * @return {memoryStorage}
     */
    function _createMemoryStorage() {
        var _data  = {}, // key : data
            _keys  = [], // _keys key : _ikey key
            _ikey  = {}; // _ikey key : _keys key
        /**
         * @namespace memoryStorage
         */
        var _memoryStorage = {
            STORE_TYPE: 'memoryStorage',

            /** # of items */
            length: 0,

            /**
             * Get key name by id
             * @param {int} i
             * @return {mixed}
             */
            key: function (i) {
                return _keys[i];
            },

            /**
             * Get an item
             * @param {String} key
             * @return {mixed}
             */
            getItem: function (key) {
                return _data[key];
            },

            /**
             * Set an item
             * @param {String} key
             * @param {String} data
             * @return {String|Boolean}
             */
            setItem: function (key, data) {
                if (data !== null && data !== undefined) {
                    _ikey[key] === undefined && (_ikey[key] = (_memoryStorage.length = _keys.push(key)) - 1);
                    return (_data[key] = data);
                }
                return _memoryStorage.removeItem(key);
            },

            /**
             * Removes an item
             * @param {String} key
             * @return {Boolean}
             */
            removeItem: function (key) {
                var was = _data[key] !== undefined;
                if (_ikey[key] !== undefined) {
                    // re-reference all the keys because we've removed an item in between
                    for (var i = _keys.length; --i > _ikey[key];) {
                        _ikey[_keys[i]]--;
                    }
                    _keys.splice(_ikey[key], 1);
                    delete _ikey[key];
                }
                delete _data[key];
                _memoryStorage.length = _keys.length;
                return was;
            },

            /**
             * Clears memoryStorage
             */
            clear: function () {
                for (var i in _data) {
                    if (_data.hasOwnProperty(i)) {
                        delete _data[i];
                    }
                }
                _memoryStorage.length = _keys.length = 0;
                _ikey = {};
            }
        };
        return _memoryStorage;
    }

    // Return this stuff
    var _returnable = {
        'cookieStorage':        null,
        'localStorage':         null,
        'memoryStorage':        null,
        'sessionStorage':       null,
        '_createCookieStorage': _createCookieStorage,
        '_createMemoryStorage': _createMemoryStorage
    };

    /**
     * @instanceof cookieStorage
     */
    _returnable.cookieStorage = cookieStorage = _createCookieStorage();

    /**
     * @instanceof memoryStorage
     */
    _returnable.memoryStorage = memoryStorage = _createMemoryStorage();

    /**
     * @namespace sessionStorage
     */
    _returnable.sessionStorage = sessionStorage = (function () {
        // Grab sessionStorage from top window
        var _sessionStorage = top.sessionStorage;

        // Try to use original sessionStorage
        if (_sessionStorage) {
            try {
                // Test to make sure it works and isn't full
                _sessionStorage.setItem(_TESTID, 1);
                _sessionStorage.removeItem(_TESTID);

                // Now clone sessionStorage so that we may extend it with our own methods
                var _tmp = function () {
                };
                _tmp.prototype = _sessionStorage;
                _tmp = new _tmp();
                try {
                    if (_tmp.getItem) {
                        _tmp.setItem(_TESTID, 2);
                        _tmp.removeItem(_TESTID);
                    }
                } catch (e) {
                    // Firefox 14+ throws a security exception when wrapping a native class
                    _tmp = null;
                }

                if (_tmp && !_tmp.getItem) {
                    // Internet Explorer 8 does not inherit the prototype here. We can hack around it using a DOM object
                    _sessionStorage = _createDOMStorage('sessionstorage', _sessionStorage);
                } else if (!_tmp || Object.prototype.toString.apply(Storage.prototype) === '[object StoragePrototype]') {
                    // Safari throws a type error when extending with Storage
                    _sessionStorage = _createReferencedStorage('sessionstorage', _sessionStorage);
                } else {
                    _sessionStorage = _tmp;
                }
            } catch (e) {
                _sessionStorage = null;
            }
        }

        // Build one
        if (!_sessionStorage) {
            // Last ditch effort: use memory storage
            if (!_sessionStorage) {
                _sessionStorage = _createMemoryStorage();
            }
        }

        // Rewire functions to use a prefix and avoid collisions
        // @todo Rewire length for prefixes as well
        _sessionStorage._getItem    = _sessionStorage.getItem;
        _sessionStorage._setItem    = _sessionStorage.setItem;
        _sessionStorage._removeItem = _sessionStorage.removeItem;
        _sessionStorage._key        = _sessionStorage.key;

        _sessionStorage.getItem    = function (key) {
            return _sessionStorage._getItem(PREFIX + key);
        };
        _sessionStorage.setItem    = function (key, data) {
            return _sessionStorage._setItem(PREFIX + key, data);
        };
        _sessionStorage.removeItem = function (key) {
            return _sessionStorage._removeItem(PREFIX + key);
        };
        _sessionStorage.key        = function (index) {
            if ((index = _sessionStorage._key(index)) !== undefined && index !== null) {
                // Chop off the index
                return index.indexOf(PREFIX) === 0 ? index.substr(PREFIX.length) : index;
            }
            return null;
        };
        _sessionStorage.clear      = function () {
            for (var i = _sessionStorage.length, j; i--;) {
                if ((j = _sessionStorage._key(i)).indexOf(PREFIX) === 0) {
                    _sessionStorage._removeItem(j);
                }
            }
        };
        return _sessionStorage;
    }());

    /**
     * @namespace localStorage
     */
    _returnable.localStorage = localStorage = (function () {
        var _localStorage;

        if (top.localStorage || top.globalStorage) {
            try {
                _localStorage = top.localStorage || top.globalStorage[location.hostname];
                _localStorage.setItem(_TESTID, 1);
                _localStorage.removeItem(_TESTID);

                // Now clone sessionStorage so that we may extend it with our own methods
                var _tmp = function () {};
                _tmp.prototype = _localStorage;
                _tmp = new _tmp();
                try {
                    if (_tmp.getItem) {
                        _tmp.setItem(_TESTID, 2);
                        _tmp.removeItem(_TESTID);
                    }
                } catch (e) {
                    // Firefox 14+ throws a security exception when wrapping a native class
                    _tmp = null;
                }

                if (_tmp && !_tmp.getItem) {
                    // Internet Explorer 8 does not inherit the prototype here. We can hack around it using a DOM object
                    _localStorage = _createDOMStorage('localstorage', _localStorage);
                } else if (!_tmp || Object.prototype.toString.apply(Storage.prototype) === '[object StoragePrototype]') {
                    // Safari throws a type error when extending with Storage
                    _localStorage = _createReferencedStorage('localstorage', _localStorage);
                } else {
                    // Spec
                    _localStorage = _tmp;
                }
            } catch (e) {
                _localStorage = null;
            }
        }

        // Did not work, try userData, cookie, or memory:
        if (!_localStorage) {
            _localStorage = NO_COOKIE_FALLBACK ? _createMemoryStorage() : _createCookieStorage();
        }

        // Use the object natively without a prefix
        if (!PREFIX) {
            return _localStorage;
        }

        // Rewire functions to use a prefix and avoid collisions
        // @todo Rewire length for prefixes as well
        _localStorage._getItem    = _localStorage.getItem;
        _localStorage._setItem    = _localStorage.setItem;
        _localStorage._removeItem = _localStorage.removeItem;
        _localStorage._key        = _localStorage.key;

        _localStorage.getItem    = function (key) {
            return _localStorage._getItem(PREFIX + key);
        };
        _localStorage.setItem    = function (key, data) {
            return _localStorage._setItem(PREFIX + key, data);
        };
        _localStorage.removeItem = function (key) {
            return _localStorage._removeItem(PREFIX + key);
        };
        _localStorage.key        = function (index) {
            if ((index = _localStorage._key(index)) !== undefined && index !== null) {
                // Chop off the index
                return index.indexOf(PREFIX) === 0 ? index.substr(PREFIX.length) : index;
            }
            return null;
        };
        _localStorage.clear      = function () {
            for (var i = _localStorage.length, j; i--;) {
                if ((j = _localStorage._key(i)).indexOf(PREFIX) === 0) {
                    _localStorage._removeItem(j);
                }
            }
        };

        return _localStorage;
    }());

    _callbackNow && callback && callback(_returnable);

    return _returnable;
};