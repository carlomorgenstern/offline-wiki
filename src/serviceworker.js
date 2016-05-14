/*jslint browser: true*/
/*global self, caches*/
'use strict';
var CACHE_NAME = 'offline-wiki-cache-v1';
var urlsToCache = [
	'/',
	'/css/styles.css',
	'/fonts/MaterialIcons-Regular.woff2',
	'/fonts/roboto/Roboto-Bold.woff2',
	'/fonts/roboto/Roboto-Light.woff2',
	'/fonts/roboto/Roboto-Medium.woff2',
	'/fonts/roboto/Roboto-Regular.woff2',
	'/fonts/roboto/Roboto-Thin.woff2',
	'/js/bundle.js'
];

// Set the callback for the install step
self.addEventListener('install', function(event) {
	event.waitUntil(
		caches.open(CACHE_NAME)
		.then(function(cache) {
			console.log('Opened cache');
			return cache.addAll(urlsToCache);
		})
	);
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        console.log("Catched event - logging request object");
        console.log(event.request);
        return fetch(event.request);
        /*if (response) {
          return response;
        }

        var fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          function(response) {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have 2 stream.
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );*/
      }
    )
  );
});