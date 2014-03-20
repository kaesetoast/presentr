var presentationModule = require('./presentation'),
    viewportObserver = require('./viewport-observer'),
    sidebar = require('./sidebar'),
    presentationName = document.body.getAttribute('data-presentation'),
    isPreviewDeck = window.location.href.indexOf('/preview', window.location.href.length - 8) > 0;

window.presentation = new presentationModule(document.getElementsByClassName('slide'), presentationName, isPreviewDeck);
new sidebar(window.presentation);

document.addEventListener('keydown', function(e) {
    'use strict';
    if (e.keyCode === 37) {
        window.presentation.prev();
    } else if (e.keyCode === 39) {
        window.presentation.next();
    }
});

window.addEventListener('resize', viewportObserver.setRatio);
viewportObserver.setRatio();