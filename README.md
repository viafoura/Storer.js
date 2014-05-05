# Storer.js - HTML5 Web Storage for Any Browser [![Build Status](https://travis-ci.org/shahyar/Storer.js.svg?branch=master)](https://travis-ci.org/shahyar/Storer.js)
Originally written for [Viafoura](http://viafoura.com/ "Viafoura is an audience engagement platform for publishers") by Shahyar G, released for public consumption by Viafoura, Inc.

## Introduction
Storer.js is a fallback-reliant, HTML5 Storage-based storage system. It implements a completely cross-browser-compatible system with implementations of `localStorage`, `sessionStorage`, `cookieStorage`, and `memoryStorage`.

All of its storage subsystems implement `getItem`, `setItem`, `removeItem`, `clear`, `key`, and `length`, as the HTML5 Web Storage specification is written. However, there are some enhancements on these methods, and slight deviations from it with `memoryStorage` and `cookieStorage`.

## How it works
It piggybacks on the real HTML5 storage when available, and creates the additional functionality of being able to prepend a 'prefix' to all key names automatically (see initStorer params). This is useful for projects where you would like to use Storage without worrying about name collisions.

It _always_ returns every type of storage, and falls back to others, as listed below. In the worst-case scenario, all the storage subsystems are instances of memoryStorage, which means no persistance is available, but that no code will break while performing actions on the current page.

The fallbacks are as follows:

```javascript
localStorage   = localStorage   || userData    || cookieStorage || memoryStorage;
sessionStorage = sessionStorage || window.name || memoryStorage;
cookieStorage  = cookieStorage  || memoryStorage;
memoryStorage  = memoryStorage;
```

cookieStorage also supports an additional 'global' Boolean argument on all of its methods, allowing you to escape out of the 'prefix' defined, so that you may use it to fetch general cookies as well.

## Usage
`initStorer` is called, takes a callback function, which will return the storage subsystems. Why? This is necessary because the Internet Explorer 7- fallback for `localStorage` is `userData`, which needs to be able to insert an element into the document before proceeding. On any modern (or non-IE7) browser, the callback function is triggered synchronously and immediately. There is no delay at all in this scenario. **domReady or jQuery is required for userData functionality in IE7 or lower.**

In a worst-case scenario, all of the storages are `memoryStorage`, which means the data will not persist across pages. In a best-case scenario, each of the storage types are implemented using native `sessionStorage` and `localStorage` with cookie support as well with `cookieStorage`.

### IEless Version
`Storer-ieless.min.js` has userData and window.name support removed, reducing the minified filesize by approximately 40%. If you do not need IE6 or IE7 support, this version will enable you to still retain the other fallbacks (cookie and memory).

### Examples
Using callback and a custom prefix (callback supports IE7 and lower):

```javascript
initStorer(function (Storer) {
    cookieStorage  = Storer.cookieStorage;
    memoryStorage  = Storer.memoryStorage;
    sessionStorage = Storer.sessionStorage;
    localStorage   = Storer.localStorage;
}, { 'prefix': '_MyStorage_' });
```

Using return (return does not support localStorage in IE7):

```javascript
var Storer = initStorer();
Storer.memoryStorage.setItem('falsey', 0);
```

### Arguments for `initStorer`

```javascript
initStorer([Function callback[, Object params]]);
```

#### Function `callback(Object Storer)`
The callback function to call once the storage has been initialized. In most modern browsers, it is called synchronously. In older versions of IE that require the use of userData for localStorage, it is triggered asynchronously once the page has loaded.

It returns an Object called Storer, which contains cookieStorage, localStorage, memoryStorage, and sessionStorage.

#### Object `params`

```javascript
{
    prefix:         String='' // automatic key prefix for sessionStorage and localStorage
    default_domain: String='' // default domain for cookies
    default_path:   String='' // default path for cookies
```

### Important notice regarding dependencies
For Internet Explorer 7 and lower, initStorer requires a function called domReady, or uses jQuery(document).ready if available. If no function is found, localStorage will silently fail and is not usable in old IE browsers. `domReady` is included in the dependencies subdirectory of this repository. _(In a future revision, this functionality may fall back to cookieStorage when no such function is present.)_

## License
Creative Commons Attribution 3.0 Unported (CC BY 3.0). http://creativecommons.org/licenses/by/3.0/
It's free. All we ask is that you maintain the @copyright and @author comments in the code. Nothing else is necessary.

## Addendum
Here is a cat. =^.^= His name is Frisbee.

-- Copyright (c) 2011 Viafoura, Inc.
