(function () {
    // i=1 without prefix, i=0 with prefix
    for (var i = 2, fn; i--;) {
        fn = function (i) {
            var memoryStorage, cookieStorage, sessionStorage, localStorage, _finished, n = i * 10;

            module('Storer.js with' + (i ? 'out' : '') + ' a prefix');

            test('Initialization', function () {
                var Storer, _success;
                expect(6);

                stop(2);

                ok(
                    Storer = initStorer(
                        {
                            prefix: i ? '' : '__StorerTestPrefix__'
                        }
                    ),
                    'initStorer (without callback) should always return an object'
                );

                ok(
                    Storer = initStorer(
                        function (Storer) {
                            // Callback for asynchronous definition
                            ok(memoryStorage  = Storer.memoryStorage,  'Storer.memoryStorage exists');
                            ok(cookieStorage  = Storer.cookieStorage,  'Storer.cookieStorage exists');
                            ok(sessionStorage = Storer.sessionStorage, 'Storer.sessionStorage exists');
                            ok(localStorage   = Storer.localStorage,   'Storer.localStorage exists');

                            _success = true;
                            start();
                        }, {
                            prefix: i ? '' : '__StorerTestPrefix__'
                        }
                    ),
                    'initStorer should always return an object'
                );

                // Synchronous definitions
                memoryStorage  = Storer.memoryStorage;
                cookieStorage  = Storer.cookieStorage;
                sessionStorage = Storer.sessionStorage;
                // localStorage exists but not useable in IE7 synchronously; must use asynchronous callback
                localStorage   = Storer.localStorage;

                start();

                setTimeout(function () {
                    if (!_success) {
                        ok(false, 'initStorer took too long');
                        start();
                    }
                }, 2500);
            });

            QUnit.testDone(function (test_data) {
                if (test_data.name !== 'Initialization' || _finished) {
                    return;
                }
                _finished = true;

                test('memoryStorage', function () {
                    expect(14);

                    ok(memoryStorage.getItem,       'memoryStorage.getItem exists');
                    ok(memoryStorage.setItem,       'memoryStorage.setItem exists');
                    ok(memoryStorage.removeItem,    'memoryStorage.removeItem exists');
                    ok(memoryStorage.clear,         'memoryStorage.clear exists');
                    ok(memoryStorage.key,           'memoryStorage.key exists');
                    equal(typeof memoryStorage.length, 'number', 'memoryStorage.length is a number');

                    equal(localStorage.getItem('__memoryStorage'), null, 'getItem should be empty (last run verification)');
                    memoryStorage.setItem('__memoryStorage', n + 1);
                    equal(memoryStorage.getItem('__memoryStorage'), n + 1, 'setItem ' + (n + 1));
                    memoryStorage.setItem('__memoryStorage', n + 2);
                    equal(memoryStorage.getItem('__memoryStorage'), n + 2, 'setItem ' + (n + 2) + ' (overwrite)');
                    ok(memoryStorage.key(0), 'key(0) exists');
                    ok(memoryStorage.length > 0, 'length > 0');
                    memoryStorage.removeItem('__memoryStorage');
                    equal(memoryStorage.getItem('__memoryStorage'), null, 'removeItem');
                    memoryStorage.setItem('__memoryStorage', n + 3);
                    equal(memoryStorage.getItem('__memoryStorage'), n + 3, 'setItem ' + (n + 3));
                    memoryStorage.clear();
                    equal(memoryStorage.getItem('__memoryStorage'), null, 'clear');
                });

                test('cookieStorage', function () {
                    expect(14);

                    ok(cookieStorage.getItem,       'cookieStorage.getItem exists');
                    ok(cookieStorage.setItem,       'cookieStorage.setItem exists');
                    ok(cookieStorage.removeItem,    'cookieStorage.removeItem exists');
                    ok(cookieStorage.clear,         'cookieStorage.clear exists');
                    ok(cookieStorage.key,           'cookieStorage.key exists');
                    equal(typeof cookieStorage.length, 'number', 'cookieStorage.length is a number');

                    equal(localStorage.getItem('__cookieStorage'), null, 'getItem should be empty (last run verification)');
                    cookieStorage.setItem('__cookieStorage', n + 1);
                    equal(cookieStorage.getItem('__cookieStorage'), n + 1, 'setItem ' + (n + 1));
                    cookieStorage.setItem('__cookieStorage', n + 2);
                    equal(cookieStorage.getItem('__cookieStorage'), n + 2, 'setItem ' + (n + 2) + ' (overwrite)');
                    ok(cookieStorage.key(0), 'key(0) exists');
                    ok(cookieStorage.length > 0, 'length > 0');
                    cookieStorage.removeItem('__cookieStorage');
                    equal(cookieStorage.getItem('__cookieStorage'), null, 'removeItem');
                    cookieStorage.setItem('__cookieStorage', 3);
                    equal(cookieStorage.getItem('__cookieStorage'), 3, 'setItem ' + (n + 3));
                    cookieStorage.clear();
                    equal(cookieStorage.getItem('__cookieStorage'), null, 'clear');
                });

                test('sessionStorage', function () {
                    expect(14);

                    ok(sessionStorage.getItem,      'sessionStorage.getItem exists');
                    ok(sessionStorage.setItem,      'sessionStorage.setItem exists');
                    ok(sessionStorage.removeItem,   'sessionStorage.removeItem exists');
                    ok(sessionStorage.clear,        'sessionStorage.clear exists');
                    ok(sessionStorage.key,          'sessionStorage.key exists');
                    equal(typeof sessionStorage.length, 'number', 'sessionStorage.length is a number');

                    equal(localStorage.getItem('__sessionStorage'), null, 'getItem should be empty (last run verification)');
                    sessionStorage.setItem('__sessionStorage', n + 1);
                    equal(sessionStorage.getItem('__sessionStorage'), n + 1, 'setItem ' + (n + 1));
                    sessionStorage.setItem('__sessionStorage', n + 2);
                    equal(sessionStorage.getItem('__sessionStorage'), n + 2, 'setItem ' + (n + 2) + ' (overwrite)');
                    ok(sessionStorage.key(0), 'key(0) exists');
                    ok(sessionStorage.length > 0, 'length > 0');
                    sessionStorage.removeItem('__sessionStorage');
                    equal(sessionStorage.getItem('__sessionStorage'), null, 'removeItem');
                    sessionStorage.setItem('__sessionStorage', n + 3);
                    equal(sessionStorage.getItem('__sessionStorage'), n + 3, 'setItem ' + (n + 3));
                    sessionStorage.clear();
                    equal(sessionStorage.getItem('__sessionStorage'), null, 'clear');
                });

                test('localStorage', function () {
                    expect(14);

                    ok(localStorage.getItem,       'localStorage.getItem exists');
                    ok(localStorage.setItem,       'localStorage.setItem exists');
                    ok(localStorage.removeItem,    'localStorage.removeItem exists');
                    ok(localStorage.clear,         'localStorage.clear exists');
                    ok(localStorage.key,           'localStorage.key exists');
                    equal(typeof localStorage.length, 'number', 'localStorage.length is a number');

                    equal(localStorage.getItem('__localStorage'), null, 'getItem should be empty (last run verification)');
                    localStorage.setItem('__localStorage', n + 1);
                    equal(localStorage.getItem('__localStorage'), n + 1, 'setItem ' + (n + 1));
                    localStorage.setItem('__localStorage', n + 2);
                    equal(localStorage.getItem('__localStorage'), n + 2, 'setItem ' + (n + 2) + ' (overwrite)');
                    ok(localStorage.key(0), 'key(0) exists');
                    ok(localStorage.length > 0, 'length > 0');
                    localStorage.removeItem('__localStorage');
                    equal(localStorage.getItem('__localStorage'), null, 'removeItem');
                    localStorage.setItem('__localStorage', n + 3);
                    equal(localStorage.getItem('__localStorage'), n + 3, 'setItem ' + (n + 3));
                    localStorage.clear(i);
                    equal(localStorage.getItem('__localStorage'), null, 'clear');
                });
            });
        };

        if (i) {
            fn(i);
        } else {
            QUnit.moduleDone((function (fn, i) {
                return function (module_data) {
                    if (module_data.name === 'Storer.js without a prefix' && i !== false) {
                        i = false;
                        fn(i);
                    }
                };
            }(fn, i)));
        }
    }
}());