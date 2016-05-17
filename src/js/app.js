/* jslint browser: true */
/* global $, Materialize */
'use strict';
$(document).ready(() => {
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.register('serviceworker.js').then(() => {
			if (!navigator.serviceWorker.controller) {
				location.reload();
			}
		}).catch(error => {
			$('#errorTitle').text('ServiceWorker-Registrierung fehlgeschlagen');
			$('#errorDescription').text('Bitte laden Sie die Seite neu und kontaktieren Sie bei wiederholter Fehlermeldung den Ersteller der Seite.');
			$('#errorCard').removeClass('hide');
			$('#storeOffline').prop('disabled', true);
			console.log('ServiceWorker registration failed: ', error);
		});
	} else {
		$('#errorTitle').text('ServiceWorker nicht vorhanden');
		$('#errorDescription').html($.parseHTML('Ihr Browser implementiert den ServiceWorker nicht, womit Artikel nicht offline gespeichert werden können. ' +
			'Bitte besuchen Sie die Seite mit einem Browser, der ServiceWorker implementiert. <a href="https://jakearchibald.github.io/isserviceworkerready/">(IsServiceWorkerReady?)</a>'));
		$('#errorCard').removeClass('hide');
		$('#storeOffline').prop('disabled', true);
	}

	$('#search').change(() => {
		queryApi($('#search').val()).then(pageTitle => {
			window.location.hash = pageTitle;
		});
	});

	$('#clearSearch').click(() => {
		$('#search').val('');
		window.location.hash = '';
	});

	$('#storeOffline').change(() => {
		if ($('#storeOffline').prop('checked') === true) {
			$('#storeOffline').prop('disabled', true);
			sendMessage('addToCache', $('#trueTitle').text()).catch(error => {
				console.log('Error while adding page to cache: ', error);
			}).then(() => $('#storeOffline').prop('disabled', false));
		} else {
			$('#storeOffline').prop('disabled', true);
			sendMessage('deleteFromCache', $('#trueTitle').text()).catch(error => {
				console.log('Error while deleting page from cache: ', error);
			}).then(() => $('#storeOffline').prop('disabled', false));
		}
	});

	$(window).on('hashchange', () => {
		if (window.location.hash === '') {
			$('#progressBar').removeClass('hide');
			$('#title').text('Offline Wikipedia');
			$('#trueTitle').text('Offline Wikipedia');
			$('#storeOffline').prop('checked', false);
			$('#storeOffline').prop('disabled', true);
			$('#wikiContainer').load('nosearch.html #container', () => {
				sendMessage('listArticles').then(articles => {
					if (articles.length !== 0) {
						$('#offlineArticles').html('');
					}
					articles.forEach(article => {
						$('#offlineArticles').append('<a href="#' + article.title + '" class="collection-item">' + article.title + '</a>');
					});
				}).then(() => $('#progressBar').addClass('hide'));
			});
		} else {
			$('#progressBar').removeClass('hide');
			parsePage(window.location.hash.substring(1))
				.then(displayPage)
				.catch(displayError)
				.then(() => $('#progressBar').addClass('hide'));
		}
	}).trigger('hashchange');

	function queryApi(searchString) {
		return new Promise((resolve, reject) => {
			$.ajax({
				url: 'https://de.wikipedia.org/w/api.php',
				dataType: 'jsonp',
				cache: 'true',
				jsonp: 'callback',
				jsonpCallback: 'wikiQueryCallback',
				data: {
					action: 'query',
					titles: searchString,
					format: 'json',
					redirects: 'true',
					prop: 'extracts|revisions',
					explaintext: 1,
					exsentences: 1
				}
			}).done(data => {
				let page = data.query.pages[Object.keys(data.query.pages)[0]];
				if ('missing' in page) {
					reject('no page found');
				} else {
					resolve(page.title.replace(/\s/g, '_'));
				}
			}).fail(error => {
				reject(error);
			});
		});
	}

	function parsePage(pageTitle) {
		return new Promise((resolve, reject) => {
			$.ajax({
				url: 'https://de.wikipedia.org/w/api.php',
				dataType: 'jsonp',
				cache: 'true',
				jsonp: 'callback',
				jsonpCallback: 'wikiParseCallback',
				data: {
					action: 'parse',
					format: 'json',
					page: pageTitle,
					prop: 'text',
					redirects: 'true',
					disablelimitreport: 'true',
					disableeditsection: 'true',
					disabletoc: 'true'
				}
			}).done(data => {
				if ('error' in data) {
					reject('no page found');
				} else {
					resolve({
						title: pageTitle,
						pageHtml: data.parse.text[Object.keys(data.parse.text)[0]]
					});
				}
			}).fail(error => {
				reject(error);
			});
		});
	}

	function displayPage(page) {
		sendMessage('isInCache', page.title).then(result => {
			if (result) {
				$('#storeOffline').prop('checked', true);
			} else {
				$('#storeOffline').prop('checked', false);
			}
			$('#storeOffline').prop('disabled', false);
		});
		$('#title').text(page.title.replace(/_/g, ' '));
		$('#search').val(page.title.replace(/_/g, ' '));
		$('#trueTitle').text(page.title);
		$('#wikiContainer').html(page.pageHtml);
		$('#wikiContainer a[href^="#"]').attr('href', '');
		$('#wikiContainer a[href^="/wiki/"]').attr('href', function() {
			return decodeURIComponent(this.href.split('#')[0].replace('/wiki/', '#'));
		});
	}

	function displayError(error) {
		if (error === 'no page found') {
			Materialize.toast('Es wurde kein Wikipedia-Artikel für ihre Suche gefunden.', 2000);
		} else {
			Materialize.toast('Fehler beim Herunterladen des Artikels. Bitte probieren Sie es erneut.', 4000);
			console.log('Error while downloading article: ', error);
		}
	}

	function sendMessage(command, identifier) {
		return new Promise(function(resolve, reject) {
			let messageChannel = new MessageChannel();
			messageChannel.port1.onmessage = event => {
				if (event.data.error) {
					reject(event.data.error);
				} else {
					resolve(event.data);
				}
			};
			navigator.serviceWorker.controller.postMessage({
				command: command,
				identifier: identifier
			}, [messageChannel.port2]);
		});
	}
});