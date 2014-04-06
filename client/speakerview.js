var draggable = require('draggable'),
    currentView = window.frames['current-view'],
    nextView = window.frames['next-view'];
draggable(document.getElementById('current-view'));
draggable(document.getElementById('next-view'));

currentView.document.addEventListener('DOMContentLoaded', function() {
    currentView.presentation.connect();
});

nextView.document.addEventListener('DOMContentLoaded', function() {
    nextView.presentation.connect();
});