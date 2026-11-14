/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "8667d772ede95e97ace2abde32be10f0"
  }, {
    "url": "pwa-512x512.png",
    "revision": "6f8004f19b6a4c335a403ce9b64c68ed"
  }, {
    "url": "pwa-192x192.png",
    "revision": "0e5bd9c4a69f2f372045f4d0ede71bb3"
  }, {
    "url": "index.html",
    "revision": "cfc3b00450a72d7717b4a97abbdca059"
  }, {
    "url": "icon.svg",
    "revision": "b3050e2dddfa02183a6c7b8f5c7828a3"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "1e9940c8a5430a6d81a0801a0c095208"
  }, {
    "url": "assets/index-D8jzUhgd.js",
    "revision": null
  }, {
    "url": "assets/index-BTGiG45W.css",
    "revision": null
  }, {
    "url": "assets/icon.svg",
    "revision": null
  }, {
    "url": "assets/founder.svg",
    "revision": null
  }, {
    "url": "assets/founder-graphic.svg",
    "revision": null
  }, {
    "url": "assets/aistudio/ChatGPT_Image_Nov_11__2026__01_14_21_AM_0b7c75c3.svg",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "1e9940c8a5430a6d81a0801a0c095208"
  }, {
    "url": "icon.svg",
    "revision": "b3050e2dddfa02183a6c7b8f5c7828a3"
  }, {
    "url": "pwa-192x192.png",
    "revision": "0e5bd9c4a69f2f372045f4d0ede71bb3"
  }, {
    "url": "pwa-512x512.png",
    "revision": "6f8004f19b6a4c335a403ce9b64c68ed"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "8667d772ede95e97ace2abde32be10f0"
  }, {
    "url": "manifest.webmanifest",
    "revision": "cf4ead202df1215e64b0e93c6c2cc294"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html"), {
    denylist: [/^\/api\//, /^\/kphube-android-project\.zip$/]
  }));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
