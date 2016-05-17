/* jslint worker:true */
/* global caches */
'use strict';
var CACHE_VERSION = '1';
var CACHE_NAME = 'offline-wiki-cache-v' + CACHE_VERSION;
var tmpCache = {};

self.addEventListener('install', event => {
	event.waitUntil(
		caches.open(CACHE_NAME).then(cache => {
			return cache.addAll([
				'index.html',
				'nosearch.html',
				'css/styles.css',
				'fonts/MaterialIcons-Regular.woff2',
				'fonts/roboto/Roboto-Bold.woff2',
				'fonts/roboto/Roboto-Light.woff2',
				'fonts/roboto/Roboto-Medium.woff2',
				'fonts/roboto/Roboto-Regular.woff2',
				'fonts/roboto/Roboto-Thin.woff2',
				'js/bundle.js',
				'https://de.wikipedia.org/w/load.php?debug=false&lang=de&modules=site&only=styles&skin=vector'
			]);
		})
	);
});

self.addEventListener('activate', event => {
	let cacheWhitelist = [CACHE_NAME];
	event.waitUntil(
		caches.keys().then(cacheNames => {
			return Promise.all(
				cacheNames.map(cacheName => {
					if (cacheWhitelist.indexOf(cacheName) === -1) {
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
});

self.addEventListener('fetch', event => {
	let requestUrl = new URL(event.request.url);
	event.respondWith(
		caches.match(event.request).then(matchResponse => {
			if (matchResponse) {
				return matchResponse;
			}
			return fetch(event.request.clone()).then(response => {
				if (requestUrl.hostname === 'de.wikipedia.org' && requestUrl.pathname === '/w/api.php' && requestUrl.search.includes('action=parse') && requestUrl.search.includes('page')) {
					tmpCache[extractParameterValueFromUrl(requestUrl, 'page')] = {
						request: event.request,
						response: response.clone()
					};
				}
				return response;
			});
		})
	);
});

self.addEventListener('message', event => {
	caches.open(CACHE_NAME).then(cache => {
		let identifier = encodeURIComponent(event.data.identifier);
		if (event.data.command === 'addToCache') {
			if (identifier in tmpCache) {
				cache.put(tmpCache[identifier].request.clone(), tmpCache[identifier].response.clone())
					.then(() => {
						event.ports[0].postMessage({
							action: 'added',
							identifier: identifier,
							url: tmpCache[identifier].request.url
						});
					});
			} else {
				throw 'Requested page is not in temporary cache: ' + identifier;
			}
		} else if (event.data.command === 'deleteFromCache') {
			cache.keys().then(requests => {
				requests.some(request => {
					if (extractParameterValueFromUrl(new URL(request.url), 'page') === identifier) {
						cache.delete(request).then(() => {
							event.ports[0].postMessage({
								action: 'deleted',
								identifier: identifier,
								url: request.url
							});
							return true;
						});
					}
				});
			});
		} else if (event.data.command === 'isInCache') {
			let result = false;
			cache.keys().then(requests => {
				result = requests.some(request => {
					if (extractParameterValueFromUrl(new URL(request.url), 'page') === identifier) {
						return true;
					}
				});
			}).then(() => {
				event.ports[0].postMessage(result);
			});
		} else if (event.data.command === 'listArticles') {
			let articles = [];
			cache.keys().then(requests => {
				requests.forEach(request => {
					let requestUrl = new URL(request.url);
					if (requestUrl.search.includes('action=parse')) {
						articles.push({
							title: decodeURIComponent(extractParameterValueFromUrl(requestUrl, 'page'))
						});
					}
				});
			}).then(() => {
				event.ports[0].postMessage(articles);
			});
		} else {
			throw 'Unknown command: ' + event.data.command;
		}
	}).catch(error => {
		event.ports[0].postMessage({
			error: error
		});
	});
});

function extractParameterValueFromUrl(url, parameter) {
	if ('search' in url && typeof url.search == 'string') {
		let parameterArray = url.search.substring(1).split('&');
		let parameterValue = false;
		parameterArray.some((parameterString) => {
			if (parameterString.indexOf(parameter) === 0) {
				parameterValue = parameterString.split("=")[1];
				return true;
			}
		});
		if (parameterValue !== false) {
			return parameterValue;
		}
	}
	return false;
}