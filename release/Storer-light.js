/*! Storer.js (light)
 * This light version removes userData and window.name storage. In Internet Explorer prior to IE8, they will fall back to cookieStorage and memoryStorage, respectively.
 * @copyright Viafoura, Inc. <viafoura.com>
 * @author Shahyar G <github.com/shahyar>, originally for <github.com/viafoura>
 * @license CC-BY 3.0 <creativecommons.org/licenses/by/3.0>: Keep @copyright, @author intact.
 */

/**
 * This will return an object with each of the storage types.
 * The callback will fire when all of the necessary types have been created, although it's really only necessary
 * for Internet Explorer's userData storage, which requires domReady to begin.
 *
 * @author Shahyar G <github.com/shahyar>, originally for Viafoura, Inc. <viafoura.com>
 * @param {Function} [callback]
 * @param {Object} [params]
 *                 {String}  [prefix='']                 automatic key prefix for sessionStorage and localStorage
 *                 {String}  [default_domain='']         default domain for cookies
 *                 {String}  [default_path='']           default path for cookies
 *                 {Boolean} [no_cookie_fallback=false]  If true, do not use cookies as fallback for localStorage
 * @return {Object} {cookieStorage, localStorage, memoryStorage, sessionStorage}
 * @version 0.1.3
 */
function initStorer(callback, params) {
    "use strict";

    var _TESTID            = '__SG__',
        top                = window,
        PREFIX             = (params = Object.prototype.toString.call(callback) === "[object Object]" ? callback : (params || {})).prefix || '',
        NO_COOKIE_FALLBACK = params.no_cookie_fallback || false,
        _callbackNow       = true,
        cookieStorage, localStorage, memoryStorage, sessionStorage;

    if (params === callback) {
        // Allow passing params without callback
        callback = null;
    }

    // get top within cross-domain limit if we're in an iframe
    try { while (top !== top.top) { top = top.top; } } catch (e) {}

    /**
     * Returns result.value if result has ._end key, or returns result entirely otherwise.
     * Returns null when: result is null or undefined, or end && end > current timestamp.
     * @param {String|Number|Date|null|undefined} end
     * @param {*} result
     * @param {Function} remove_callback
     * @param {String} remove_callback_key
     * @returns {*}
     * @private
     */
    function _checkEnd(end, result, remove_callback, remove_callback_key) {
        if (result === null || result === undefined || (end && parseInt(+new Date() / 1000, 10) > parseInt(end, 10))) {
            // Remove this key from the data set
            remove_callback(remove_callback_key);
            // Return nothing
            return null;
        }
        // Return the actual data
        return result._end !== undefined ? result.value : result;
    }

    /**
     * Parses str into JSON object, but also handles backwards compatibility with 0.0.4 when data was not automatically
     * JSONified. If data._end exists, also runs _checkEnd. When not a valid JSON object, returns str back.
     * @param {String|*} str
     * @param {Function} [remove_callback]
     * @param {String} [callback_key]
     * @returns {*}
     * @private
     */
    function _getJSON(str, remove_callback, callback_key) {
        try {
            var obj = str && JSON.parse(str);
            if (obj) {
                // Backwards compatibility for 0.0.4, when _end did not exist
                if (obj._end !== undefined) {
                    // Check for expiry
                    return _checkEnd(obj._end, obj.value, remove_callback, callback_key);
                }
                return obj;
            }
        } catch (e) {}

        // Non-JSON data (0.0.4)
        return str;
    }

    /**
     * Puts data and end (standardized to seconds) in an object, and returns it for use.
     * If end is valid and end > now, data = null, and remove_callback is called,
     * otherwise, set_callback is called.
     * @param {Object|*} data
     * @param {String|Number|Date} [end]
     * @param {Function} [set_callback]
     * @param {Function} [remove_callback]
     * @param {String} [callback_key]
     * @param {Boolean} [json]
     * @returns {*}
     * @private
     */
    function _storeEnd(data, end, set_callback, remove_callback, callback_key, json) {
        var now = parseInt(+new Date() / 1000, 10);

        switch (typeof end) {
            case "number":
                // Max-age, although we allow end=0 to mimic 0 for cookies
                end = end && parseInt(now + end, 10);
                break;
            case "string":
                // timestamp or Date string
                end = end.length > 4 && "" + parseInt(end, 10) === end ? parseInt(end, 10) : parseInt(+new Date(end) / 1000, 10);
                break;
            case "object":
                if (end.toGMTString) {
                    // Date object
                    end = parseInt(+end / 1000, 10);
                }
                break;
            default:
                end = null;
        }

        data = { value: end && now > end ? null : data, _end: end || null };

        if (data.value === null || data.value === undefined) {
            // Automatically expire this item
            remove_callback && remove_callback(callback_key);
        } else if (json) {
            // Set the data with JSON
            set_callback && set_callback(callback_key, JSON.stringify(data._end ? data : data.value));
        } else {
            // Set the data
            set_callback && set_callback(callback_key, data._end ? data : data.value);
        }

        return data;
    }

    /**
     * Clears expired data from each storage subsystem.
     * @private
     */
    function _clearExpired() {
        var i, j, key;
        // Iterate over every storage subsystem
        for (i in _returnable) {
            // Ignore memoryStorage, as it doesn't have anything to expire
            if (_returnable.hasOwnProperty(i) && i.charAt(0) !== '_' && _returnable[i].STORE_TYPE !== 'memoryStorage') {
                j = 0;
                // Iterate over every key in this subsystem
                while ((key = _returnable[i].key(j++))) {
                    // getItem automatically handles removing expired items
                    _returnable[i].getItem(key);
                }
            }
        }
    }

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
            setItem: function (key, value, end) {
                return StoreRef.setItem(key, value, end);
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
        store.key = function (key) {
            try {
                return StoreRef.key(key);
            } catch (e) { return null; } // IE8 throws an exception on nonexistent keys
        };
        store.getItem = function (key) {
            return StoreRef.getItem(key);
        };
        store.setItem = function (key, value, end) {
            return StoreRef.setItem(key, value, end);
        };
        store.removeItem = function (key) {
            return StoreRef.removeItem(key);
        };
        store.clear = function () {
            return StoreRef.clear();
        };
        Object.defineProperty(store, "length", { get: function () { return StoreRef.length; } });
        return store;
    }

    /**
     * Amends getItem and setItem to support expiry times for HTML5 Storage.
     * @param {Object|Storage} StoreRef
     * @return {Object}
     * @private
     */
    function _adjustHTML5Storage(StoreRef) {
        var _getItem = StoreRef.getItem,
            _setItem = StoreRef.setItem,
            _removeItem = StoreRef._removeItem || StoreRef.removeItem,
            _removeItemCallback = function (key) {
                _removeItem(key);
            };

        StoreRef.getItem       = function (key) {
            return _getJSON(_getItem(key), _removeItemCallback, key);
        };
        StoreRef.setItem       = function (key, data, end) {
            return _storeEnd(
                data,
                end,
                function (key, value) {
                    _setItem(key, value);
                },
                _removeItemCallback,
                key,
                true
            );
        };

        return StoreRef;
    }

    /**
     *
     * @param {Object|Storage} StoreRef
     * @returns {*}
     * @private
     */
    function _assignPrefix(StoreRef) {
        // Use the rest of the object natively without a prefix
        // memoryStorage doesn't need prefixes
        if (!PREFIX || StoreRef.STORE_TYPE === 'memoryStorage') {
            return StoreRef;
        }

        // Rewire functions to use a prefix and avoid collisions
        // @todo Rewire length for prefixes as well
        StoreRef._getItem    = StoreRef.getItem;
        StoreRef._setItem    = StoreRef.setItem;
        StoreRef._removeItem = StoreRef.removeItem;
        StoreRef._key        = StoreRef.key;

        /** Variable # of items in Storage.
         * @const int length
         * @memberof sessionStorage
         * @memberof localStorage */

        /**
         * Returns an item from the current type of Storage.
         * @param {String} key
         * @returns {*}
         * @memberof sessionStorage
         * @memberof localStorage
         */
        StoreRef.getItem    = function (key) {
            return StoreRef._getItem(PREFIX + key);
        };

        /**
         * Sets an item in the current type of Storage.
         * end is expiry: Number = seconds from now, String = date string for Date(), or Date object.
         * @param {String} key
         * @param {*} data
         * @param {int|String|Date} [end]
         * @memberof sessionStorage
         * @memberof localStorage
         */
        StoreRef.setItem    = function (key, data, end) {
            return StoreRef._setItem(PREFIX + key, data, end);
        };

        /**
         * Removes key from the current Storage instance, if it has been set.
         * @param {String} key
         * @memberof sessionStorage
         * @memberof localStorage
         */
        StoreRef.removeItem = function (key) {
            return StoreRef._removeItem(PREFIX + key);
        };

        StoreRef._key        = StoreRef.key;
        /**
         * Gets the key (if any) at index, from the current Storage instance.
         * @param {int} index
         * @returns {String|null}
         * @memberof sessionStorage
         * @memberof localStorage
         */
        StoreRef.key        = function (index) {
            if ((index = StoreRef._key(index)) !== undefined && index !== null) {
                // Chop off the index
                return index.indexOf(PREFIX) === 0 ? index.substr(PREFIX.length) : index;
            }
            return null;
        };

        if (StoreRef.STORE_TYPE !== 'cookieStorage') {
            // cookieStorage has its own clear which supports prefixes
            /**
             * Removes all the current keys from this Storage instance.
             * @memberof sessionStorage
             * @memberof localStorage
             */
            StoreRef.clear      = function () {
                for (var i = StoreRef.length, key; i--;) {
                    if ((key = StoreRef._key(i)).indexOf(PREFIX) === 0) {
                        StoreRef._removeItem(key);
                    }
                }
            };
        } else {
            // cookieStorage is the only one which implements hasItem
            if (StoreRef.hasItem) {
                StoreRef._hasItem = StoreRef.hasItem;
                StoreRef.hasItem = function (key) {
                    return StoreRef._hasItem(PREFIX + key);
                };
            }
        }

        return StoreRef;
    }

    /**
     * Returns memoryStorage on failure
     * @param {String} [cookie_prefix] An additional prefix, useful for isolating fallbacks for local/sessionStorage.
     * @return {cookieStorage|memoryStorage}
     */
    function _createCookieStorage(cookie_prefix) {
        cookie_prefix        = (cookie_prefix || '');
        var _cookiergx       = new RegExp("(?:^|;)\\s*" + cookie_prefix + PREFIX + "[^=;]+\\s*(?:=[^;]*)?", "g"),
            _nameclean       = new RegExp("^;?\\s*" + cookie_prefix + PREFIX),
            _cookiergxGlobal = new RegExp("(?:^|;)\\s*[^=;]+\\s*(?:=[^;]*)?", "g"),
            _namecleanGlobal = new RegExp("^;?\\s*"),
            _expire          = (new Date(1979)).toGMTString(),
            /**
             * @namespace cookieStorage
             * @memberof Storer
             * @public
             * @global
             */
            _cookieStorage   = {
            /** @const String STORE_TYPE
             * @default "cookieStorage"
             * @memberof cookieStorage */
            STORE_TYPE: 'cookieStorage',
            /** Default domain to use in cookieStorage.setItem (set by initStorer)
             * @const String DEFAULT_DOMAIN
             * @memberof cookieStorage */
            DEFAULT_DOMAIN: escape(params.default_domain || ''),
            /** Default path to use in cookieStorage.setItem (set by initStorer)
             * @const String DEFAULT_PATH
             * @memberof cookieStorage */
            DEFAULT_PATH: escape(params.default_path || ''),

            /** Variable # of items in storage
             * @const int length
             * @memberof cookieStorage */
            length: 0,

            /**
             * Returns the cookie key at idx.
             * @param {int} idx
             * @param {Boolean} [global=false] Omits prefix.
             * @return {*}
             * @memberof cookieStorage
             */
            key: function (idx, global) {
                var cookies = _cookieStorage.getAll(false, global);
                return cookies[idx] ? cookies[idx].key : undefined;
            },

            /**
             * Clears all cookies for this prefix.
             * @param {Boolean} [global=false] true omits the prefix, and erases all cookies
             * @memberof cookieStorage
             */
            clear: function (global) {
                var cookies = _cookieStorage.getAll(false, global),
                    i = cookies.length;

                while (i--) {
                    // Don't use static _removeItemFn reference, because cookieStorage.clear is not handled by _assignPrefix
                    _cookieStorage.removeItem(cookies[i].key);
                }
            },

            /**
             * Returns an Array of Objects of key-value pairs, or an Object with properties-values plus length (as_object).
             * @param {Boolean} [as_object=false] true returns a single object of key-value pairs
             * @param {Boolean} [global=false] true gets all cookies, omitting the default prefix
             * @return {Object[]|Object}
             * @memberof cookieStorage
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
             * Get a cookie by name.
             * @param {String} key
             * @param {Boolean} [global=false] true omits the prefix, and searches for a match "globally"
             * @return {String}
             * @memberof cookieStorage
             */
            getItem: function (key, global) {
                if (!key || !_hasItemFn(key, global)) {
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
             * @param {Boolean} [global=false] true omits prefix, defines the cookie "globally"
             * @return {Boolean}
             * @memberof cookieStorage
             **/
            setItem: function (key, value, end, path, domain, is_secure, global) {
                if (!key || key === 'expires' || key === 'max-age' || key === 'path' || key === 'domain' || key === 'secure') {
                    return false;
                }

                var sExpires = "",
                    store_end = _storeEnd(value, end);
                if (store_end._end !== null) {
                    sExpires = "; expires=" + (new Date(store_end._end * 1000)).toGMTString();
                }

                if (store_end.value !== null && value !== undefined && value !== null) {
                    domain = (domain = typeof domain === 'string' ? escape(domain) : _cookieStorage.DEFAULT_DOMAIN) ? '; domain=' + domain : '';
                    path   = (path   = typeof path   === 'string' ? escape(path)   : _cookieStorage.DEFAULT_PATH)   ? '; path=' + path : '';
                    document.cookie = escape((global ? '' : cookie_prefix) + key) + '=' + escape(value) + sExpires + domain + path + (is_secure ? '; secure' : '');

                    _updateLength();
                    return true;
                }

                return _removeItemFn(key, domain, path, is_secure, global);
            },

            /**
             * Get a cookie by name
             * @param {String} key
             * @param {String} [path]
             * @param {String} [domain]
             * @param {Boolean} [is_secure]
             * @param {Boolean} [global=false] Omits prefix.
             * @memberof cookieStorage
             */
            removeItem: function (key, domain, path, is_secure, global) {
                if (!key || !_hasItemFn(key, global)) {
                    return;
                }

                domain = (domain = typeof domain === 'string' ? escape(domain) : _cookieStorage.DEFAULT_DOMAIN) ? '; domain=' + domain : '';
                path   = (path   = typeof path   === 'string' ? escape(path)   : _cookieStorage.DEFAULT_PATH)   ? '; path=' + path : '';
                document.cookie = escape((global ? '' : cookie_prefix) + key) + '=; expires=' + _expire + domain + path + (is_secure ? '; secure' : '');

                _updateLength();
            },

            /**
             * Returns true if a cookie with that name was found, false otherwise
             * @param {String} key
             * @param {Boolean} [global=false] Omits prefix.
             * @param {Boolean}
             * @memberof cookieStorage
             */
            hasItem: function (key, global) {
                return (new RegExp('(?:^|;) *' + escape((global ? '' : cookie_prefix) + key) + '=')).test(document.cookie);
            }
        },
        // Keep backups of these functions, as they may be overriden by _assignPrefix
            _removeItemFn = _cookieStorage.removeItem,
            _hasItemFn = _cookieStorage.hasItem;

        /**
         * Updates cookieStorage.length on update
         * @private
         */
        function _updateLength() {
            _cookieStorage.length = _cookieStorage.getAll().length;
        }

        _cookieStorage.setItem(_TESTID, 4);
        if (_cookieStorage.getItem(_TESTID) == 4) {
            _cookieStorage.removeItem(_TESTID);
            return _assignPrefix(_cookieStorage);
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
            /** @const String STORE_TYPE
             * @default "memoryStorage"
             * @memberof memoryStorage */
            STORE_TYPE: 'memoryStorage',

            /** Variable # of items in storage
             * @const int length
             * @memberof memoryStorage */
            length: 0,

            /**
             * Get key name by id
             * @param {int} i
             * @return {String|null}
             * @memberof memoryStorage
             */
            key: function (i) {
                return _keys[i];
            },

            /**
             * Get an item
             * @param {String} key
             * @return {*}
             * @memberof memoryStorage
             */
            getItem: function (key) {
                return _checkEnd(_data[key] && _data[key]._end, _data[key], _memoryStorage.removeItem, key);
            },

            /**
             * Set an item
             * @param {String} key
             * @param {String} data
             * @param {String|Number|Date} [end]
             * @memberof memoryStorage
             */
            setItem: function (key, data, end) {
                if (data !== null && data !== undefined) {
                    _ikey[key] === undefined && (_ikey[key] = (_memoryStorage.length = _keys.push(key)) - 1);
                    return (_data[key] = _storeEnd(data, end)).value;
                }
                return _memoryStorage.removeItem(key);
            },

            /**
             * Removes an item
             * @param {String} key
             * @return {Boolean}
             * @memberof memoryStorage
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
             * @memberof memoryStorage
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

    if (callback) {
        // Create a callback wrapper to empty expired data preemptively
        callback = (function (callback) {
            return function () {
                callback(_returnable);
                setTimeout(_clearExpired, 100); // delay expiration
            };
        }(callback));
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
     * @mixes localStorage
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
                // jshint -W055
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
                    _sessionStorage = _adjustHTML5Storage(_createDOMStorage('sessionStorage', _sessionStorage));
                } else if (!_tmp || Object.prototype.toString.apply(Storage.prototype) === '[object StoragePrototype]') {
                    // Safari throws a type error when extending with Storage
                    _sessionStorage = _adjustHTML5Storage(_createReferencedStorage('sessionStorage', _sessionStorage));
                } else {
                    _sessionStorage = _adjustHTML5Storage(_tmp);
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

        // cookieStorage already calls _assignPrefix
        return _sessionStorage.STORE_TYPE === 'cookieStorage' ? _sessionStorage : _assignPrefix(_sessionStorage);
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
                // jshint -W055
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
                    _localStorage = _adjustHTML5Storage(_createDOMStorage('localStorage', _localStorage));
                } else if (!_tmp || Object.prototype.toString.apply(Storage.prototype) === '[object StoragePrototype]') {
                    // Safari throws a type error when extending with Storage
                    _localStorage = _adjustHTML5Storage(_createReferencedStorage('localStorage', _localStorage));
                } else {
                    // Spec
                    _localStorage = _adjustHTML5Storage(_tmp);
                }
            } catch (e) {
                _localStorage = null;
            }
        }

        // Did not work, try alternatives...
        if (!_localStorage) {
            // Try cookie or memory
            _localStorage = NO_COOKIE_FALLBACK ? _createMemoryStorage() : _createCookieStorage('localStorage');
        }

        // cookieStorage already calls _assignPrefix
        return _localStorage.STORE_TYPE === 'cookieStorage' ? _localStorage : _assignPrefix(_localStorage);
    }());

    _callbackNow && callback && callback(_returnable);

    return _returnable;
}

window.initStorer = initStorer;
