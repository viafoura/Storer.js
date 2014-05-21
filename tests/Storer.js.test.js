(function () {
    // i=1 without prefix, i=0 with prefix
    for (var i = 2, fn; i--;) {
        fn = function (i) {
            var Storer, memoryStorage, cookieStorage, sessionStorage, localStorage, _finished, n = i * 10;

            module('Storer.js with' + (i ? 'out' : '') + ' a prefix');

            test('Initialization', function () {
                var _success;
                expect(6);

                stop(2);

                ok(
                    initStorer(
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

                var substorages = ['localStorage', 'sessionStorage', 'cookieStorage', 'memoryStorage'],
                    i = substorages.length;

                while (i--) {
                    test(substorages[i], (function (subtest) {
                        return function () {
                            expect(18);

                            var substorage = Storer[subtest];

                            ok(substorage.getItem,       subtest + '.getItem exists');
                            ok(substorage.setItem,       subtest + '.setItem exists');
                            ok(substorage.removeItem,    subtest + '.removeItem exists');
                            ok(substorage.clear,         subtest + '.clear exists');
                            ok(substorage.key,           subtest + '.key exists');
                            equal(typeof substorage.length, 'number', subtest + '.length is a number');

                            // Get nothing
                            equal(localStorage.getItem('__' + subtest), null, 'getItem should be empty (last run verification)');

                            // Set
                            substorage.setItem('__' + subtest, n + 1);
                            equal(substorage.getItem('__' + subtest), n + 1, 'setItem ' + (n + 1));

                            substorage.setItem('__' + subtest, n + 2);
                            equal(substorage.getItem('__' + subtest), n + 2, 'setItem ' + (n + 2) + ' (overwrite)');

                            // Key & length from set
                            ok(substorage.key(0), 'key(0) exists');
                            ok(substorage.length > 0, 'length > 0');

                            // Remove
                            substorage.removeItem('__' + subtest);
                            equal(substorage.getItem('__' + subtest), null, 'removeItem');

                            // Set
                            substorage.setItem('__' + subtest, n + 3);
                            equal(substorage.getItem('__' + subtest), n + 3, 'setItem ' + (n + 3));

                            // Expiry
                            substorage.setItem('__' + subtest, n + 4, -1); // Number
                            equal(substorage.getItem('__' + subtest), null, 'setItem ' + (n + 4) + ', expires:' + -1);

                            substorage.setItem('__' + subtest, n + 5, 0); // Number
                            equal(substorage.getItem('__' + subtest), n + 5, 'setItem ' + (n + 5) + ', expires:' + 0);

                            substorage.setItem('__' + subtest, n + 6, new Date(2038, 0, 1)); // Date
                            equal(substorage.getItem('__' + subtest), n + 6, 'setItem ' + (n + 6) + ', expires:' + new Date(2038, 0, 1));

                            substorage.setItem('__' + subtest, n + 7, ("" + parseInt(+new Date / 1000 + 10, 10))); // String
                            equal(substorage.getItem('__' + subtest), n + 7, 'setItem ' + (n + 7) + ', expires:' + ("" + parseInt(+new Date / 1000 + 10, 10)));

                            // Clear
                            substorage.clear();
                            strictEqual(substorage.getItem('__' + subtest), null, 'clear');
                        }
                    }(substorages[i])));
                }
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