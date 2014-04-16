var draggable = require('draggable'),
    currentView = window.frames['current-view'],
    nextView = window.frames['next-view'],
    timer = require('./timer');
draggable(document.getElementById('current-view'));
draggable(document.getElementById('next-view'));
draggable(document.getElementById('toolbox'));

currentView.document.addEventListener('DOMContentLoaded', function() {
    currentView.presentation.connect();
});

nextView.document.addEventListener('DOMContentLoaded', function() {
    nextView.presentation.connect();
});

new timer(document.getElementById('toolbox'), parseInt(document.body.getAttribute('data-duration')));