var presentationModule = require('./presentation'),
    viewportObserver = require('./viewport-observer'),
    sidebar = require('./sidebar'),
    controls = require('./controls'),
    presentationName = document.body.getAttribute('data-presentation'),
    isPreviewDeck = window.location.href.indexOf('/preview', window.location.href.length - 8) > 0;

window.presentation = new presentationModule(document.getElementsByClassName('slide'), presentationName, isPreviewDeck);
new sidebar(window.presentation);

new controls(document, window.presentation);

window.addEventListener('resize', viewportObserver.setRatio);
viewportObserver.setRatio();