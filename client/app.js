var presentationModule = require('./presentation'),
    viewportObserver = require('./viewport-observer');

window.presentation = new presentationModule(document.getElementsByClassName('slide'));

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