module.exports = function(presentation) {
    'use strict';
    var exports = {};

    exports.toggle = function(event) {
        event.preventDefault();
        if (presentation.isConnected()) {
            presentation.disconnect();
            event.currentTarget.classList.remove('icon-connected');
            event.currentTarget.classList.add('icon-disconnected');
            event.currentTarget.innerHTML = 'Connect to session';
        } else {
            presentation.connect();
            event.currentTarget.classList.remove('icon-disconnected');
            event.currentTarget.classList.add('icon-connected');
            event.currentTarget.innerHTML = 'Disconnect from session';
        }
    };

    return exports;
};