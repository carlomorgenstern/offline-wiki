/*jslint browser: true*/
/*global $*/
'use strict';
$(document).ready(function() {
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.register('/serviceworker.js').then(function(registration) {
			console.log('ServiceWorker registration successful with scope: ', registration.scope);
		}).catch(function(err) {
			console.log('ServiceWorker registration failed: ', err);
		});
	} else {
		// ServiceWorker not available
	}

	// fires when the search input field changes
	$('#search').change($('#search').val(), function(searchString) {
		return new promise(function(resolve, reject) {
            $.ajax({
                url: "https://de.wikipedia.org/w/api.php",
                jsonp: "callback",
                dataType: 'jsonp',
                data: {
                    action: "query",
                    titles: searchString,
                    format: "json",
                    redirects: "true",
                    prop: 'extracts|revisions',
                    explaintext: 1,
                    exsentences: 1
                }
            }).done(function(data) {
                console.log(data.query.pages);
                /*var page = data.query.pages[Object.keys(data.query.pages)[0]];

                if ('missing' in page) {
                    reject("not found");
                } else {
                    $("#name").text(page.title);
                    $("#zuletzt").text(page.revisions[0].timestamp);
                    resolve({
                        title: page.title.replace(/\s/g, '_'),
                        pageid: page.pageid
                    });
                }*/
            }).fail(function(error) {
                reject(error);
            });
        });
	})
});